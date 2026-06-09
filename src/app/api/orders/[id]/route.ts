import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: {
        id: id,
        userId: session.user.id, // Ensure user owns the order
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: { message: 'Order not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: order,
    });
  } catch (error) {
    console.error('Order detail fetch error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch order details' } },
      { status: 500 }
    );
  }
}
