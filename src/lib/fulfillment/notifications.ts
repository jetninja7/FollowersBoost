import { OrderStatus, Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

type PrismaTransaction = Prisma.TransactionClient;

interface NotificationOptions {
  failureReason?: string;
  serviceName?: string;
}

const NOTIFICATION_MESSAGES: Record<OrderStatus, { title: string; message: (orderId: string, options?: NotificationOptions) => string } | null> = {
  PENDING: null,
  PROCESSING: {
    title: 'Order Processing',
    message: (orderId) => `Your order #${orderId.slice(0, 8)} is now being processed.`,
  },
  IN_PROGRESS: {
    title: 'Order Started',
    message: (orderId, options) => `We've started delivering ${options?.serviceName || 'your order'}!`,
  },
  COMPLETED: {
    title: 'Order Completed 🎉',
    message: () => `Your order has been successfully delivered!`,
  },
  FAILED: {
    title: 'Order Failed',
    message: (orderId, options) => `We couldn't complete your order. ${options?.failureReason || 'Please contact support.'}`,
  },
  CANCELLED: {
    title: 'Order Cancelled',
    message: () => `Your order has been cancelled and refunded.`,
  },
  REFUNDED: {
    title: 'Order Refunded',
    message: () => `Your order has been refunded.`,
  },
};

export async function createStatusChangeNotification(
  tx: PrismaTransaction,
  userId: string,
  orderId: string,
  newStatus: OrderStatus,
  options?: NotificationOptions
) {
  const notificationData = NOTIFICATION_MESSAGES[newStatus];

  if (!notificationData) {
    return; // No notification for this status
  }

  await tx.notification.create({
    data: {
      userId,
      type: 'ORDER_UPDATE',
      title: notificationData.title,
      message: notificationData.message(orderId, options),
      metadata: {
        orderId,
        status: newStatus,
      },
    },
  });
}
