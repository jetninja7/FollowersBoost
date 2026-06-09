import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await requireAuth();

    // Fetch wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: { balance: true, currency: true },
    });

    // Count active orders (IN_PROGRESS or PROCESSING)
    const activeOrdersCount = await prisma.order.count({
      where: {
        userId: session.user.id,
        status: { in: ['IN_PROGRESS', 'PROCESSING'] },
      },
    });

    // Count completed orders
    const completedOrdersCount = await prisma.order.count({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
      },
    });

    // Calculate total spent (sum of completed order payments)
    const totalSpentResult = await prisma.order.aggregate({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
      },
      _sum: {
        totalPrice: true,
      },
    });

    const totalSpent = totalSpentResult._sum.totalPrice || 0;

    return NextResponse.json({
      data: {
        wallet: {
          balance: wallet?.balance || 0,
          currency: wallet?.currency || 'USD',
        },
        activeOrders: activeOrdersCount,
        completedOrders: completedOrdersCount,
        totalSpent: totalSpent,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch dashboard statistics' } },
      { status: 500 }
    );
  }
}
