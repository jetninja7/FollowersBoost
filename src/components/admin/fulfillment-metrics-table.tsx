'use client';

import { Card } from '@/components/ui/card';
import { FulfillmentMetrics } from '@/actions/analytics-advanced';
import { Activity, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface FulfillmentMetricsTableProps {
  data: FulfillmentMetrics[];
}

export function FulfillmentMetricsTable({ data }: FulfillmentMetricsTableProps) {
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold">Fulfillment Performance (90 days)</h3>
      </div>

      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                  Provider
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                  Orders
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                  Success Rate
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                  Avg Time
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((provider, index) => (
                <tr
                  key={provider.providerName}
                  className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${
                    index === 0 ? 'font-medium' : ''
                  }`}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{provider.providerName}</span>
                      {index === 0 && (
                        <span title="Top performer">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-gray-700">
                    {provider.orderCount.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-2">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getSuccessRateColor(
                        provider.successRate
                      )}`}
                    >
                      {provider.successRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-2">
                    <div className="flex items-center justify-end gap-1 text-gray-700">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(provider.avgCompletionTime)}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-gray-900 font-semibold">
                    ${provider.totalRevenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary stats */}
          <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Total Orders</p>
              <p className="text-lg font-semibold text-gray-900">
                {data.reduce((sum, p) => sum + p.orderCount, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Avg Success Rate</p>
              <p className="text-lg font-semibold text-gray-900">
                {(
                  data.reduce((sum, p) => sum + p.successRate, 0) / data.length
                ).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Total Revenue</p>
              <p className="text-lg font-semibold text-gray-900">
                ${data.reduce((sum, p) => sum + p.totalRevenue, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">No fulfillment data available</p>
      )}
    </Card>
  );
}
