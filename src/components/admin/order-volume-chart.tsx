'use client';

import { TimeSeriesData } from '@/actions/analytics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface OrderVolumeChartProps {
  data: TimeSeriesData[];
}

export function OrderVolumeChart({ data }: OrderVolumeChartProps) {
  function exportToCSV() {
    const csv = [
      'Date,Order Count',
      ...data.map((d) => `${d.date},${d.orderCount}`),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-volume-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="p-6" aria-label="Order volume chart">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Order Volume</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          aria-label="Export order volume data to CSV"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), 'MMM d')}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            tickFormatter={(value) => value.toLocaleString()}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-white border rounded shadow-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">
                    {format(new Date(data.date), 'MMM d, yyyy')}
                  </p>
                  <p className="text-lg font-semibold">
                    {data.orderCount.toLocaleString()} orders
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="orderCount"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
