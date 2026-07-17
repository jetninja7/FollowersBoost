import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { stripe, isStripeEnabled } from '@/lib/stripe';
import { getOrCreateStripeCustomer } from '@/lib/stripe-customer';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/rate-limit-helpers';
import { z } from 'zod';

// GET - List orders
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, 'api');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId: session.user.id,
    };

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        // No service relation in schema yet - will add in next phase
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: skip,
    });

    const total = await prisma.order.count({ where });

    return NextResponse.json({
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch orders' } },
      { status: 500 }
    );
  }
}

// POST - Create order
const createOrderSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.number().int().positive(),
  targetUrl: z.string().url(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['STRIPE', 'WALLET']).default('STRIPE'),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request, 'api');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await requireAuth();
    const body = await request.json();

    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: validation.error } },
        { status: 400 }
      );
    }

    const { serviceId, quantity, targetUrl, notes, paymentMethod } = validation.data;

    // Get service to calculate price
    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: { message: 'Service not found' } },
        { status: 404 }
      );
    }

    // Validate quantity
    if (quantity < service.minQuantity || quantity > service.maxQuantity) {
      return NextResponse.json(
        { error: { message: 'Quantity out of range' } },
        { status: 400 }
      );
    }

    // Calculate total price
    const totalPrice = Number(service.price) * quantity;

    // WALLET path: deduct from pre-funded balance, no external payment.
    if (paymentMethod === 'WALLET') {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: session.user.id },
      });

      if (!wallet) {
        return NextResponse.json(
          { error: { message: 'Wallet not found' } },
          { status: 404 }
        );
      }

      if (Number(wallet.balance) < totalPrice) {
        return NextResponse.json(
          {
            error: {
              message: 'Insufficient balance',
              details: { required: totalPrice, available: Number(wallet.balance) },
            },
          },
          { status: 400 }
        );
      }

      const order = await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: totalPrice } },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'ORDER_PAYMENT',
            amount: totalPrice,
            status: 'COMPLETED',
            // paymentMethod null = wallet movement, not external processor.
            paymentMethod: null,
          },
        });

        return tx.order.create({
          data: {
            userId: session.user.id!,
            serviceId,
            quantity,
            totalPrice,
            targetUrl,
            notes,
            status: 'PENDING',
          },
        });
      });

      return NextResponse.json({ data: order }, { status: 201 });
    }

    // STRIPE path: create order in PENDING, create PaymentIntent, return clientSecret.
    if (!isStripeEnabled()) {
      return NextResponse.json(
        { error: { message: 'Payments are not configured' } },
        { status: 503 }
      );
    }

    // Create the order first so the webhook has an orderId to look up.
    // The order stays PENDING until the webhook confirms payment.
    const order = await prisma.order.create({
      data: {
        userId: session.user.id!,
        serviceId,
        quantity,
        totalPrice,
        targetUrl,
        notes,
        status: 'PENDING',
      },
    });

    // Get or create Stripe customer for saved payment methods
    const customerId = await getOrCreateStripeCustomer(
      session.user.id!,
      session.user.email!
    );

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: Math.round(totalPrice * 100),
          currency: 'usd',
          customer: customerId,
          setup_future_usage: 'off_session',
          automatic_payment_methods: { enabled: true },
          metadata: {
            orderId: order.id,
            userId: session.user.id!,
            type: 'order_payment',
          },
        },
        // Idempotency: a single order can only create one PaymentIntent.
        // Re-POSTs with the same orderId never double-charge.
        { idempotencyKey: `order:${order.id}` }
      );
    } catch (error) {
      // Roll back the orphan order so the user can retry.
      await prisma.order.delete({ where: { id: order.id } });
      logger.error({ err: error, orderId: order.id }, 'Failed to create PaymentIntent for order');
      return NextResponse.json(
        { error: { message: 'Failed to initiate payment' } },
        { status: 502 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        walletId: (await prisma.wallet.findUniqueOrThrow({
          where: { userId: session.user.id },
          select: { id: true },
        })).id,
        type: 'ORDER_PAYMENT',
        amount: totalPrice,
        status: 'PENDING',
        paymentMethod: 'STRIPE',
        paymentIntentId: paymentIntent.id,
        metadata: { orderId: order.id },
      },
    });

    return NextResponse.json({
      data: {
        orderId: order.id,
        transactionId: transaction.id,
        clientSecret: paymentIntent.client_secret,
      },
    }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, 'Order creation error');
    return NextResponse.json(
      { error: { message: 'Failed to create order' } },
      { status: 500 }
    );
  }
}
