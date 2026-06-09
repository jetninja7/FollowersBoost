import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch platform with categories and their services
    const platform = await prisma.platform.findUnique({
      where: {
        slug: slug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        categories: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            services: {
              where: {
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
              },
            },
          },
        },
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: { message: 'Platform not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: platform,
    });
  } catch (error) {
    console.error('Platform detail error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch platform details' } },
      { status: 500 }
    );
  }
}
