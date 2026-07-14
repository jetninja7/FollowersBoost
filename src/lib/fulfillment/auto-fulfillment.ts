/**
 * Automatic Order Fulfillment Service
 *
 * Handles automatic order fulfillment by:
 * 1. Finding PROCESSING orders that need fulfillment
 * 2. Selecting appropriate provider
 * 3. Submitting order to provider
 * 4. Tracking progress and updating order status
 */

import { prisma } from '@/lib/db/prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import {
  selectProviderForService,
  providerRegistry,
} from './provider-registry';
import {
  transitionOrderStatus,
  updateOrderProgress,
} from './order-processor';
import {
  ProviderOrderStatus,
  mapProviderStatusToOrderStatus,
  ProviderError,
} from './types';
import { logger } from '@/lib/logger';

/**
 * Maximum retry attempts for an order
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Retry delay in ms (increases with each attempt)
 */
const RETRY_DELAYS = [
  5 * 60 * 1000, // 5 minutes
  15 * 60 * 1000, // 15 minutes
  60 * 60 * 1000, // 1 hour
];

/**
 * Submit order to provider for fulfillment
 */
export async function submitOrderToProvider(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (order.status !== 'PROCESSING') {
    throw new Error(
      `Order ${orderId} is not in PROCESSING status (current: ${order.status})`
    );
  }

  logger.info(
    {
      orderId,
      serviceId: order.serviceId,
      quantity: order.quantity,
    },
    'Attempting to submit order to provider'
  );

  try {
    // Select best provider for this service
    const provider = await selectProviderForService(order.serviceId);

    if (!provider) {
      throw new Error(
        `No provider available for service ${order.serviceId}`
      );
    }

    logger.info(
      {
        orderId,
        providerId: provider.providerId,
        providerName: provider.name,
      },
      'Provider selected for order'
    );

    // Submit order to provider
    const providerResponse = await provider.createOrder({
      serviceId: order.serviceId,
      targetUrl: order.targetUrl,
      quantity: order.quantity,
      startCount: order.startCount || undefined,
      notes: order.notes || undefined,
    });

    logger.info(
      {
        orderId,
        providerOrderId: providerResponse.providerOrderId,
        providerStatus: providerResponse.status,
      },
      'Order submitted to provider successfully'
    );

    // Update order with provider info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        fulfillmentProvider: 'API',
        fulfillmentProviderId: provider.providerId,
        providerOrderId: providerResponse.providerOrderId,
        currentCount: providerResponse.currentCount || 0,
        retryCount: 0,
        lastRetryAt: null,
      },
    });

    // Create order log
    await prisma.orderLog.create({
      data: {
        orderId,
        action: 'PROVIDER_SUBMIT',
        newValue: providerResponse.providerOrderId,
        performedBy: 'SYSTEM',
        note: `Submitted to ${provider.name} (${provider.providerId})`,
      },
    });

    // If provider immediately completed the order, transition to completed
    if (providerResponse.status === ProviderOrderStatus.COMPLETED) {
      await transitionOrderStatus(orderId, 'COMPLETED', {
        note: 'Provider completed order immediately',
      });
    }
    // If provider marked as in progress, update our status
    else if (providerResponse.status === ProviderOrderStatus.IN_PROGRESS) {
      await transitionOrderStatus(orderId, 'IN_PROGRESS', {
        note: 'Provider started processing order',
      });
    }
  } catch (error) {
    logger.error(
      {
        orderId,
        error,
        retryCount: order.retryCount,
      },
      'Failed to submit order to provider'
    );

    // Handle retries
    if (
      error instanceof ProviderError &&
      error.retryable &&
      order.retryCount < MAX_RETRY_ATTEMPTS
    ) {
      // Schedule retry
      await prisma.order.update({
        where: { id: orderId },
        data: {
          retryCount: order.retryCount + 1,
          lastRetryAt: new Date(),
          adminNotes: `Retry ${order.retryCount + 1}/${MAX_RETRY_ATTEMPTS}: ${error.message}`,
        },
      });

      await prisma.orderLog.create({
        data: {
          orderId,
          action: 'PROVIDER_SUBMIT_RETRY',
          oldValue: String(order.retryCount),
          newValue: String(order.retryCount + 1),
          performedBy: 'SYSTEM',
          note: `Will retry in ${RETRY_DELAYS[order.retryCount] / 60000} minutes: ${error.message}`,
        },
      });

      throw error; // Re-throw to be caught by cron job
    } else {
      // Max retries exceeded or non-retryable error
      await transitionOrderStatus(orderId, 'FAILED', {
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        note: 'Failed to submit to provider after retries',
      });
    }
  }
}

