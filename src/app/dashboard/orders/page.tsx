'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED';

interface Order {
  id: string;
  userId: string;
  serviceId: string;
  quantity: number;
  totalPrice: number | string;
  targetUrl: string;
  notes?: string;
  status: OrderStatus;
  startCount?: number;
  currentCount?: number;
  progress?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface OrdersResponse {
  data: Order[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function getStatusVariant(
  status: OrderStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PENDING':
      return 'secondary'; // gray
    case 'PROCESSING':
      return 'default'; // blue
    case 'IN_PROGRESS':
      return 'default'; // yellow - using default for now
    case 'COMPLETED':
      return 'secondary'; // green - using secondary for now
    case 'CANCELLED':
      return 'outline'; // red outline
    case 'REFUNDED':
      return 'outline';
    case 'FAILED':
      return 'destructive'; // red solid
    default:
      return 'secondary';
  }
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

function calculateProgress(order: Order): number {
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
      });

      if (selectedStatus !== 'all') {
        params.set('status', selectedStatus);
      }

      const response = await fetch(`/api/orders?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data: OrdersResponse = await response.json();
      setOrders(data.data);
      setTotalPages(data.meta.totalPages);
      setTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (value: string | null) => {
    setSelectedStatus(value || 'all');
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleClearFilters = () => {
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  const hasFilters = selectedStatus !== 'all';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Orders
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track and manage your service orders
          </p>
        </div>
        <Link href="/dashboard/services">
          <Button>New Order</Button>
        </Link>
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label
            htmlFor="status-filter"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Status:
          </label>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger id="status-filter" className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={fetchOrders} className="mt-4" variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              No orders yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start by browsing our services
            </p>
            <Link href="/dashboard/services">
              <Button>Browse Services</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Order List */}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const progress = calculateProgress(order);
            const priceValue =
              typeof order.totalPrice === 'string'
                ? parseFloat(order.totalPrice)
                : order.totalPrice;

            return (
              <Card key={order.id} className="p-4">
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
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && orders.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages} ({total} total orders)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
