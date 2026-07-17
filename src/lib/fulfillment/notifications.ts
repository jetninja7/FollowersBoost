import { OrderStatus, Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import {
  sendOrderConfirmationEmail,
  sendOrderInProgressEmail,
  sendOrderCompletedEmail,
  sendOrderFailedEmail,
} from '@/lib/email/email-service';
import { logger } from '@/lib/logger';

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

  // Create in-app notification
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

  // Send email notification (async, don't wait)
  sendStatusChangeEmail(userId, orderId, newStatus, options).catch((error) => {
    logger.error({ error, userId, orderId, newStatus }, 'Failed to send status change email');
  });
}

/**
 * Send email for order status change
 */
async function sendStatusChangeEmail(
  userId: string,
  orderId: string,
  newStatus: OrderStatus,
  options?: NotificationOptions
): Promise<void> {
  // Import prisma here to avoid circular dependency
  const { prisma } = await import('@/lib/db/prisma');

  // Get user email and order details
  const [user, order] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    }),
    prisma.order.findUnique({
      where: { id: orderId },
      select: {
        quantity: true,
        totalPrice: true,
        targetUrl: true,
        startCount: true,
        currentCount: true,
        serviceId: true,
      },
    }),
  ]);

  if (!user || !order) {
    logger.warn({ userId, orderId }, 'User or order not found for email notification');
    return;
  }

  // Get service details
  const service = await prisma.service.findUnique({
    where: { id: order.serviceId },
    select: {
      name: true,
      estimatedDeliveryTime: true,
      category: {
        select: {
          platform: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!service) {
    logger.warn({ serviceId: order.serviceId }, 'Service not found for email notification');
    return;
  }

  const serviceName = service.name;
  const platform = service.category.platform.name;
  const totalPrice = order.totalPrice.toString();

  // Send appropriate email based on status
  switch (newStatus) {
    case 'PENDING':
      // Send confirmation email (only on initial order creation, not status change)
      await sendOrderConfirmationEmail({
        to: user.email,
        userId,
        orderId,
        serviceName,
        platform,
        quantity: order.quantity,
        totalPrice,
        targetUrl: order.targetUrl,
        estimatedDelivery: service.estimatedDeliveryTime,
      });
      break;

    case 'IN_PROGRESS':
      await sendOrderInProgressEmail({
        to: user.email,
        userId,
        orderId,
        serviceName,
        quantity: order.quantity,
        currentCount: order.currentCount || 0,
        startCount: order.startCount || 0,
      });
      break;

    case 'COMPLETED':
      await sendOrderCompletedEmail({
        to: user.email,
        userId,
        orderId,
        serviceName,
        quantity: order.quantity,
      });
      break;

    case 'FAILED':
    case 'CANCELLED':
    case 'REFUNDED':
      await sendOrderFailedEmail({
        to: user.email,
        userId,
        orderId,
        serviceName,
        totalPrice,
        failureReason: options?.failureReason,
      });
      break;
  }
}
