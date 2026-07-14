/**
 * Mock Fulfillment Provider
 *
 * A test provider that simulates order fulfillment without external API calls.
 * Useful for development, testing, and demos.
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

interface MockOrder {
  providerOrderId: string;
  status: ProviderOrderStatus;
  targetUrl: string;
  quantity: number;
  currentCount: number;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Mock Provider for testing and development
 *
 * Simulates order processing with configurable behavior:
 * - Instant success mode (default)
 * - Progressive delivery mode (simulates gradual fulfillment)
 * - Random failure mode (for testing error handling)
 */
export class MockProvider extends BaseFulfillmentProvider {
  readonly providerId = 'mock';
  readonly name = 'Mock Provider (Testing)';
  readonly type = 'CUSTOM';
  readonly capabilities: ProviderCapabilities = {
    supportsWebhooks: true,
    supportsCancellation: true,
    supportsPartialRefund: true,
    rateLimitPerMinute: 1000,
    averageFulfillmentTime: 0.01, // Nearly instant
  };

  private orders: Map<string, MockOrder> = new Map();
  private orderIdCounter = 1;

  private get mode(): 'instant' | 'progressive' | 'random' {
    return (this.config.settings?.mode as 'instant' | 'progressive' | 'random') || 'instant';
  }

  private get failureRate(): number {
    return (this.config.settings?.failureRate as number) || 0.1; // 10% default
  }

  /**
   * Create mock order
   */
  async createOrder(
    params: CreateProviderOrderParams
  ): Promise<ProviderOrderResponse> {
    // Simulate random failures in random mode
    if (this.mode === 'random' && Math.random() < this.failureRate) {
      throw new ProviderError(
        'Simulated random failure',
        'RANDOM_FAILURE',
        undefined,
        true // Retryable
      );
    }

    // Simulate network delay
    await this.sleep(100);

    const providerOrderId = `MOCK-${this.orderIdCounter++}`;

    const mockOrder: MockOrder = {
      providerOrderId,
      status: this.mode === 'instant' ? ProviderOrderStatus.COMPLETED : ProviderOrderStatus.PENDING,
      targetUrl: params.targetUrl,
      quantity: params.quantity,
      currentCount: this.mode === 'instant' ? params.quantity : 0,
      createdAt: new Date(),
      completedAt: this.mode === 'instant' ? new Date() : undefined,
    };

    this.orders.set(providerOrderId, mockOrder);

    // Start progressive delivery simulation in background
    if (this.mode === 'progressive') {
      this.simulateProgressiveDelivery(providerOrderId).catch((err) => {
        console.error('Progressive delivery simulation error:', err);
      });
    }

    return {
      providerOrderId,
      status: mockOrder.status,
      quantity: params.quantity,
      currentCount: mockOrder.currentCount,
      message: `Mock order created (mode: ${this.mode})`,
      estimatedCompletionTime: this.mode === 'instant' ? undefined : new Date(Date.now() + 60000), // 1 minute
    };
  }

  /**
   * Get mock order status
   */
  async getOrderStatus(providerOrderId: string): Promise<ProviderStatusUpdate> {
    await this.sleep(50); // Simulate network delay

    const order = this.orders.get(providerOrderId);

    if (!order) {
      throw new ProviderError(
        `Order ${providerOrderId} not found`,
        'ORDER_NOT_FOUND'
      );
    }

    return {
      providerOrderId,
      status: order.status,
      currentCount: order.currentCount,
      quantity: order.quantity,
      updatedAt: new Date(),
    };
  }

  /**
   * Cancel mock order
   */
  async cancelOrder(providerOrderId: string): Promise<void> {
    await this.sleep(50);

    const order = this.orders.get(providerOrderId);

    if (!order) {
      throw new ProviderError(
        `Order ${providerOrderId} not found`,
        'ORDER_NOT_FOUND'
      );
    }

    if (order.status === ProviderOrderStatus.COMPLETED) {
      throw new ProviderError(
        'Cannot cancel completed order',
        'CANCELLATION_NOT_ALLOWED'
      );
    }

    order.status = ProviderOrderStatus.CANCELLED;
    order.completedAt = new Date();
  }

  /**
   * Get mock services list
   */
  async getAvailableServices(): Promise<ProviderServiceConfig[]> {
    await this.sleep(100);

    return [
      {
        providerServiceId: 'mock-instagram-followers',
        minQuantity: 100,
        maxQuantity: 100000,
        pricePerUnit: 0.001, // $0.001 per follower
      },
      {
        providerServiceId: 'mock-instagram-likes',
        minQuantity: 50,
        maxQuantity: 50000,
        pricePerUnit: 0.0008,
      },
      {
        providerServiceId: 'mock-tiktok-followers',
        minQuantity: 100,
        maxQuantity: 100000,
        pricePerUnit: 0.0012,
      },
      {
        providerServiceId: 'mock-youtube-views',
        minQuantity: 500,
        maxQuantity: 1000000,
        pricePerUnit: 0.0005,
      },
    ];
  }

  /**
   * Simulate progressive order fulfillment
   * Gradually increases currentCount until completed
   */
  private async simulateProgressiveDelivery(providerOrderId: string): Promise<void> {
    const order = this.orders.get(providerOrderId);
    if (!order) return;

    // Transition to IN_PROGRESS
    order.status = ProviderOrderStatus.IN_PROGRESS;

    // Deliver in 10 increments over 30 seconds
    const incrementSize = Math.ceil(order.quantity / 10);
    const delayBetweenIncrements = 3000; // 3 seconds

    while (order.currentCount < order.quantity) {
      await this.sleep(delayBetweenIncrements);

      // Check if order was cancelled
      if (order.status === ProviderOrderStatus.CANCELLED) {
        return;
      }

      order.currentCount = Math.min(
        order.currentCount + incrementSize,
        order.quantity
      );

      // If complete, mark as completed
      if (order.currentCount >= order.quantity) {
        order.status = ProviderOrderStatus.COMPLETED;
        order.completedAt = new Date();
      }
    }
  }

  /**
   * Clear all mock orders (useful for testing)
   */
  clearOrders(): void {
    this.orders.clear();
    this.orderIdCounter = 1;
  }

  /**
   * Get all mock orders (useful for debugging)
   */
  getAllOrders(): MockOrder[] {
    return Array.from(this.orders.values());
  }
}
