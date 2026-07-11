import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

// Webhook payloads we care about. We intentionally don't acknowledge other
// event types — return 200 to keep Stripe from retrying, but do no work.
const HANDLED_EVENT_TYPES = new Set<Stripe.Event['type']>([
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'charge.refunded',
]);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: { message: 'Missing stripe-signature header' } },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logger.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: { message: 'Webhook secret is not configured' } },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error({ err }, 'Webhook signature verification failed');
    return NextResponse.json(
      { error: { message: 'Webhook signature verification failed' } },
      { status: 400 }
    );
  }

  // Acknowledge unhandled event types so Stripe doesn't retry, but do no work.
  if (!HANDLED_EVENT_TYPES.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event);
        break;
    }
  } catch (err) {
    // Return 500 so Stripe retries with exponential backoff. We've already
    // done partial work, but Prisma txns ensure atomicity per-handler.
    logger.error({ err, eventId: event.id, eventType: event.type }, 'Webhook handler error');
    return NextResponse.json(
      { error: { message: 'Webhook handler failed' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

/**
 * Idempotency: Stripe re-delivers events. If we've already recorded this
 * event id on a Transaction, treat it as a replay and short-circuit.
 */
async function isEventAlreadyProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.transaction.findFirst({
    where: { stripeEventId: eventId },
    select: { id: true },
  });
  return existing !== null;
}

async function handlePaymentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const eventType = paymentIntent.metadata?.type;

  if (await isEventAlreadyProcessed(event.id)) {
    logger.info({ eventId: event.id, paymentIntentId: paymentIntent.id }, 'Replay ignored');
    return;
  }

  if (eventType === 'order_payment') {
    await handleOrderPaymentSucceeded(paymentIntent, event.id);
  } else if (eventType === 'wallet_deposit') {
    await handleWalletDepositSucceeded(paymentIntent, event.id);
  } else {
    logger.warn({ paymentIntentId: paymentIntent.id, eventType }, 'Unknown metadata type');
  }
}

async function handleOrderPaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  eventId: string
) {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) {
    logger.error({ paymentIntentId: paymentIntent.id }, 'order_payment intent missing orderId');
    return;
  }

  const transaction = await prisma.transaction.findFirst({
    where: { paymentIntentId: paymentIntent.id, status: 'PENDING' },
  });

  if (!transaction) {
    logger.warn(
      { paymentIntentId: paymentIntent.id, orderId },
      'No PENDING transaction for order payment'
    );
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Mark the charge as completed and record the event id for idempotency.
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED', stripeEventId: eventId },
    });

    // Move the order into PROCESSING. We don't mark it COMPLETED here — that
    // happens when the fulfillment provider finishes the order.
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (order && order.status === 'PENDING') {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'PROCESSING' },
      });

      await tx.orderLog.create({
        data: {
          orderId,
          action: 'PAYMENT_SUCCEEDED',
          oldValue: 'PENDING',
          newValue: 'PROCESSING',
          performedBy: 'STRIPE_WEBHOOK',
          note: `PaymentIntent ${paymentIntent.id}`,
        },
      });
    }
  });

  logger.info({ orderId, paymentIntentId: paymentIntent.id }, 'Order payment succeeded');
}

async function handleWalletDepositSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  eventId: string
) {
  const transaction = await prisma.transaction.findFirst({
    where: { paymentIntentId: paymentIntent.id, status: 'PENDING' },
    include: { wallet: true },
  });

  if (!transaction) {
    logger.warn({ paymentIntentId: paymentIntent.id }, 'No PENDING transaction for wallet deposit');
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED', stripeEventId: eventId },
    });

    await tx.wallet.update({
      where: { id: transaction.walletId },
      data: { balance: { increment: transaction.amount } },
    });
  });

  await prisma.notification.create({
    data: {
      userId: transaction.wallet.userId,
      type: 'PAYMENT_SUCCESS',
      title: 'Wallet topped up',
      message: `$${Number(transaction.amount).toFixed(2)} has been added to your wallet.`,
    },
  });

  logger.info({ paymentIntentId: paymentIntent.id, transactionId: transaction.id }, 'Wallet deposit succeeded');
}

async function handlePaymentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const eventType = paymentIntent.metadata?.type;

  if (await isEventAlreadyProcessed(event.id)) {
    logger.info({ eventId: event.id, paymentIntentId: paymentIntent.id }, 'Replay ignored');
    return;
  }

  const failureMessage =
    paymentIntent.last_payment_error?.message ?? 'Payment failed';

  const transaction = await prisma.transaction.findFirst({
    where: { paymentIntentId: paymentIntent.id, status: 'PENDING' },
    include: { wallet: true },
  });

  if (!transaction) {
    logger.warn({ paymentIntentId: paymentIntent.id }, 'No PENDING transaction for failed payment');
    return;
  }

  const orderId = paymentIntent.metadata?.orderId;

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        stripeEventId: event.id,
        failureMessage,
      },
    });

    // For order payments, mark the order CANCELLED so it doesn't sit in PENDING.
    if (eventType === 'order_payment' && orderId) {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (order && order.status === 'PENDING') {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED', failureReason: failureMessage },
        });

        await tx.orderLog.create({
          data: {
            orderId,
            action: 'PAYMENT_FAILED',
            oldValue: 'PENDING',
            newValue: 'CANCELLED',
            performedBy: 'STRIPE_WEBHOOK',
            note: failureMessage,
          },
        });
      }
    }
  });

  // Notify the user.
  await prisma.notification.create({
    data: {
      userId: transaction.wallet.userId,
      type: 'PAYMENT_FAILED',
      title: eventType === 'order_payment' ? 'Order payment failed' : 'Wallet top-up failed',
      message: failureMessage,
    },
  });

  logger.info(
    { paymentIntentId: paymentIntent.id, eventType, failureMessage },
    'Payment failed'
  );
}

/**
 * Stripe sends this when a refund is issued. We don't always issue refunds
 * via our admin endpoint (admins can also credit the wallet without a
 * Stripe call when the order was wallet-paid), so this handler is best-effort:
 * it just records the refund id on the matching refund Transaction.
 */
async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : null;

  if (!paymentIntentId) return;

  const refund = charge.refunds?.data?.[0];
  if (!refund) return;

  // The refund Transaction we created in the admin endpoint has the orderId
  // in its metadata. Find the most recent REFUND Transaction for this
  // payment intent and stamp the Stripe refund id on it.
  const transaction = await prisma.transaction.findFirst({
    where: {
      paymentIntentId,
      type: 'REFUND',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!transaction) {
    logger.warn(
      { paymentIntentId, stripeRefundId: refund.id },
      'Refund event with no matching REFUND Transaction'
    );
    return;
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      metadata: {
        ...((transaction.metadata as Record<string, unknown>) ?? {}),
        stripeRefundId: refund.id,
      },
    },
  });
}
