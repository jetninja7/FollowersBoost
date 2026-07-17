'use client';

import { Card } from '@/components/ui/card';
import { PlatformPerformance } from '@/actions/analytics-advanced';
import { TrendingUp, Package, DollarSign, CheckCircle } from 'lucide-react';

interface PlatformPerformanceChartProps {
  data: PlatformPerformance[];
}

export function PlatformPerformanceChart({ data }: PlatformPerformanceChartProps) {
  const maxRevenue = Math.max(...data.map(p => p.revenue), 1);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Platform Performance</h3>
      </div>

      <div className="space-y-4">
        {data.slice(0, 8).map((platform, index) => (
          <div key={platform.platformSlug} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{platform.platformName}</span>
              <span className="text-sm font-semibold text-gray-900">
                ${platform.revenue.toFixed(2)}
              </span>
            </div>

            {/* Revenue bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(platform.revenue / maxRevenue) * 100}%` }}
              />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>{platform.orderCount} orders</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>${platform.avgOrderValue.toFixed(2)} avg</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>{platform.completionRate.toFixed(1)}% complete</span>
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <p className="text-center text-gray-500 py-8">No platform data available</p>
        )}
      </div>
    </Card>
  );
}
