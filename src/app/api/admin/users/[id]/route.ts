import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallet: {
          select: {
            balance: true,
          },
        },
        orders: {
          select: {
            id: true,
            serviceId: true,
            totalPrice: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    const formattedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      balance: user.wallet?.balance.toString() || '0',
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      orders: user.orders.map((order: {
        id: string;
        serviceId: string;
        totalPrice: any;
        status: string;
        createdAt: Date;
      }) => ({
        id: order.id,
        serviceId: order.serviceId,
        totalPrice: order.totalPrice.toString(),
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ data: formattedUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to fetch user',
        },
      },
      { status: error instanceof Error && error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}
