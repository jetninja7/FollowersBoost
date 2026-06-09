import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Fetch all active platforms with service counts
    const platforms = await prisma.platform.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        order: true,
        _count: {
          select: {
            categories: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Transform to include service count
    const platformsWithCounts = platforms.map(platform => ({
      id: platform.id,
      name: platform.name,
      slug: platform.slug,
      icon: platform.icon,
      serviceCount: platform._count.categories, // Approximation for now
    }));

    return NextResponse.json({
      data: platformsWithCounts,
    });
  } catch (error) {
    console.error('Platforms fetch error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch platforms' } },
      { status: 500 }
    );
  }
}
