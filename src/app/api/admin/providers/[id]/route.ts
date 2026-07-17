/**
 * Individual Provider Management API
 *
 * Admin endpoints for managing a specific provider.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';
import { providerRegistry } from '@/lib/fulfillment/provider-registry';
import { z } from 'zod';

const updateProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiUrl: z.string().url().optional().nullable(),
  credentials: z.record(z.string(), z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  isEnabled: z.boolean().optional(),
});

/**
 * GET /api/admin/providers/[id]
 * Get provider details
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        providerServices: {
          include: {
            provider: false,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Get health from registry
    const registryProvider = providerRegistry.getProvider(id);
    let health = null;

    if (registryProvider) {
      try {
        health = await registryProvider.checkHealth();
      } catch (error) {
        console.error(`Failed to get health for provider ${id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        type: provider.type,
        isEnabled: provider.isEnabled,
        priority: provider.priority,
        apiUrl: provider.apiUrl,
        credentials: provider.credentials,
        settings: provider.settings,
        statistics: {
          totalOrders: provider.totalOrders,
          successfulOrders: provider.successfulOrders,
          failedOrders: provider.failedOrders,
          successRate:
            provider.totalOrders > 0
              ? (provider.successfulOrders / provider.totalOrders) * 100
              : 0,
        },
        health: health
          ? {
              isHealthy: health.isHealthy,
              errorRate: Number(health.errorRate.toFixed(4)),
              averageResponseTime: health.averageResponseTime,
              lastSuccessfulCall: health.lastSuccessfulCall,
              lastFailedCall: health.lastFailedCall,
            }
          : null,
        servicesCount: provider.providerServices.length,
        lastHealthCheck: provider.lastHealthCheck,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      },
    });
  } catch (error) {
    console.error('[ADMIN_PROVIDER_GET]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch provider',
      },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 403 : 500 }
    );
  }
}

/**
 * PUT /api/admin/providers/[id]
 * Update provider
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    const body = await req.json();
    const data = updateProviderSchema.parse(body);

    // Check if provider exists
    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Update provider
    const provider = await prisma.provider.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.apiUrl !== undefined && { apiUrl: data.apiUrl }),
        ...(data.credentials && { credentials: data.credentials as any }),
        ...(data.settings && { settings: data.settings as any }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
      },
    });

    // Reload provider in registry
    await providerRegistry.reloadProvider(id);

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        type: provider.type,
        isEnabled: provider.isEnabled,
        priority: provider.priority,
      },
    });
  } catch (error) {
    console.error('[ADMIN_PROVIDER_PUT]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update provider',
      },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/providers/[id]
 * Delete provider
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    // Check if provider exists
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            providerServices: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Check if provider has active orders
    const activeOrdersCount = await prisma.order.count({
      where: {
        fulfillmentProviderId: id,
        status: {
          in: ['PENDING', 'PROCESSING', 'IN_PROGRESS'],
        },
      },
    });

    if (activeOrdersCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete provider with ${activeOrdersCount} active orders. Disable it instead.`,
        },
        { status: 400 }
      );
    }

    // Delete provider (cascades to provider services)
    await prisma.provider.delete({
      where: { id },
    });

    // Reload registry
    await providerRegistry.reloadAll();

    return NextResponse.json({
      success: true,
      message: 'Provider deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN_PROVIDER_DELETE]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete provider',
      },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 403 : 500 }
    );
  }
}
