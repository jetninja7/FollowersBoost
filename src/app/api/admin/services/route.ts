import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const platformId = searchParams.get('platformId');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (platformId) {
      where.category = {
        platformId: platformId,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: {
            include: {
              platform: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    const formattedServices = services.map(service => ({
      ...service,
      price: service.price.toString(),
    }));

    return NextResponse.json({
      services: formattedServices,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      categoryId,
      name,
      slug,
      description,
      price,
      minQuantity,
      maxQuantity,
      estimatedDeliveryTime,
      isActive,
    } = body;

    // Validation
    if (!categoryId || categoryId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0 || name.length > 100) {
      return NextResponse.json(
        { error: 'Name is required and must be less than 100 characters' },
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

    if (!description || description.trim().length === 0 || description.length > 500) {
      return NextResponse.json(
        { error: 'Description is required and must be less than 500 characters' },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0.01 || parsedPrice > 10000) {
      return NextResponse.json(
        { error: 'Price must be between $0.01 and $10,000' },
        { status: 400 }
      );
    }

    const parsedMinQty = parseInt(minQuantity);
    const parsedMaxQty = parseInt(maxQuantity);

    if (isNaN(parsedMinQty) || parsedMinQty < 1) {
      return NextResponse.json(
        { error: 'Minimum quantity must be at least 1' },
        { status: 400 }
      );
    }

    if (isNaN(parsedMaxQty) || parsedMaxQty <= parsedMinQty) {
      return NextResponse.json(
        { error: 'Maximum quantity must be greater than minimum quantity' },
        { status: 400 }
      );
    }

    if (!estimatedDeliveryTime || estimatedDeliveryTime.trim().length === 0) {
      return NextResponse.json(
        { error: 'Estimated delivery time is required' },
        { status: 400 }
      );
    }

    // Check category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.service.findUnique({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A service with this slug already exists' },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        categoryId,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        price: parsedPrice,
        minQuantity: parsedMinQty,
        maxQuantity: parsedMaxQty,
        estimatedDeliveryTime: estimatedDeliveryTime.trim(),
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
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

    return NextResponse.json(
      {
        ...service,
        price: service.price.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
