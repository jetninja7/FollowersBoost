import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { stripe, isStripeEnabled } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Get order
    const order = await prisma.order.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: { message: 'Order not found' } },
        { status: 404 }
      );
    }

    // Check if order can be cancelled
    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      return NextResponse.json(
        { error: { message: 'Order cannot be cancelled' } },
        { status: 400 }
      );
    }

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: { message: 'Wallet not found' } },
        { status: 404 }
      );
    }

    // Find the original payment transaction for this order
    const paymentTransaction = await prisma.transaction.findFirst({
      where: {
        walletId: wallet.id,
        type: 'ORDER_PAYMENT',
        metadata: {
          path: ['orderId'],
          equals: order.id,
        },
      },
    });

    // If order was paid with Stripe, issue refund to card
    if (
      paymentTransaction &&
      paymentTransaction.paymentMethod === 'STRIPE' &&
      paymentTransaction.paymentIntentId &&
      isStripeEnabled()
    ) {
      try {
        await stripe.refunds.create({
          payment_intent: paymentTransaction.paymentIntentId,
          metadata: {
            orderId: order.id,
            reason: 'user_cancellation',
          },
        });
        logger.info(
          { orderId: order.id, paymentIntentId: paymentTransaction.paymentIntentId },
          'Stripe refund initiated'
        );
      } catch (error) {
        // Log the error but continue with wallet credit
        // User gets wallet credit immediately, Stripe refund may process separately
        logger.error(
          { err: error, orderId: order.id, paymentIntentId: paymentTransaction.paymentIntentId },
          'Failed to create Stripe refund, proceeding with wallet credit'
        );
      }
    }

    // Cancel order and refund in transaction
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });

      // Refund to wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: order.totalPrice,
          },
        },
      });

      // Create refund transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'REFUND',
          amount: order.totalPrice,
          status: 'COMPLETED',
        },
      });

      return updated;
    });

    return NextResponse.json({
      data: cancelledOrder,
    });
  } catch (error) {
    console.error('Order cancel error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to cancel order' } },
      { status: 500 }
    );
  }
}
