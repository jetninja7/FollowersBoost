import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { validateTransition, REFUND_STATUSES } from './status-machine';
import { createStatusChangeNotification } from './notifications';

interface TransitionOptions {
  performedBy?: string;
  note?: string;
  failureReason?: string;
  serviceName?: string;
}

/**
 * Transition an order to a new status with validation, refunds, and notifications
 */
export async function transitionOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  options: TransitionOptions = {}
) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Get current order
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Validate transition
    const validation = validateTransition(order.status, newStatus);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Handle refunds for CANCELLED, FAILED, or REFUNDED statuses
    if (REFUND_STATUSES.includes(newStatus)) {
      const wallet = await tx.wallet.findUnique({
        where: { userId: order.userId },
      });

      if (!wallet) {
        throw new Error(`Wallet not found for user ${order.userId}`);
      }

      // Issue refund transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'REFUND',
          amount: order.totalPrice,
          status: 'COMPLETED',
          metadata: {
            orderId: order.id,
            reason: options.failureReason || 'Order cancelled',
          },
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: order.totalPrice,
          },
        },
      });
    }

    // Update order status
    const updateData: Prisma.OrderUpdateInput = {
      status: newStatus,
    };

    if (newStatus === 'IN_PROGRESS' && !order.startedAt) {
      updateData.startedAt = new Date();
      updateData.lastProgressUpdate = new Date();
    }

    if (newStatus === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    if (options.failureReason) {
      updateData.failureReason = options.failureReason;
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Create order log entry
    await tx.orderLog.create({
      data: {
        orderId,
        action: 'STATUS_CHANGE',
        oldValue: order.status,
        newValue: newStatus,
        performedBy: options.performedBy || 'SYSTEM',
        note: options.note,
      },
    });

    // Create user notification
    await createStatusChangeNotification(
      tx,
      order.userId,
      orderId,
      newStatus,
      {
        failureReason: options.failureReason,
        serviceName: options.serviceName,
      }
    );

    return updatedOrder;
  });
}

/**
 * Update order progress (current count) and auto-transition to IN_PROGRESS if needed
 */
export async function updateOrderProgress(
  orderId: string,
  currentCount: number,
  options: { performedBy?: string; note?: string } = {}
) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Auto-transition to IN_PROGRESS if status is PROCESSING
    if (order.status === 'PROCESSING') {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          lastProgressUpdate: new Date(),
          currentCount,
        },
      });

      await tx.orderLog.create({
        data: {
          orderId,
          action: 'STATUS_CHANGE',
          oldValue: 'PROCESSING',
          newValue: 'IN_PROGRESS',
          performedBy: options.performedBy || 'SYSTEM',
          note: 'Auto-transitioned on first progress update',
        },
      });

      // Create notification
      await createStatusChangeNotification(
        tx,
        order.userId,
        orderId,
        'IN_PROGRESS'
      );
    } else {
      // Just update progress
      await tx.order.update({
        where: { id: orderId },
        data: {
          currentCount,
          lastProgressUpdate: new Date(),
        },
      });
    }

    // Create progress log
    await tx.orderLog.create({
      data: {
        orderId,
        action: 'PROGRESS_UPDATE',
        oldValue: order.currentCount?.toString() || '0',
        newValue: currentCount.toString(),
        performedBy: options.performedBy || 'SYSTEM',
        note: options.note,
      },
    });

    return await tx.order.findUnique({
      where: { id: orderId },
    });
  });
}

/**
 * Process pending orders (for cron job)
 * Finds PENDING orders older than 1 minute and transitions them to PROCESSING
 */
export async function processPendingOrders() {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  const pendingOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: {
        lte: oneMinuteAgo,
      },
    },
  });

  const results = [];

  for (const order of pendingOrders) {
    try {
      const updated = await transitionOrderStatus(order.id, 'PROCESSING', {
        note: 'Auto-transitioned by cron job',
      });
      results.push({ orderId: order.id, success: true, order: updated });
    } catch (error) {
      results.push({
        orderId: order.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    processed: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

/**
 * Detect stuck orders (for cron job)
 * Finds IN_PROGRESS orders with no progress update in 24 hours
 */
export async function detectStuckOrders() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const stuckOrders = await prisma.order.findMany({
    where: {
      status: 'IN_PROGRESS',
      OR: [
        {
          lastProgressUpdate: {
            lte: twentyFourHoursAgo,
          },
        },
        {
          lastProgressUpdate: null,
          startedAt: {
            lte: twentyFourHoursAgo,
          },
        },
      ],
    },
  });

  const results = [];

  for (const order of stuckOrders) {
    try {
      await prisma.orderLog.create({
        data: {
          orderId: order.id,
          action: 'WARNING',
          note: 'Order appears stuck - no progress update in 24 hours',
          performedBy: 'SYSTEM',
        },
      });
      results.push({ orderId: order.id, success: true });
    } catch (error) {
      results.push({
        orderId: order.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    detected: results.length,
    logged: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}
