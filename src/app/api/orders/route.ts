import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// GET - List orders
export async function GET(request: Request) {
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

    const { serviceId, quantity, targetUrl, notes } = validation.data;

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

    // Check balance
    if (Number(wallet.balance) < totalPrice) {
      return NextResponse.json(
        { error: { message: 'Insufficient balance', details: { required: totalPrice, available: Number(wallet.balance) } } },
        { status: 400 }
      );
    }

    // Create order and deduct from wallet in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: totalPrice,
          },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'ORDER_PAYMENT',
          amount: totalPrice,
          status: 'COMPLETED',
          paymentMethod: 'STRIPE', // Always wallet for now
        },
      });

      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id!,
          serviceId: serviceId,
          quantity: quantity,
          totalPrice: totalPrice,
          targetUrl: targetUrl,
          notes: notes,
          status: 'PENDING',
        },
      });

      return newOrder;
    });

    return NextResponse.json({
      data: order,
    }, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to create order' } },
      { status: 500 }
    );
  }
}
