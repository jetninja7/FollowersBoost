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

    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        platform: true,
        services: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
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
    const { platformId, name, slug, description, isActive } = body;

    // Check category exists
    const existing = await prisma.serviceCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (platformId !== undefined) {
      const platform = await prisma.platform.findUnique({
        where: { id: platformId },
      });
      if (!platform) {
        return NextResponse.json(
          { error: 'Platform not found' },
          { status: 404 }
        );
      }
      updateData.platformId = platformId;
    }

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

      const duplicateSlug = await prisma.serviceCategory.findUnique({
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

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: updateData,
      include: {
        platform: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
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

    // Check for dependent services
    const serviceCount = await prisma.service.count({
      where: { categoryId: id },
    });

    if (serviceCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category because ${serviceCount} services depend on it` },
        { status: 400 }
      );
    }

    await prisma.serviceCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
