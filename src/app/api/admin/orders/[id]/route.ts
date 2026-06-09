import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        orderLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: { message: 'Order not found' } },
        { status: 404 }
      );
    }

    // Calculate progress
    const progressPercentage =
      order.quantity > 0
        ? Math.round(((order.currentCount || 0) / order.quantity) * 100)
        : 0;

    return NextResponse.json({
      data: {
        ...order,
        progressPercentage,
      },
    });
  } catch (error) {
    console.error('Admin order detail fetch error:', error);
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to fetch order',
        },
      },
      { status: error instanceof Error && error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}
