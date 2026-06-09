import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({
        data: [],
      });
    }

    // Search services by name or description
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        category: {
          select: {
            name: true,
            platform: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      take: limit,
    });

    // Group results by platform
    const groupedResults = services.reduce((acc, service) => {
      const platformName = service.category.platform.name;
      if (!acc[platformName]) {
        acc[platformName] = [];
      }
      acc[platformName].push({
        id: service.id,
        name: service.name,
        slug: service.slug,
        price: service.price,
        categoryName: service.category.name,
        platformSlug: service.category.platform.slug,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      data: groupedResults,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: { message: 'Search failed' } },
      { status: 500 }
    );
  }
}
