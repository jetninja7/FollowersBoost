import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

const addFundsSchema = z.object({
  amount: z.number().min(1).max(10000),
  paymentMethod: z.enum(['stripe', 'paypal']),
});

export async function POST(request: Request) {
  try {
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

    // Only Stripe implemented for Phase 3B
    if (paymentMethod !== 'stripe') {
      return NextResponse.json(
        { error: { message: 'Only Stripe is supported currently' } },
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

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
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
