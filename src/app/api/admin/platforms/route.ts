import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    await requireAdmin();

    const platforms = await prisma.platform.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(platforms);
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, slug, icon, isActive, order } = body;

    // Validation
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

    if (!icon || icon.trim().length === 0) {
      return NextResponse.json(
        { error: 'Icon URL is required' },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.platform.findUnique({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A platform with this slug already exists' },
        { status: 400 }
      );
    }

    const platform = await prisma.platform.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        icon: icon.trim(),
        isActive: typeof isActive === 'boolean' ? isActive : true,
        order: typeof order === 'number' ? order : 0,
      },
    });

    return NextResponse.json(platform, { status: 201 });
  } catch (error) {
    console.error('Error creating platform:', error);
    return NextResponse.json(
      { error: 'Failed to create platform' },
      { status: 500 }
    );
  }
}
