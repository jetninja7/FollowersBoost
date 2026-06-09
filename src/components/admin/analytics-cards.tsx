import { Card } from '@/components/ui/card';
import {
  DollarSign,
  ShoppingCart,
  Users as UsersIcon,
  TrendingUp
} from 'lucide-react';

interface RevenueStats {
  total: string;
  today: string;
  thisWeek: string;
  thisMonth: string;
}

interface OrderStats {
  total: number;
  byStatus: Record<string, { count: number; percentage: number }>;
}

interface UserStats {
  total: number;
  newThisWeek: number;
  active: number;
}

interface TopService {
  name: string;
  platform: string;
  revenue: string;
  orderCount: number;
}

interface AnalyticsCardsProps {
  revenue: RevenueStats;
  orders: OrderStats;
  users: UserStats;
  topServices: TopService[];
}

export function AnalyticsCards({ revenue, orders, users, topServices }: AnalyticsCardsProps) {
  return (
    <div className="space-y-6">
      {/* Revenue Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">Revenue</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">${revenue.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Today</p>
            <p className="text-2xl font-bold text-gray-900">${revenue.today}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">This Week</p>
            <p className="text-2xl font-bold text-gray-900">${revenue.thisWeek}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold text-gray-900">${revenue.thisMonth}</p>
          </div>
        </div>
      </Card>

      {/* Order Stats Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Orders</h2>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Total: <span className="font-semibold text-gray-900">{orders.total}</span>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {Object.entries(orders.byStatus).map(([status, data]) => (
              <div key={status} className="border rounded p-3">
                <p className="text-xs text-gray-600 uppercase">{status}</p>
                <p className="text-lg font-semibold text-gray-900">{data.count}</p>
                <p className="text-xs text-gray-500">{data.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* User Stats Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <UsersIcon className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Users</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{users.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">New This Week</p>
            <p className="text-2xl font-bold text-gray-900">{users.newThisWeek}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Active (30d)</p>
            <p className="text-2xl font-bold text-gray-900">{users.active}</p>
          </div>
        </div>
      </Card>

      {/* Top Services Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          <h2 className="text-lg font-semibold">Top Services</h2>
        </div>
        <div className="space-y-3">
          {topServices.map((service, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{service.name}</p>
                <p className="text-sm text-gray-600">{service.platform}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${service.revenue}</p>
                <p className="text-sm text-gray-600">{service.orderCount} orders</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
