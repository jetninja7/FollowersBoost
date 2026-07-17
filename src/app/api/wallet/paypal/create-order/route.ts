import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { paypalHttpClient, isPayPalEnabled } from '@/lib/paypal';
import { z } from 'zod';

const createOrderSchema = z.object({
  amount: z.number().min(1).max(10000),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: validation.error } },
        { status: 400 }
      );
    }

    const { amount } = validation.data;

    if (!isPayPalEnabled()) {
      return NextResponse.json(
        { error: { message: 'PayPal is not configured' } },
        { status: 503 }
      );
    }

    // Create PayPal order using new SDK
    const orderResponse = await paypalHttpClient.ordersController.ordersCreate({
      body: {
        intent: 'CAPTURE',
        purchaseUnits: [
          {
            amount: {
              currencyCode: 'USD',
              value: amount.toFixed(2),
            },
            description: 'FollowersBoost Wallet Deposit',
          },
        ],
        applicationContext: {
          brandName: 'FollowersBoost',
          landingPage: 'NO_PREFERENCE',
          userAction: 'PAY_NOW',
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`,
        },
      },
      prefer: 'return=representation',
    });

    return NextResponse.json({
      data: {
        orderId: orderResponse.result?.id,
      },
    });
  } catch (error) {
    console.error('PayPal create order error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to create PayPal order' } },
      { status: 500 }
    );
  }
}
