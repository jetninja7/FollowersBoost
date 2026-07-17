import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { stripe, isStripeEnabled } from '@/lib/stripe';
import { getOrCreateStripeCustomer } from '@/lib/stripe-customer';
import { applyRateLimit } from '@/lib/api/rate-limit-helpers';
import { z } from 'zod';

const addFundsSchema = z.object({
  amount: z.number().min(1).max(10000),
  paymentMethod: z.enum(['stripe', 'paypal']),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for authenticated API
    const rateLimitResponse = await applyRateLimit(request, 'api');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await requireAuth();
    const body = await request.json();

    const validation = addFundsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: validation.error } },
        { status: 400 }
      );
    }

    const { amount, paymentMethod } = validation.data;

    // Validate payment method is configured
    if (paymentMethod === 'stripe' && !isStripeEnabled()) {
      return NextResponse.json(
        { error: { message: 'Stripe is not configured' } },
        { status: 503 }
      );
    }

    if (paymentMethod === 'paypal') {
      return NextResponse.json(
        { error: { message: 'PayPal uses a different flow. Use /api/wallet/paypal/create-order' } },
        { status: 400 }
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

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      session.user.id!,
      session.user.email!
    );

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      setup_future_usage: 'off_session',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: session.user.id!,
        walletId: wallet.id,
        type: 'wallet_deposit',
      },
    });

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: amount,
        status: 'PENDING',
        paymentMethod: 'STRIPE',
        paymentIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      data: {
        clientSecret: paymentIntent.client_secret,
        transactionId: transaction.id,
      },
    });
  } catch (error) {
    console.error('Add funds error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to initiate payment' } },
      { status: 500 }
    );
  }
}
