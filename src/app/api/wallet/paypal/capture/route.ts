import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { paypalHttpClient, PayPalOrders, isPayPalEnabled } from '@/lib/paypal';
import { z } from 'zod';

const captureOrderSchema = z.object({
  orderId: z.string(),
  amount: z.number().min(1).max(10000),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const validation = captureOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: validation.error } },
        { status: 400 }
      );
    }

    const { orderId, amount } = validation.data;

    if (!isPayPalEnabled()) {
      return NextResponse.json(
        { error: { message: 'PayPal is not configured' } },
        { status: 503 }
      );
    }

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: { message: 'Wallet not found' } },
        { status: 404 }
      );
    }

    // Capture PayPal payment
    const captureRequest = new PayPalOrders.OrdersCaptureRequest(orderId);
    captureRequest.requestBody({});

    const capture = await paypalHttpClient.execute(captureRequest);

    // Verify payment was successful
    if (capture.result.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: { message: 'Payment was not completed' } },
        { status: 400 }
      );
    }

    // Get capture ID for record keeping
    const captureId = capture.result.purchase_units[0]?.payments?.captures?.[0]?.id;

    // Create transaction and update wallet balance in atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create completed transaction
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          amount: amount,
          status: 'COMPLETED',
          paymentMethod: 'PAYPAL',
          paymentIntentId: captureId || orderId,
          metadata: {
            paypalOrderId: orderId,
            paypalCaptureId: captureId,
          },
        },
      });

      // Increment wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: session.user.id!,
          type: 'PAYMENT_SUCCESS',
          title: 'Funds Added Successfully',
          message: `$${amount.toFixed(2)} has been added to your wallet via PayPal`,
          metadata: {
            transactionId: transaction.id,
            amount,
            paymentMethod: 'PAYPAL',
          },
        },
      });

      return { transaction, wallet: updatedWallet };
    });

    return NextResponse.json({
      data: {
        transactionId: result.transaction.id,
        newBalance: result.wallet.balance,
      },
    });
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to capture PayPal payment' } },
      { status: 500 }
    );
  }
}
