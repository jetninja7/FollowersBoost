import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

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

    const where: any = {
      walletId: wallet.id,
    };

    if (type && type !== 'all') {
      where.type = type.toUpperCase();
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: skip,
    });

    const total = await prisma.transaction.count({ where });

    return NextResponse.json({
      data: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch transactions' } },
      { status: 500 }
    );
  }
}
