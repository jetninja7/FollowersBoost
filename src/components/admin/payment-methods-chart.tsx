'use client';

import { Card } from '@/components/ui/card';
import { PaymentMethodStats } from '@/actions/analytics-advanced';
import { CreditCard } from 'lucide-react';

interface PaymentMethodsChartProps {
  data: PaymentMethodStats[];
}

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const totalTransactions = data.reduce((sum, method) => sum + method.count, 0);

  // Colors for payment methods
  const getColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'STRIPE':
        return { bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-200' };
      case 'PAYPAL':
        return { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200' };
      default:
        return { bg: 'bg-gray-500', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">Payment Methods</h3>
      </div>

      {data.length > 0 ? (
        <div className="space-y-4">
          {/* Pie-like horizontal representation */}
          <div className="flex h-8 rounded-lg overflow-hidden">
            {data.map((method, index) => {
              const color = getColor(method.method);
              return (
                <div
                  key={method.method}
                  className={`${color.bg} transition-all hover:opacity-80`}
                  style={{ width: `${method.percentage}%` }}
                  title={`${method.method}: ${method.percentage.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Detailed breakdown */}
          <div className="space-y-3">
            {data.map(method => {
              const color = getColor(method.method);
              return (
                <div key={method.method} className={`border ${color.border} rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color.bg}`} />
                      <span className="font-semibold text-gray-900">
                        {method.method}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {method.percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Transactions</p>
                      <p className="font-semibold text-gray-900">{method.count}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Revenue</p>
                      <p className="font-semibold text-gray-900">
                        ${method.revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              Total Transactions: <span className="font-semibold text-gray-900">{totalTransactions}</span>
            </p>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">No payment data available</p>
      )}
    </Card>
  );
}