/**
 * Update order status from provider
 */
export async function updateOrderFromProvider(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (!order.fulfillmentProviderId || !order.providerOrderId) {
    throw new Error(`Order ${orderId} has no provider information`);
  }

  const provider = providerRegistry.getProvider(order.fulfillmentProviderId);

  if (!provider) {
    throw new Error(
      `Provider ${order.fulfillmentProviderId} not found in registry`
    );
  }

  try {
    // Get status from provider
    const statusUpdate = await provider.getOrderStatus(order.providerOrderId);

    logger.info(
      {
        orderId,
        providerStatus: statusUpdate.status,
        currentCount: statusUpdate.currentCount,
      },
      'Received status update from provider'
    );

    // Update progress if changed
    if (
      statusUpdate.currentCount !== undefined &&
      statusUpdate.currentCount !== order.currentCount
    ) {
      await updateOrderProgress(orderId, statusUpdate.currentCount, {
        note: `Provider progress update: ${statusUpdate.currentCount}/${statusUpdate.quantity}`,
      });
    }

    // Map provider status to our status
    const newStatus = mapProviderStatusToOrderStatus(statusUpdate.status);

    // Transition status if changed
    if (newStatus !== order.status && isFinalStatus(newStatus)) {
      await transitionOrderStatus(orderId, newStatus, {
        note: `Provider marked order as ${statusUpdate.status}`,
        failureReason: statusUpdate.errorMessage,
      });
    }
  } catch (error) {
    logger.error(
      {
        orderId,
        providerId: order.fulfillmentProviderId,
        error,
      },
      'Failed to get status update from provider'
    );

    // Don't fail the order just because status check failed
    // We'll try again next time
  }
}

/**
 * Process all PROCESSING orders that need provider submission
 */
export async function processOrdersForFulfillment(): Promise<{
  processed: number;
  submitted: number;
  failed: number;
  details: Array<{ orderId: string; success: boolean; error?: string }>;
}> {
  logger.info('Starting automatic fulfillment process');

  // Find PROCESSING orders without provider assignment
  const orders = await prisma.order.findMany({
    where: {
      status: 'PROCESSING',
      fulfillmentProviderId: null,
      // Check retry delay
      OR: [
        { lastRetryAt: null }, // Never retried
        {
          // Enough time passed since last retry
          lastRetryAt: {
            lte: new Date(
              Date.now() - RETRY_DELAYS[0] // Use minimum delay
            ),
          },
        },
      ],
    },
    orderBy: {
      createdAt: 'asc', // Process oldest first
    },
    take: 50, // Process in batches
  });

  logger.info({ orderCount: orders.length }, 'Found orders for fulfillment');

  const results = [];

  for (const order of orders) {
    try {
      await submitOrderToProvider(order.id);
      results.push({ orderId: order.id, success: true });
    } catch (error) {
      results.push({
        orderId: order.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const summary = {
    processed: results.length,
    submitted: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    details: results,
  };

  logger.info(summary, 'Automatic fulfillment process completed');

  return summary;
}

/**
 * Update all active orders from their providers
 */
export async function updateActiveOrdersFromProviders(): Promise<{
  checked: number;
  updated: number;
  failed: number;
  details: Array<{ orderId: string; success: boolean; error?: string }>;
}> {
  logger.info('Checking active orders with providers');

  // Find IN_PROGRESS orders with provider assignment
  const orders = await prisma.order.findMany({
    where: {
      status: 'IN_PROGRESS',
      fulfillmentProviderId: { not: null },
      providerOrderId: { not: null },
    },
    orderBy: {
      lastProgressUpdate: 'asc', // Update least recently updated first
    },
    take: 100, // Process in batches
  });

  logger.info({ orderCount: orders.length }, 'Found active orders to check');

  const results = [];

  for (const order of orders) {
    try {
      await updateOrderFromProvider(order.id);
      results.push({ orderId: order.id, success: true });
    } catch (error) {
      results.push({
        orderId: order.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const summary = {
    checked: results.length,
    updated: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    details: results,
  };

  logger.info(summary, 'Active orders check completed');

  return summary;
}

/**
 * Check if status is final (no more updates expected)
 */
function isFinalStatus(status: OrderStatus): boolean {
  return ['COMPLETED', 'CANCELLED', 'FAILED', 'REFUNDED'].includes(status);
}
