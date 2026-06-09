import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { updateOrderProgress } from '@/lib/fulfillment/order-processor';
import { z } from 'zod';

const updateProgressSchema = z.object({
  currentCount: z.number().int().min(0),
  note: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const validation = updateProgressSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: validation.error } },
        { status: 400 }
      );
    }

    const { currentCount, note } = validation.data;

    // Use order processor to update progress (handles auto-transition, logs, notifications)
    const updatedOrder = await updateOrderProgress(id, currentCount, {
      performedBy: session.user.email || 'ADMIN',
      note,
    });

    return NextResponse.json({
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Admin order progress update error:', error);
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to update progress',
        },
      },
      { status: error instanceof Error && error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}
