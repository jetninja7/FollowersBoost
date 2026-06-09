import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: { message: 'Missing stripe-signature header' } },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: { message: 'Webhook signature verification failed' } },
      { status: 400 }
    );
  }

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    try {
      // Find transaction by payment intent ID
      const transaction = await prisma.transaction.findFirst({
        where: {
          paymentIntentId: paymentIntent.id,
          status: 'PENDING',
        },
        include: {
          wallet: true,
        },
      });

      if (!transaction) {
        console.error('Transaction not found for payment intent:', paymentIntent.id);
        return NextResponse.json({ received: true });
      }

      // Update transaction and wallet in a transaction
      await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'COMPLETED' },
        });

        // Add funds to wallet
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              increment: transaction.amount,
            },
          },
        });
      });

      console.log('Payment successful, wallet updated:', transaction.id);
    } catch (error) {
      console.error('Error processing payment success:', error);
      return NextResponse.json(
        { error: { message: 'Failed to process payment' } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
