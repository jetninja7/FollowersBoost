'use client';

import { DateRange } from '@/actions/analytics';
import { cn } from '@/lib/utils';

interface DateRangeTabsProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeTabs({ range, onChange }: DateRangeTabsProps) {
  const tabs = [
    { value: '7d' as DateRange, label: 'Last 7 days' },
    { value: '30d' as DateRange, label: 'Last 30 days' },
    { value: '90d' as DateRange, label: 'Last 90 days' },
    { value: 'all' as DateRange, label: 'All time' },
  ];

  return (
    <div className="flex gap-2 border-b overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-2 border-b-2 transition-colors whitespace-nowrap',
            range === tab.value
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
          aria-label={`View ${tab.label}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
