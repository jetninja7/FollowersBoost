'use client';

import { Card } from '@/components/ui/card';

interface OrderStatsProps {
  stats: {
    pending: number;
    processing: number;
    inProgress: number;
    needsAttention: number;
  };
  onFilterByStatus: (status: string) => void;
}

export function OrderStats({ stats, onFilterByStatus }: OrderStatsProps) {
  const statCards = [
    { label: 'Pending', count: stats.pending, color: 'gray', status: 'PENDING' },
    { label: 'Processing', count: stats.processing, color: 'blue', status: 'PROCESSING' },
    { label: 'In Progress', count: stats.inProgress, color: 'yellow', status: 'IN_PROGRESS' },
    { label: 'Needs Attention', count: stats.needsAttention, color: 'red', status: 'stuck' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <Card
          key={stat.label}
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onFilterByStatus(stat.status)}
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
          <div className={`text-3xl font-bold text-${stat.color}-600`}>{stat.count}</div>
        </Card>
      ))}
    </div>
  );
}
