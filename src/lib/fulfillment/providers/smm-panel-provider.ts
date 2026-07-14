/**
 * Generic SMM Panel Provider
 *
 * This provider implements the common SMM panel API format used by most providers.
 * Many SMM panels follow a similar REST API structure with slight variations.
 *
 * Common providers this works with:
 * - JustAnother Panel
 * - PerfectPanel
 * - SMM Heaven
 * - And many others following similar API patterns
 */

import { BaseFulfillmentProvider } from '../base-provider';
import {
  ProviderCapabilities,
  CreateProviderOrderParams,
  ProviderOrderResponse,
  ProviderStatusUpdate,
  ProviderServiceConfig,
  ProviderOrderStatus,
  ProviderError,
} from '../types';

/**
 * SMM Panel API response formats
 */
interface SMMPanelOrderResponse {
  order?: number | string; // Order ID
  error?: string;
  success?: boolean;
}

interface SMMPanelStatusResponse {
  status: string; // "Pending", "In progress", "Completed", "Canceled", "Partial", "Processing", "In Progress"
  charge: string; // Cost charged
  start_count?: string; // Starting count
  remains: string; // Quantity remaining
  error?: string;
}

interface SMMPanelService {
  service: number | string;
  name: string;
  type: string;
  rate: string; // Price per 1000
  min: string; // Minimum quantity
  max: string; // Maximum quantity
  category?: string;
}

/**
 * Standardized SMM Panel API Provider
 *
 * Configure via environment variables:
 * - SMM_PANEL_API_URL: Base API URL
 * - SMM_PANEL_API_KEY: API key for authentication
 */
export class SMMPanelProvider extends BaseFulfillmentProvider {
  readonly providerId = 'smm-panel';
  readonly name = 'Generic SMM Panel';
  readonly type = 'API';
  readonly capabilities: ProviderCapabilities = {
    supportsWebhooks: false, // Most SMM panels don't support webhooks
    supportsCancellation: true,
    supportsPartialRefund: false,
    rateLimitPerMinute: 60, // Conservative default
    averageFulfillmentTime: 24, // 24 hours average
  };

  private get apiUrl(): string {
    return this.config.credentials.apiUrl as string;
  }

  private get apiKey(): string {
    return this.config.credentials.apiKey as string;
  }

  /**
   * Create order with SMM panel
   */
  async createOrder(
    params: CreateProviderOrderParams
  ): Promise<ProviderOrderResponse> {
    return this.executeWithRetry(async () => {
      const requestBody = {
        key: this.apiKey,
        action: 'add',
        service: params.serviceId,
        link: params.targetUrl,
        quantity: params.quantity,
      };

      const response = await this.makeRequest<SMMPanelOrderResponse>(
        this.apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        this.config.settings?.timeout || 30000
      );

      if (response.error) {
        throw new ProviderError(
          response.error,
          'ORDER_CREATION_FAILED',
          undefined,
          this.isRetryableError(response.error)
        );
      }

      if (!response.order) {
        throw new ProviderError(
          'No order ID returned from provider',
          'INVALID_RESPONSE'
        );
      }

      return {
        providerOrderId: String(response.order),
        status: ProviderOrderStatus.PENDING,
        quantity: params.quantity,
        currentCount: 0,
        message: 'Order created successfully',
      };
    }, 'createOrder');
  }

  /**
   * Get order status from SMM panel
   */
  async getOrderStatus(providerOrderId: string): Promise<ProviderStatusUpdate> {
    return this.executeWithRetry(async () => {
      const requestBody = {
        key: this.apiKey,
        action: 'status',
        order: providerOrderId,
      };

      const response = await this.makeRequest<SMMPanelStatusResponse>(
        this.apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        this.config.settings?.timeout || 30000
      );

      if (response.error) {
        throw new ProviderError(response.error, 'STATUS_CHECK_FAILED', undefined, true);
      }

      const status = this.normalizeStatus(response.status);
      const remains = parseInt(response.remains) || 0;
      const startCount = parseInt(response.start_count || '0') || 0;

      // Calculate current count from remains
      const totalQuantity = startCount + remains;
      const currentCount = Math.max(0, totalQuantity - remains);

      return {
        providerOrderId,
        status,
        currentCount,
        quantity: totalQuantity,
        updatedAt: new Date(),
      };
    }, 'getOrderStatus');
  }

  /**
   * Cancel order with SMM panel
   */
  async cancelOrder(providerOrderId: string): Promise<void> {
    return this.executeWithRetry(async () => {
      const requestBody = {
        key: this.apiKey,
        action: 'cancel',
        orders: providerOrderId,
      };

      const response = await this.makeRequest<{ error?: string }>(
        this.apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        this.config.settings?.timeout || 30000
      );

      if (response.error) {
        throw new ProviderError(response.error, 'CANCELLATION_FAILED');
      }
    }, 'cancelOrder');
  }

  /**
   * Get available services from SMM panel
   */
  async getAvailableServices(): Promise<ProviderServiceConfig[]> {
    return this.executeWithRetry(async () => {
      const requestBody = {
        key: this.apiKey,
        action: 'services',
      };

      const response = await this.makeRequest<SMMPanelService[]>(
        this.apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        this.config.settings?.timeout || 30000
      );

      return response.map((service) => ({
        providerServiceId: String(service.service),
        minQuantity: parseInt(service.min) || undefined,
        maxQuantity: parseInt(service.max) || undefined,
        pricePerUnit: parseFloat(service.rate) / 1000, // Rate is per 1000
      }));
    }, 'getAvailableServices');
  }

  /**
   * Normalize SMM panel status to our standard status
   */
  private normalizeStatus(status: string): ProviderOrderStatus {
    const normalized = status.toLowerCase().replace(/\s+/g, '');

    switch (normalized) {
      case 'pending':
      case 'processing':
        return ProviderOrderStatus.PENDING;
      case 'inprogress':
      case 'in progress':
        return ProviderOrderStatus.IN_PROGRESS;
      case 'completed':
      case 'complete':
        return ProviderOrderStatus.COMPLETED;
      case 'partial':
        return ProviderOrderStatus.PARTIAL;
      case 'canceled':
      case 'cancelled':
        return ProviderOrderStatus.CANCELLED;
      case 'failed':
      case 'error':
        return ProviderOrderStatus.FAILED;
      default:
        return ProviderOrderStatus.PENDING;
    }
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: string): boolean {
    const retryableErrors = [
      'timeout',
      'rate limit',
      'too many requests',
      'service unavailable',
      'temporarily unavailable',
    ];

    return retryableErrors.some((pattern) =>
      error.toLowerCase().includes(pattern)
    );
  }
}
