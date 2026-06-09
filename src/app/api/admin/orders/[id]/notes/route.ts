import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const addNoteSchema = z.object({
  note: z.string().min(1).max(1000),
  isPublic: z.boolean().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const validation = addNoteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: validation.error } },
        { status: 400 }
      );
    }

    const { note, isPublic } = validation.data;

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { error: { message: 'Order not found' } },
        { status: 404 }
      );
    }

    // Update order with note
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update appropriate note field
      const updated = await tx.order.update({
        where: { id },
        data: isPublic
          ? {
              notes: note,
            }
          : {
              adminNotes: note,
            },
      });

      // Create log entry
      await tx.orderLog.create({
        data: {
          orderId: id,
          action: isPublic ? 'PUBLIC_NOTE_ADDED' : 'ADMIN_NOTE_ADDED',
          newValue: note,
          performedBy: session.user.email || 'ADMIN',
        },
      });

      return updated;
    });

    return NextResponse.json({
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Admin order note add error:', error);
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to add note',
        },
      },
      { status: error instanceof Error && error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}
