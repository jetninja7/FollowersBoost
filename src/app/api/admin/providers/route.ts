/**
 * Provider Management API
 *
 * Admin endpoints for managing fulfillment providers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';
import { providerRegistry } from '@/lib/fulfillment/provider-registry';
import { z } from 'zod';

const createProviderSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  type: z.enum(['API', 'MANUAL', 'CUSTOM']),
  apiUrl: z.string().url().optional(),
  credentials: z.record(z.string(), z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  priority: z.number().int().min(0).max(100).default(0),
  isEnabled: z.boolean().default(true),
});

/**
 * GET /api/admin/providers
 * List all providers with health status
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const providers = await prisma.provider.findMany({
      include: {
        providerServices: {
          include: {
            provider: false,
          },
        },
        _count: {
          select: {
            providerServices: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });

    // Enrich with health status from registry
    const providersWithHealth = await Promise.all(
      providers.map(async (provider) => {
        const registryProvider = providerRegistry.getProvider(provider.id);
        let health = null;

        if (registryProvider) {
          try {
            health = await registryProvider.checkHealth();
          } catch (error) {
            console.error(
              `Failed to get health for provider ${provider.id}:`,
              error
            );
          }
        }

        return {
          id: provider.id,
          name: provider.name,
          slug: provider.slug,
          type: provider.type,
          isEnabled: provider.isEnabled,
          priority: provider.priority,
          apiUrl: provider.apiUrl,
          servicesCount: provider._count.providerServices,
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
          lastHealthCheck: provider.lastHealthCheck,
          createdAt: provider.createdAt,
          updatedAt: provider.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      providers: providersWithHealth,
    });
  } catch (error) {
    console.error('[ADMIN_PROVIDERS_GET]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch providers',
      },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/providers
 * Create a new provider
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const data = createProviderSchema.parse(body);

    // Check if slug already exists
    const existingProvider = await prisma.provider.findUnique({
      where: { slug: data.slug },
    });

    if (existingProvider) {
      return NextResponse.json(
        { success: false, error: 'Provider slug already exists' },
        { status: 400 }
      );
    }

    // Check if provider class exists for this slug
    const availableSlugs = providerRegistry.getAvailableProviderSlugs();
    if (!availableSlugs.includes(data.slug)) {
      return NextResponse.json(
        {
          success: false,
          error: `Provider implementation not found for slug: ${data.slug}. Available: ${availableSlugs.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create provider
    const provider = await prisma.provider.create({
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        apiUrl: data.apiUrl,
        credentials: (data.credentials || {}) as any,
        settings: (data.settings || {}) as any,
        priority: data.priority,
        isEnabled: data.isEnabled,
      },
    });

    // Reload provider in registry
    if (data.isEnabled) {
      await providerRegistry.reloadProvider(provider.id);
    }

    return NextResponse.json(
      {
        success: true,
        provider: {
          id: provider.id,
          name: provider.name,
          slug: provider.slug,
          type: provider.type,
          isEnabled: provider.isEnabled,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ADMIN_PROVIDERS_POST]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create provider',
      },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 403 : 500 }
    );
  }
}
