import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await requireAuth();

    // Fetch last 5 orders with service info (no actual Service table yet in Phase 3A)
    // For now, just return order data - we'll enhance in Phase 3B
    const recentOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        serviceId: true,
        status: true,
        totalPrice: true,
        quantity: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return NextResponse.json({
      data: recentOrders,
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch recent activity' } },
      { status: 500 }
    );
  }
}
