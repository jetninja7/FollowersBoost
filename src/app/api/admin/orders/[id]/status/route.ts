import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { transitionOrderStatus } from '@/lib/fulfillment/order-processor';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional(),
  failureReason: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const validation = updateStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: validation.error } },
        { status: 400 }
      );
    }

    const { status, note, failureReason } = validation.data;

    // Require failureReason for FAILED status
    if (status === 'FAILED' && !failureReason) {
      return NextResponse.json(
        { error: { message: 'Failure reason is required for FAILED status' } },
        { status: 400 }
      );
    }

    // Use order processor to transition status (handles refunds, validation, notifications)
    const updatedOrder = await transitionOrderStatus(id, status, {
      performedBy: session.user.email || 'ADMIN',
      note,
      failureReason,
    });

    return NextResponse.json({
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Admin order status update error:', error);
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to update status',
        },
      },
      { status: error instanceof Error && error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}
