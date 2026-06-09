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

    const platform = await prisma.platform.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            _count: {
              select: { services: true },
            },
          },
        },
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(platform);
  } catch (error) {
    console.error('Error fetching platform:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { name, slug, icon, isActive, order } = body;

    // Check platform exists
    const existing = await prisma.platform.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) {
      if (name.trim().length === 0 || name.length > 50) {
        return NextResponse.json(
          { error: 'Name must be between 1 and 50 characters' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (slug !== undefined) {
      if (slug.trim().length === 0 || !/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { error: 'Invalid slug format' },
          { status: 400 }
        );
      }

      // Check slug uniqueness
      const duplicateSlug = await prisma.platform.findUnique({
        where: { slug: slug.trim().toLowerCase() },
      });

      if (duplicateSlug && duplicateSlug.id !== id) {
        return NextResponse.json(
          { error: 'Slug already in use' },
          { status: 400 }
        );
      }

      updateData.slug = slug.trim().toLowerCase();
    }

    if (icon !== undefined) {
      if (icon.trim().length === 0) {
        return NextResponse.json(
          { error: 'Icon URL is required' },
          { status: 400 }
        );
      }
      updateData.icon = icon.trim();
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    if (typeof order === 'number') {
      updateData.order = order;
    }

    const platform = await prisma.platform.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(platform);
  } catch (error) {
    console.error('Error updating platform:', error);
    return NextResponse.json(
      { error: 'Failed to update platform' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check for dependent categories
    const categoryCount = await prisma.serviceCategory.count({
      where: { platformId: id },
    });

    if (categoryCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete platform because ${categoryCount} categories depend on it` },
        { status: 400 }
      );
    }

    await prisma.platform.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting platform:', error);
    return NextResponse.json(
      { error: 'Failed to delete platform' },
      { status: 500 }
    );
  }
}
