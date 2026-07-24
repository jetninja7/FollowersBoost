/**
 * Provider Registry
 *
 * Central registry for managing all fulfillment providers.
 * Handles provider instantiation, configuration loading, and provider selection.
 */

import { prisma } from '@/lib/db/prisma';
import { IFulfillmentProvider, ProviderConfig } from './types';
import { SMMPanelProvider } from './providers/smm-panel-provider';
import { MockProvider } from './providers/mock-provider';
import { decryptCredentials, isEncryptionEnabled } from '@/lib/crypto/encryption';
import { logger } from '@/lib/logger';

type ProviderClass = new () => IFulfillmentProvider;

/**
 * Registry of available provider implementations
 */
const PROVIDER_CLASSES: Record<string, ProviderClass> = {
  'smm-panel': SMMPanelProvider,
  mock: MockProvider,
};

/**
 * Provider Registry Singleton
 */
class ProviderRegistry {
  private providers: Map<string, IFulfillmentProvider> = new Map();
  private initialized = false;

  /**
   * Initialize registry by loading providers from database
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.info('Provider registry already initialized');
      return;
    }

    logger.info('Initializing provider registry');

    try {
      const dbProviders = await prisma.provider.findMany({
        where: { isEnabled: true },
        orderBy: { priority: 'desc' },
      });

      for (const dbProvider of dbProviders) {
        try {
          await this.loadProvider(dbProvider);
        } catch (error) {
          logger.error(
            { providerId: dbProvider.id, error },
            'Failed to load provider during initialization'
          );
        }
      }

      this.initialized = true;
      logger.info(
        { providerCount: this.providers.size },
        'Provider registry initialized'
      );
    } catch (error) {
      logger.error({ error }, 'Failed to initialize provider registry');
      throw error;
    }
  }

  /**
   * Load and initialize a provider from database config
   */
  private async loadProvider(dbProvider: {
    id: string;
    name: string;
    slug: string;
    type: string;
    isEnabled: boolean;
    apiUrl: string | null;
    credentials: unknown;
    settings: unknown;
  }): Promise<void> {
    const ProviderClass = PROVIDER_CLASSES[dbProvider.slug];

    if (!ProviderClass) {
      logger.warn(
        { slug: dbProvider.slug },
        'Provider implementation not found for slug'
      );
      return;
    }

    // Decrypt credentials if encrypted
    let decryptedCredentials: Record<string, unknown> = {};
    if (dbProvider.credentials) {
      const creds = dbProvider.credentials as any;
      if (isEncryptionEnabled() && creds.encrypted) {
        try {
          decryptedCredentials = decryptCredentials(creds.encrypted);
          logger.info({ providerId: dbProvider.id }, 'Decrypted provider credentials');
        } catch (error) {
          logger.error(
            { providerId: dbProvider.id, error },
            'Failed to decrypt provider credentials'
          );
          throw new Error('Failed to decrypt provider credentials');
        }
      } else {
        decryptedCredentials = creds;
      }
    }

    const config: ProviderConfig = {
      id: dbProvider.id,
      name: dbProvider.name,
      type: dbProvider.type as 'API' | 'MANUAL' | 'CUSTOM',
      isEnabled: dbProvider.isEnabled,
      credentials: {
        apiUrl: dbProvider.apiUrl || undefined,
        ...decryptedCredentials,
      },
      settings: (dbProvider.settings as Record<string, unknown>) || {},
    };

    const provider = new ProviderClass();
    await provider.initialize(config);

    this.providers.set(dbProvider.id, provider);

    logger.info(
      { providerId: dbProvider.id, providerName: dbProvider.name },
      'Provider loaded successfully'
    );
  }

  /**
   * Get provider by ID
   */
  getProvider(providerId: string): IFulfillmentProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get all available providers
   */
  getAllProviders(): IFulfillmentProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get enabled providers sorted by priority
   */
  async getEnabledProviders(): Promise<IFulfillmentProvider[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return Array.from(this.providers.values());
  }

  /**
   * Select best provider for a service
   * Uses health metrics and priority to choose optimal provider
   */
  async selectProviderForService(serviceId: string): Promise<IFulfillmentProvider | null> {
    const providers = await this.getEnabledProviders();

    if (providers.length === 0) {
      logger.warn('No enabled providers available');
      return null;
    }

    // Check which providers support this service
    const dbProviderServices = await prisma.providerService.findMany({
      where: {
        serviceId,
        isEnabled: true,
        provider: { isEnabled: true },
      },
      include: {
        provider: true,
      },
      orderBy: {
        provider: { priority: 'desc' },
      },
    });

    if (dbProviderServices.length === 0) {
      logger.warn({ serviceId }, 'No providers configured for service');
      return null;
    }

    // Try providers in priority order, checking health
    for (const dbProviderService of dbProviderServices) {
      const provider = this.providers.get(dbProviderService.providerId);

      if (!provider) {
        continue;
      }

      const health = await provider.checkHealth();

      if (health.isHealthy) {
        logger.info(
          {
            serviceId,
            providerId: dbProviderService.providerId,
            providerName: provider.name,
          },
          'Selected provider for service'
        );
        return provider;
      } else {
        logger.warn(
          {
            serviceId,
            providerId: dbProviderService.providerId,
            providerName: provider.name,
            errorRate: health.errorRate,
          },
          'Provider unhealthy, trying next'
        );
      }
    }

    // If no healthy provider found, return highest priority one anyway
    const fallbackProvider = this.providers.get(dbProviderServices[0].providerId);

    if (fallbackProvider) {
      logger.warn(
        {
          serviceId,
          providerId: dbProviderServices[0].providerId,
          providerName: fallbackProvider.name,
        },
        'No healthy provider found, using highest priority as fallback'
      );
    }

    return fallbackProvider || null;
  }

  /**
   * Reload provider configuration from database
   */
  async reloadProvider(providerId: string): Promise<void> {
    const dbProvider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!dbProvider) {
      throw new Error(`Provider ${providerId} not found in database`);
    }

    // Remove old instance
    this.providers.delete(providerId);

    // Load new instance if enabled
    if (dbProvider.isEnabled) {
      await this.loadProvider(dbProvider);
    }

    logger.info({ providerId }, 'Provider reloaded');
  }

  /**
   * Reload all providers from database
   */
  async reloadAll(): Promise<void> {
    this.providers.clear();
    this.initialized = false;
    await this.initialize();
  }

  /**
   * Register a new provider class (for plugins/extensions)
   */
  registerProviderClass(slug: string, ProviderClass: ProviderClass): void {
    PROVIDER_CLASSES[slug] = ProviderClass;
    logger.info({ slug }, 'Provider class registered');
  }

  /**
   * Get available provider slugs
   */
  getAvailableProviderSlugs(): string[] {
    return Object.keys(PROVIDER_CLASSES);
  }
}

// Singleton instance
export const providerRegistry = new ProviderRegistry();

/**
 * Ensure registry is initialized
 * Call this at app startup or before first use
 */
export async function initializeProviderRegistry(): Promise<void> {
  await providerRegistry.initialize();
}

/**
 * Helper function to get a provider
 */
export function getProvider(providerId: string): IFulfillmentProvider | undefined {
  return providerRegistry.getProvider(providerId);
}

/**
 * Helper function to select best provider for a service
 */
export async function selectProviderForService(
  serviceId: string
): Promise<IFulfillmentProvider | null> {
  return providerRegistry.selectProviderForService(serviceId);
}
