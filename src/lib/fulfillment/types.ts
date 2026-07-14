/**
 * Fulfillment Provider Types & Interfaces
 *
 * This module defines the contract that all fulfillment providers must implement.
 * Providers are external services (SMM panels, API providers) that fulfill orders.
 */

import { OrderStatus } from '@prisma/client';

/**
 * Standardized provider response for order submission
 */
export interface ProviderOrderResponse {
  /** Provider's unique order ID for tracking */
  providerOrderId: string;
  /** Current status from provider */
  status: ProviderOrderStatus;
  /** Number of units delivered so far */
  currentCount?: number;
  /** Total units to be delivered */
  quantity: number;
  /** Any message from provider */
  message?: string;
  /** Estimated completion time (if provided) */
  estimatedCompletionTime?: Date;
}

/**
 * Provider status update (from webhooks or polling)
 */
export interface ProviderStatusUpdate {
  /** Provider's order ID */
  providerOrderId: string;
  /** Current status */
  status: ProviderOrderStatus;
  /** Current delivery count */
  currentCount?: number;
  /** Total quantity */
  quantity: number;
  /** Error message if failed */
  errorMessage?: string;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Standard provider order statuses
 */
export enum ProviderOrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PARTIAL = 'PARTIAL', // Partially completed, stopped
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Map provider status to our internal order status
 */
export function mapProviderStatusToOrderStatus(
  providerStatus: ProviderOrderStatus
): OrderStatus {
  switch (providerStatus) {
    case ProviderOrderStatus.PENDING:
      return 'PROCESSING';
    case ProviderOrderStatus.IN_PROGRESS:
      return 'IN_PROGRESS';
    case ProviderOrderStatus.COMPLETED:
      return 'COMPLETED';
    case ProviderOrderStatus.PARTIAL:
    case ProviderOrderStatus.FAILED:
      return 'FAILED';
    case ProviderOrderStatus.CANCELLED:
      return 'CANCELLED';
    default:
      return 'PROCESSING';
  }
}

/**
 * Provider service configuration
 */
export interface ProviderServiceConfig {
  /** Provider's internal service ID/code */
  providerServiceId: string;
  /** Minimum quantity allowed */
  minQuantity?: number;
  /** Maximum quantity allowed */
  maxQuantity?: number;
  /** Price per unit (in provider's currency) */
  pricePerUnit?: number;
}

/**
 * Parameters for creating an order with a provider
 */
export interface CreateProviderOrderParams {
  /** Service identifier from provider */
  serviceId: string;
  /** Target URL (profile, post, video, etc.) */
  targetUrl: string;
  /** Quantity to deliver */
  quantity: number;
  /** Optional starting count for validation */
  startCount?: number;
  /** Additional notes for provider */
  notes?: string;
}

/**
 * Provider capabilities and features
 */
export interface ProviderCapabilities {
  /** Supports status webhooks */
  supportsWebhooks: boolean;
  /** Supports order cancellation */
  supportsCancellation: boolean;
  /** Supports partial refunds */
  supportsPartialRefund: boolean;
  /** Maximum orders per minute */
  rateLimitPerMinute?: number;
  /** Average fulfillment time in hours */
  averageFulfillmentTime?: number;
}

/**
 * Provider health status
 */
export interface ProviderHealth {
  /** Is provider currently operational */
  isHealthy: boolean;
  /** Last successful API call timestamp */
  lastSuccessfulCall?: Date;
  /** Last failed API call timestamp */
  lastFailedCall?: Date;
  /** Current error rate (0-1) */
  errorRate: number;
  /** Average response time in ms */
  averageResponseTime?: number;
}

/**
 * Base interface that all fulfillment providers must implement
 */
export interface IFulfillmentProvider {
  /** Provider unique identifier */
  readonly providerId: string;

  /** Provider display name */
  readonly name: string;

  /** Provider type (API, MANUAL, etc.) */
  readonly type: string;

  /** Provider capabilities */
  readonly capabilities: ProviderCapabilities;

  /**
   * Initialize provider with configuration
   * Called once when provider is instantiated
   */
  initialize(config: ProviderConfig): Promise<void>;

  /**
   * Create a new order with the provider
   * @throws ProviderError if order creation fails
   */
  createOrder(params: CreateProviderOrderParams): Promise<ProviderOrderResponse>;

  /**
   * Get current status of an order
   * @throws ProviderError if status check fails
   */
  getOrderStatus(providerOrderId: string): Promise<ProviderStatusUpdate>;

  /**
   * Cancel an existing order (if supported)
   * @throws ProviderError if cancellation fails
   */
  cancelOrder(providerOrderId: string): Promise<void>;

  /**
   * Get list of available services from provider
   * Used for syncing provider services with our Service model
   */
  getAvailableServices(): Promise<ProviderServiceConfig[]>;

  /**
   * Check provider health/availability
   */
  checkHealth(): Promise<ProviderHealth>;

  /**
   * Validate webhook signature (if webhooks supported)
   */
  validateWebhook?(payload: unknown, signature: string): boolean;

  /**
   * Parse webhook payload into standardized status update
   */
  parseWebhook?(payload: unknown): ProviderStatusUpdate;
}

/**
 * Provider configuration stored in database
 */
export interface ProviderConfig {
  /** Provider ID */
  id: string;
  /** Provider name */
  name: string;
  /** Provider type */
  type: 'API' | 'MANUAL' | 'CUSTOM';
  /** Is provider enabled */
  isEnabled: boolean;
  /** API credentials and settings (encrypted in DB) */
  credentials: {
    apiUrl?: string;
    apiKey?: string;
    apiSecret?: string;
    webhookSecret?: string;
    [key: string]: unknown;
  };
  /** Provider-specific settings */
  settings?: {
    timeout?: number;
    retryAttempts?: number;
    rateLimitPerMinute?: number;
    [key: string]: unknown;
  };
}

/**
 * Custom error class for provider-related errors
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Retry policy for failed provider operations
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in ms */
  initialDelay: number;
  /** Maximum delay in ms */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Should retry this error? */
  shouldRetry: (error: ProviderError) => boolean;
}

/**
 * Default retry policy for provider operations
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  shouldRetry: (error: ProviderError) => error.retryable,
};
