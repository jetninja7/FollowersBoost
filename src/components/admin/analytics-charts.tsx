'use client';

import { useState } from 'react';
import { DateRange, TimeSeriesData, getChartData } from '@/actions/analytics';
import { DateRangeTabs } from './date-range-tabs';
import { RevenueChart } from './revenue-chart';
import { OrderVolumeChart } from './order-volume-chart';
import { UserGrowthChart } from './user-growth-chart';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface AnalyticsChartsProps {
  initialData: TimeSeriesData[];
  initialRange?: DateRange;
}

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="h-[300px] bg-gray-200 animate-pulse rounded" />
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="p-12 text-center">
      <p className="text-gray-500">{message}</p>
    </Card>
  );
}

export function AnalyticsCharts({
  initialData,
  initialRange = '30d',
}: AnalyticsChartsProps) {
  const [range, setRange] = useState<DateRange>(initialRange);
  const [data, setData] = useState<TimeSeriesData[]>(initialData);
  const [loading, setLoading] = useState(false);

  async function handleRangeChange(newRange: DateRange) {
    setLoading(true);
    try {
      const newData = await getChartData(newRange);
      setData(newData);
      setRange(newRange);
    } catch (error) {
      console.error('Failed to load chart data:', error);
      toast.error('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <DateRangeTabs range={range} onChange={handleRangeChange} />

      {loading ? (
        <ChartSkeleton />
      ) : data.length === 0 ? (
        <EmptyState message="No data for this period" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RevenueChart data={data} />
          <OrderVolumeChart data={data} />
          <UserGrowthChart data={data} />
        </div>
      )}
    </div>
  );
}
