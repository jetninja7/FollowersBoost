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

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            platform: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...service,
      price: service.price.toString(),
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
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

    // Check service exists
    const existing = await prisma.service.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (body.categoryId !== undefined) {
      const category = await prisma.serviceCategory.findUnique({
        where: { id: body.categoryId },
      });
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      updateData.categoryId = body.categoryId;
    }

    if (body.name !== undefined) {
      if (body.name.trim().length === 0 || body.name.length > 100) {
        return NextResponse.json(
          { error: 'Name must be between 1 and 100 characters' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.slug !== undefined) {
      if (body.slug.trim().length === 0 || !/^[a-z0-9-]+$/.test(body.slug)) {
        return NextResponse.json(
          { error: 'Invalid slug format' },
          { status: 400 }
        );
      }

      const duplicateSlug = await prisma.service.findUnique({
        where: { slug: body.slug.trim().toLowerCase() },
      });

      if (duplicateSlug && duplicateSlug.id !== id) {
        return NextResponse.json(
          { error: 'Slug already in use' },
          { status: 400 }
        );
      }

      updateData.slug = body.slug.trim().toLowerCase();
    }

    if (body.description !== undefined) {
      if (body.description.trim().length === 0 || body.description.length > 500) {
        return NextResponse.json(
          { error: 'Description must be between 1 and 500 characters' },
          { status: 400 }
        );
      }
      updateData.description = body.description.trim();
    }

    if (body.price !== undefined) {
      const parsedPrice = parseFloat(body.price);
      if (isNaN(parsedPrice) || parsedPrice < 0.01 || parsedPrice > 10000) {
        return NextResponse.json(
          { error: 'Price must be between $0.01 and $10,000' },
          { status: 400 }
        );
      }
      updateData.price = parsedPrice;
    }

    if (body.minQuantity !== undefined) {
      const parsedMinQty = parseInt(body.minQuantity);
      if (isNaN(parsedMinQty) || parsedMinQty < 1) {
        return NextResponse.json(
          { error: 'Minimum quantity must be at least 1' },
          { status: 400 }
        );
      }
      updateData.minQuantity = parsedMinQty;
    }

    if (body.maxQuantity !== undefined) {
      const parsedMaxQty = parseInt(body.maxQuantity);
      const minQty = updateData.minQuantity || existing.minQuantity;
      if (isNaN(parsedMaxQty) || parsedMaxQty <= minQty) {
        return NextResponse.json(
          { error: 'Maximum quantity must be greater than minimum quantity' },
          { status: 400 }
        );
      }
      updateData.maxQuantity = parsedMaxQty;
    }

    if (body.estimatedDeliveryTime !== undefined) {
      if (body.estimatedDeliveryTime.trim().length === 0) {
        return NextResponse.json(
          { error: 'Estimated delivery time is required' },
          { status: 400 }
        );
      }
      updateData.estimatedDeliveryTime = body.estimatedDeliveryTime.trim();
    }

    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
    }

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          include: {
            platform: {
              select: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ...service,
      price: service.price.toString(),
    });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
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

    // Check for orders using this service
    const orderCount = await prisma.order.count({
      where: { serviceId: id },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete service because ${orderCount} orders reference it` },
        { status: 400 }
      );
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
