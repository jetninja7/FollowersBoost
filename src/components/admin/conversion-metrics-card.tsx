'use client';

import { Card } from '@/components/ui/card';
import { ConversionMetrics } from '@/actions/analytics-advanced';
import { Users, TrendingUp, Repeat, Clock } from 'lucide-react';

interface ConversionMetricsCardProps {
  data: ConversionMetrics;
}

export function ConversionMetricsCard({ data }: ConversionMetricsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">Conversion Metrics</h3>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">Conversion Rate</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {data.conversionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.usersWithOrders} of {data.totalUsers} users converted
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Repeat className="h-4 w-4" />
            <span className="text-sm">Repeat Customers</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {data.repeatCustomerRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Users with 2+ orders
          </p>
        </div>

        <div className="col-span-2 pt-4 border-t">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Avg. Time to First Order</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.avgTimeToFirstOrder.toFixed(1)} days
          </p>
        </div>
      </div>
    </Card>
  );
}
