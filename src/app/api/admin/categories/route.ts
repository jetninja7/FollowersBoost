import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('platformId');

    const where: any = {};
    if (platformId) {
      where.platformId = platformId;
    }

    const categories = await prisma.serviceCategory.findMany({
      where,
      include: {
        platform: {
          select: { name: true },
        },
        _count: {
          select: { services: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { platformId, name, slug, description, isActive } = body;

    // Validation
    if (!platformId || platformId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0 || name.length > 50) {
      return NextResponse.json(
        { error: 'Name is required and must be less than 50 characters' },
        { status: 400 }
      );
    }

    if (!slug || slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      );
    }

    // Check platform exists
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.serviceCategory.findUnique({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      );
    }

    const category = await prisma.serviceCategory.create({
      data: {
        platformId,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description?.trim() || null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
      include: {
        platform: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
