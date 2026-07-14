/**
 * Provider Webhook Endpoint
 *
 * Receives status updates from fulfillment providers that support webhooks.
 * Validates webhook signature and updates order status accordingly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { providerRegistry } from '@/lib/fulfillment/provider-registry';
import {
  transitionOrderStatus,
  updateOrderProgress,
} from '@/lib/fulfillment/order-processor';
import { mapProviderStatusToOrderStatus } from '@/lib/fulfillment/types';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Get provider ID from query params or headers
    const providerId =
      req.nextUrl.searchParams.get('provider') ||
      req.headers.get('x-provider-id');

    if (!providerId) {
      logger.warn('Provider webhook received without provider ID');
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Get provider from registry
    const provider = providerRegistry.getProvider(providerId);

    if (!provider) {
      logger.warn({ providerId }, 'Unknown provider in webhook');
      return NextResponse.json(
        { error: 'Unknown provider' },
        { status: 404 }
      );
    }

    // Read webhook payload
    const payload = await req.json();

    // Validate webhook signature if provider supports it
    if (provider.validateWebhook) {
      const signature =
        req.headers.get('x-webhook-signature') ||
        req.headers.get('x-signature') ||
        '';

      const isValid = provider.validateWebhook(payload, signature);

      if (!isValid) {
        logger.warn(
          { providerId, payload },
          'Invalid webhook signature'
        );
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse webhook payload
    if (!provider.parseWebhook) {
      logger.warn(
        { providerId },
        'Provider does not support webhook parsing'
      );
      return NextResponse.json(
        { error: 'Provider does not support webhooks' },
        { status: 400 }
      );
    }

    const statusUpdate = provider.parseWebhook(payload);

    logger.info(
      {
        providerId,
        providerOrderId: statusUpdate.providerOrderId,
        status: statusUpdate.status,
      },
      'Received provider webhook'
    );

    // Find order by provider order ID
    const order = await prisma.order.findFirst({
      where: {
        providerOrderId: statusUpdate.providerOrderId,
        fulfillmentProviderId: providerId,
      },
    });

    if (!order) {
      logger.warn(
        {
          providerId,
          providerOrderId: statusUpdate.providerOrderId,
        },
        'Order not found for provider webhook'
      );
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order progress if changed
    if (
      statusUpdate.currentCount !== undefined &&
      statusUpdate.currentCount !== order.currentCount
    ) {
      await updateOrderProgress(order.id, statusUpdate.currentCount, {
        performedBy: 'PROVIDER_WEBHOOK',
        note: `Webhook progress update: ${statusUpdate.currentCount}/${statusUpdate.quantity}`,
      });
    }

    // Map provider status to our status
    const newStatus = mapProviderStatusToOrderStatus(statusUpdate.status);

    // Transition status if changed and is final
    if (
      newStatus !== order.status &&
      ['COMPLETED', 'CANCELLED', 'FAILED'].includes(newStatus)
    ) {
      await transitionOrderStatus(order.id, newStatus, {
        performedBy: 'PROVIDER_WEBHOOK',
        note: `Provider webhook: ${statusUpdate.status}`,
        failureReason: statusUpdate.errorMessage,
      });
    }

    // Log webhook to audit trail
    await prisma.auditLog.create({
      data: {
        userId: 'SYSTEM',
        action: 'PROVIDER_WEBHOOK',
        entity: 'ORDER',
        entityId: order.id,
        changes: {
          providerId,
          providerOrderId: statusUpdate.providerOrderId,
          status: statusUpdate.status,
          currentCount: statusUpdate.currentCount,
          duration: Date.now() - startTime,
        },
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
    });
  } catch (error) {
    logger.error({ error }, 'Error processing provider webhook');

    await prisma.auditLog.create({
      data: {
        userId: 'SYSTEM',
        action: 'PROVIDER_WEBHOOK_FAILED',
        entity: 'ORDER',
        entityId: 'WEBHOOK',
        changes: {
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
        },
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
