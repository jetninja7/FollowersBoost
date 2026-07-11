import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { paypalHttpClient, PayPalOrders, isPayPalEnabled } from '@/lib/paypal';
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

    // Create PayPal order
    const orderRequest = new PayPalOrders.OrdersCreateRequest();
    orderRequest.prefer('return=representation');
    orderRequest.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
          description: 'FollowersBoost Wallet Deposit',
        },
      ],
      application_context: {
        brand_name: 'FollowersBoost',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`,
      },
    });

    const order = await paypalHttpClient.execute(orderRequest);

    return NextResponse.json({
      data: {
        orderId: order.result.id,
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
