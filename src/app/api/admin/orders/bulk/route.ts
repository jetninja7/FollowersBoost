import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { transitionOrderStatus } from '@/lib/fulfillment/order-processor';
import { z } from 'zod';

const bulkActionSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['START', 'CANCEL', 'MARK_FAILED']),
  failureReason: z.string().max(500).optional(),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    const validation = bulkActionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: validation.error } },
        { status: 400 }
      );
    }

    const { orderIds, action, failureReason, note } = validation.data;

    // Map action to status
    const statusMap = {
      START: 'PROCESSING' as const,
      CANCEL: 'CANCELLED' as const,
      MARK_FAILED: 'FAILED' as const,
    };

    const targetStatus = statusMap[action];

    // Require failureReason for MARK_FAILED
    if (action === 'MARK_FAILED' && !failureReason) {
      return NextResponse.json(
        { error: { message: 'Failure reason is required for MARK_FAILED action' } },
        { status: 400 }
      );
    }

    // Process each order
    const results = [];
    for (const orderId of orderIds) {
      try {
        const updated = await transitionOrderStatus(orderId, targetStatus, {
          performedBy: session.user.email || 'ADMIN',
          note: note || `Bulk action: ${action}`,
          failureReason,
        });
        results.push({ orderId, success: true, order: updated });
      } catch (error) {
        results.push({
          orderId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      data: {
        total: orderIds.length,
        successful,
        failed,
        results,
      },
    });
  } catch (error) {
    console.error('Admin bulk action error:', error);
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to perform bulk action',
        },
      },
      { status: error instanceof Error && error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}
