'use client';

import { Card } from '@/components/ui/card';
import { CustomerSegment } from '@/actions/analytics-advanced';
import { Users, DollarSign, ShoppingCart } from 'lucide-react';

interface CustomerSegmentsChartProps {
  data: CustomerSegment[];
}

export function CustomerSegmentsChart({ data }: CustomerSegmentsChartProps) {
  const totalUsers = data.reduce((sum, segment) => sum + segment.userCount, 0);
  const totalRevenue = data.reduce((sum, segment) => sum + segment.totalRevenue, 0);

  // Define colors for each segment
  const colors = [
    'bg-gray-400',    // New
    'bg-blue-500',    // Occasional
    'bg-green-500',   // Regular
    'bg-purple-600',  // VIP
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Customer Segments</h3>
      </div>

      {/* Horizontal bar showing distribution */}
      <div className="mb-6">
        <div className="flex h-12 rounded-lg overflow-hidden">
          {data.map((segment, index) => {
            const percentage = totalUsers > 0 ? (segment.userCount / totalUsers) * 100 : 0;
            return (
              <div
                key={segment.segment}
                className={`${colors[index]} flex items-center justify-center text-white text-xs font-semibold transition-all hover:opacity-80`}
                style={{ width: `${percentage}%` }}
                title={`${segment.segment}: ${segment.userCount} users (${percentage.toFixed(1)}%)`}
              >
                {percentage >= 10 && `${percentage.toFixed(0)}%`}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed segment breakdown */}
      <div className="space-y-4">
        {data.map((segment, index) => {
          const userPercentage = totalUsers > 0 ? (segment.userCount / totalUsers) * 100 : 0;
          const revenuePercentage = totalRevenue > 0 ? (segment.totalRevenue / totalRevenue) * 100 : 0;

          return (
            <div key={segment.segment} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[index]}`} />
                  <span className="font-semibold text-gray-900">{segment.segment}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {segment.userCount} users ({userPercentage.toFixed(1)}%)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-xs">Revenue</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ${segment.totalRevenue.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {revenuePercentage.toFixed(1)}% of total
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <ShoppingCart className="h-3 w-3" />
                    <span className="text-xs">Avg Orders</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {segment.avgOrderCount.toFixed(1)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-xs">Avg Value</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ${segment.avgOrderValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
