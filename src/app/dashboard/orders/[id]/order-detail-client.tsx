'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePolling } from '@/lib/hooks/use-polling';
import { toast } from 'sonner';

type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED';

interface OrderData {
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  platform: string;
  quantity: number;
  totalPrice: string;
  status: OrderStatus;
  targetUrl: string;
  startCount: number | null;
  currentCount: number | null;
  notes: string | null;
  estimatedDeliveryTime: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  unitPrice: string;
}

interface OrderDetailResponse {
  data: {
    id: string;
    userId: string;
    serviceId: string;
    quantity: number;
    totalPrice: string;
    status: OrderStatus;
    targetUrl: string;
    startCount: number | null;
    currentCount: number | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
  };
}

interface OrderDetailClientProps {
  initialOrder: OrderData;
}

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    case 'PROCESSING':
      return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
    case 'IN_PROGRESS':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
    case 'COMPLETED':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
    case 'CANCELLED':
      return 'text-red-600 bg-red-50 border-red-300 dark:text-red-400 dark:bg-red-950 dark:border-red-800';
    case 'REFUNDED':
      return 'text-purple-600 bg-purple-50 border-purple-300 dark:text-purple-400 dark:bg-purple-950 dark:border-purple-800';
    case 'FAILED':
      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
  }
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatFullDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function calculateProgress(order: OrderData): number {
  if (
    order.startCount !== null &&
    order.currentCount !== null &&
    order.startCount !== undefined &&
    order.currentCount !== undefined
  ) {
    const delivered = order.currentCount - order.startCount;
    return Math.min(100, Math.max(0, (delivered / order.quantity) * 100));
  }
  return 0;
}

