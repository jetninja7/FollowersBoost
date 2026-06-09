import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED';

export interface OrderCardProps {
  order: {
    id: string;
    serviceId: string;
    quantity: number;
    totalPrice: number | string;
    targetUrl: string;
    status: OrderStatus;
    progress?: number;
    startCount?: number;
    currentCount?: number;
    createdAt: Date | string;
  };
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

function calculateProgress(order: OrderCardProps['order']): number {
  if (order.progress !== undefined && order.progress !== null) {
    return order.progress;
  }
  if (
    order.startCount !== undefined &&
    order.currentCount !== undefined &&
    order.startCount !== null &&
    order.currentCount !== null
  ) {
    const delivered = order.currentCount - order.startCount;
    return Math.min(100, Math.max(0, (delivered / order.quantity) * 100));
  }
  return 0;
}

/**
 * Order Card Component
 * Displays a single order with status, progress, and details
 */
export function OrderCard({ order }: OrderCardProps) {
  const progress = calculateProgress(order);
  const priceValue =
    typeof order.totalPrice === 'string'
      ? parseFloat(order.totalPrice)
      : order.totalPrice;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Service #{order.serviceId.slice(0, 8)}
            </h3>
            <Badge className={getStatusColor(order.status)}>
              {order.status.replace('_', ' ')}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate max-w-xl">
            {order.targetUrl}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Quantity: {order.quantity.toLocaleString()}</span>
            <span>•</span>
            <span>Paid: ${priceValue.toFixed(2)}</span>
            <span>•</span>
            <span>{formatRelativeTime(order.createdAt)}</span>
          </div>

          {order.status === 'IN_PROGRESS' && progress > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">
                  Progress
                </span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        <Link href={`/dashboard/orders/${order.id}`}>
          <Button variant="ghost" size="sm">
            View Details →
          </Button>
        </Link>
      </div>
    </Card>
  );
}
