import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch service with category and platform info
    const service = await prisma.service.findUnique({
      where: {
        slug: slug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        minQuantity: true,
        maxQuantity: true,
        estimatedDeliveryTime: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            platform: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: { message: 'Service not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: service,
    });
  } catch (error) {
    console.error('Service detail error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch service details' } },
      { status: 500 }
    );
  }
}