export function OrderDetailClient({ initialOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [order, setOrder] = useState<OrderData>(initialOrder);

  // Enable polling only for active statuses
  const shouldPoll = ['PENDING', 'PROCESSING', 'IN_PROGRESS'].includes(order.status);

  const { data: polledData, isLoading: isPolling } = usePolling<OrderDetailResponse>(
    async () => {
      const res = await fetch(`/api/orders/${order.id}`);
      if (!res.ok) throw new Error('Failed to fetch order');
      return res.json();
    },
    {
      interval: 30000, // 30 seconds
      enabled: shouldPoll,
    }
  );

  // Update order when polled data arrives
  if (polledData?.data && polledData.data.updatedAt !== order.updatedAt) {
    setOrder({
      ...order,
      status: polledData.data.status,
      startCount: polledData.data.startCount,
      currentCount: polledData.data.currentCount,
      updatedAt: polledData.data.updatedAt,
      completedAt: polledData.data.completedAt,
    });
  }

  const handleCancelOrder = async () => {
    // Show confirmation dialog
    if (!confirm('Are you sure you want to cancel this order? Funds will be refunded to your wallet.')) {
      return;
    }

    setIsCancelling(true);

    try {
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to cancel order');
      }

      const result = await response.json();

      toast.success('Order cancelled successfully. Funds refunded to wallet.');

      // Update local order state
      setOrder({
        ...order,
        status: result.data.status,
        updatedAt: result.data.updatedAt,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const progress = calculateProgress(order);
  const priceValue = typeof order.totalPrice === 'string'
    ? parseFloat(order.totalPrice)
    : order.totalPrice;
  const unitPriceValue = typeof order.unitPrice === 'string'
    ? parseFloat(order.unitPrice)
    : order.unitPrice;

  // Define timeline stages
  const getStageStatus = (stage: string): 'completed' | 'current' | 'pending' => {
    const statusOrder = ['PENDING', 'PROCESSING', 'IN_PROGRESS', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(order.status);

    if (stage === 'placed') return 'completed';
    if (stage === 'processing') {
      if (order.status === 'PENDING') return 'current';
      return currentIndex > 0 ? 'completed' : 'pending';
    }
    if (stage === 'in_progress') {
      if (order.status === 'IN_PROGRESS') return 'current';
      if (['COMPLETED', 'CANCELLED', 'FAILED'].includes(order.status)) return 'completed';
      return 'pending';
    }
    if (stage === 'completed') {
      if (order.status === 'COMPLETED') return 'completed';
      return 'pending';
    }
    return 'pending';
  };

  const stages = [
    { label: 'Order Placed', status: getStageStatus('placed') },
    { label: 'Processing', status: getStageStatus('processing') },
    { label: 'In Progress', status: getStageStatus('in_progress') },
    { label: 'Completed', status: getStageStatus('completed') },
  ];

  const canCancel = ['PENDING', 'PROCESSING'].includes(order.status);
  const showContactSupport = ['FAILED'].includes(order.status);
  const showTimeline = !['CANCELLED', 'FAILED', 'REFUNDED'].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Real-Time Update Indicator */}
      {shouldPoll && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Auto-refreshing every 30 seconds...</span>
        </div>
      )}

      {/* Order Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Order #{order.id.slice(0, 8)}</CardTitle>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">
                  Created: {formatFullDate(order.createdAt)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Last updated: {formatRelativeTime(order.updatedAt)}
                </div>
              </div>
            </div>
            <Badge className={`text-base px-4 py-2 ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Timeline (only for non-failed/cancelled orders) */}
      {showTimeline && (
        <Card>
          <CardHeader>
            <CardTitle>Order Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timeline Stepper */}
            <div className="flex items-center justify-between">
              {stages.map((stage, index) => (
                <div key={stage.label} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    {/* Stage Icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        stage.status === 'completed'
                          ? 'bg-green-500 border-green-500 text-white'
                          : stage.status === 'current'
                          ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                          : 'bg-gray-200 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-700'
                      }`}
                    >
                      {stage.status === 'completed' ? (
                        <span className="text-lg">✓</span>
                      ) : stage.status === 'current' ? (
                        <span className="text-lg">⟳</span>
                      ) : (
                        <span className="text-lg">○</span>
                      )}
                    </div>
                    {/* Stage Label */}
                    <div className="mt-2 text-sm font-medium text-center">
                      {stage.label}
                    </div>
                  </div>
                  {/* Connector Line */}
                  {index < stages.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 -mx-2 ${
                        stage.status === 'completed'
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Progress Bar (only for IN_PROGRESS orders) */}
            {order.status === 'IN_PROGRESS' && progress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Progress</span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Start: {order.startCount?.toLocaleString() || 0}</span>
                  <span>
                    Current: {order.currentCount?.toLocaleString() || 0} / {order.quantity.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Information */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Service</div>
              <div className="text-base font-semibold">{order.serviceName}</div>
            </div>

            {/* Platform */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Platform</div>
              <div className="text-base font-semibold">{order.platform}</div>
            </div>

            {/* Target URL */}
            <div className="space-y-1 md:col-span-2">
              <div className="text-sm font-medium text-muted-foreground">Target URL</div>
              <Link
                href={order.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base text-blue-600 hover:underline dark:text-blue-400 break-all"
              >
                {order.targetUrl}
              </Link>
            </div>

            {/* Quantity */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Quantity</div>
              <div className="text-base font-semibold">{order.quantity.toLocaleString()}</div>
            </div>

            {/* Unit Price */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Unit Price</div>
              <div className="text-base font-semibold">${unitPriceValue.toFixed(4)}</div>
            </div>

            {/* Total Price */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Total Price</div>
              <div className="text-base font-semibold text-green-600 dark:text-green-400">
                ${priceValue.toFixed(2)}
              </div>
            </div>

            {/* Estimated Delivery Time */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Estimated Delivery</div>
              <div className="text-base font-semibold">{order.estimatedDeliveryTime}</div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="space-y-1 md:col-span-2">
                <div className="text-sm font-medium text-muted-foreground">Notes</div>
                <div className="text-base text-gray-700 dark:text-gray-300">{order.notes}</div>
              </div>
            )}

            {/* Completion Date */}
            {order.completedAt && (
              <div className="space-y-1 md:col-span-2">
                <div className="text-sm font-medium text-muted-foreground">Completed At</div>
                <div className="text-base font-semibold">{formatFullDate(order.completedAt)}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <Button variant="outline">
            ← Back to Orders
          </Button>
        </Link>

        {canCancel && (
          <Button
            variant="destructive"
            onClick={handleCancelOrder}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        )}

        {showContactSupport && (
          <Button variant="outline">
            Contact Support
          </Button>
        )}
      </div>
    </div>
  );
}
