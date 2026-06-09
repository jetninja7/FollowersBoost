import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';
import { OrderStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam as OrderStatus;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { targetUrl: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Fetch orders with user details
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip,
    });

    // Calculate progress for each order
    const ordersWithProgress = orders.map((order) => ({
      ...order,
      progressPercentage:
        order.quantity > 0
          ? Math.round(((order.currentCount || 0) / order.quantity) * 100)
          : 0,
    }));

    // Get total count
    const total = await prisma.order.count({ where });

    // Get stats by status
    const statusStats = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    return NextResponse.json({
      data: ordersWithProgress,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        statusStats: statusStats.reduce(
          (acc, stat) => ({
            ...acc,
            [stat.status]: stat._count,
          }),
          {}
        ),
      },
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to fetch orders',
        },
      },
      { status: error instanceof Error && error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}
