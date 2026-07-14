/**
 * Base Fulfillment Provider
 *
 * Abstract base class providing common functionality for all providers.
 * Includes retry logic, error handling, and health tracking.
 */

import {
  IFulfillmentProvider,
  ProviderConfig,
  ProviderError,
  RetryPolicy,
  DEFAULT_RETRY_POLICY,
  CreateProviderOrderParams,
  ProviderOrderResponse,
  ProviderStatusUpdate,
  ProviderServiceConfig,
  ProviderHealth,
  ProviderCapabilities,
} from './types';
import { logger } from '@/lib/logger';

export abstract class BaseFulfillmentProvider implements IFulfillmentProvider {
  protected config!: ProviderConfig;
  protected retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY;
  protected healthMetrics: {
    successCount: number;
    failureCount: number;
    responseTimes: number[];
    lastSuccessfulCall?: Date;
    lastFailedCall?: Date;
  } = {
    successCount: 0,
    failureCount: 0,
    responseTimes: [],
  };

  abstract readonly providerId: string;
  abstract readonly name: string;
  abstract readonly type: string;
  abstract readonly capabilities: ProviderCapabilities;

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    logger.info(
      { providerId: this.providerId, name: this.name },
      'Provider initialized'
    );
  }

  /**
   * Execute operation with retry logic and health tracking
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: ProviderError | undefined;
    const startTime = Date.now();

    for (let attempt = 0; attempt < this.retryPolicy.maxAttempts; attempt++) {
      try {
        const result = await operation();

        // Track success
        const duration = Date.now() - startTime;
        this.recordSuccess(duration);

        return result;
      } catch (error) {
        const providerError = this.normalizeError(error);
        lastError = providerError;

        logger.warn(
          {
            providerId: this.providerId,
            operation: operationName,
            attempt: attempt + 1,
            maxAttempts: this.retryPolicy.maxAttempts,
            error: providerError.message,
            retryable: providerError.retryable,
          },
          'Provider operation failed'
        );

        // Don't retry if error is not retryable or this was the last attempt
        if (
          !this.retryPolicy.shouldRetry(providerError) ||
          attempt === this.retryPolicy.maxAttempts - 1
        ) {
          this.recordFailure();
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryPolicy.initialDelay *
            Math.pow(this.retryPolicy.backoffMultiplier, attempt),
          this.retryPolicy.maxDelay
        );

        logger.info(
          { providerId: this.providerId, delay, attempt: attempt + 1 },
          'Retrying provider operation'
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Normalize any error into a ProviderError
   */
  protected normalizeError(error: unknown): ProviderError {
    if (error instanceof ProviderError) {
      return error;
    }

    if (error instanceof Error) {
      // Check if it's a network/timeout error (retryable)
      const retryable =
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND');

      return new ProviderError(error.message, 'UNKNOWN_ERROR', undefined, retryable);
    }

    return new ProviderError('Unknown error occurred', 'UNKNOWN_ERROR');
  }

  /**
   * Record successful operation
   */
  protected recordSuccess(responseTime: number): void {
    this.healthMetrics.successCount++;
    this.healthMetrics.lastSuccessfulCall = new Date();
    this.healthMetrics.responseTimes.push(responseTime);

    // Keep only last 100 response times
    if (this.healthMetrics.responseTimes.length > 100) {
      this.healthMetrics.responseTimes.shift();
    }
  }

  /**
   * Record failed operation
   */
  protected recordFailure(): void {
    this.healthMetrics.failureCount++;
    this.healthMetrics.lastFailedCall = new Date();
  }

  /**
   * Sleep helper
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate error rate (0 to 1)
   */
  protected getErrorRate(): number {
    const total = this.healthMetrics.successCount + this.healthMetrics.failureCount;
    if (total === 0) return 0;
    return this.healthMetrics.failureCount / total;
  }

  /**
   * Get average response time
   */
  protected getAverageResponseTime(): number | undefined {
    if (this.healthMetrics.responseTimes.length === 0) return undefined;
    const sum = this.healthMetrics.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.healthMetrics.responseTimes.length);
  }

  /**
   * Check provider health
   */
  async checkHealth(): Promise<ProviderHealth> {
    const errorRate = this.getErrorRate();
    const isHealthy = errorRate < 0.5 && this.config.isEnabled;

    return {
      isHealthy,
      lastSuccessfulCall: this.healthMetrics.lastSuccessfulCall,
      lastFailedCall: this.healthMetrics.lastFailedCall,
      errorRate,
      averageResponseTime: this.getAverageResponseTime(),
    };
  }

  /**
   * Make HTTP request with timeout
   */
  protected async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    timeout: number = 30000
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ProviderError(
          `HTTP ${response.status}: ${response.statusText}`,
          'HTTP_ERROR',
          response.status,
          response.status >= 500 // Retry on 5xx errors
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ProviderError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new ProviderError(
          'Request timeout',
          'TIMEOUT',
          undefined,
          true // Timeouts are retryable
        );
      }

      throw this.normalizeError(error);
    }
  }

  // Abstract methods that subclasses must implement
  abstract createOrder(
    params: CreateProviderOrderParams
  ): Promise<ProviderOrderResponse>;

  abstract getOrderStatus(providerOrderId: string): Promise<ProviderStatusUpdate>;

  abstract cancelOrder(providerOrderId: string): Promise<void>;

  abstract getAvailableServices(): Promise<ProviderServiceConfig[]>;
}
