# Phase 8: Analytics & Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three line charts (revenue, orders, users) with date range filtering to admin dashboard, with loading states, empty states, tooltips, and CSV export.

**Architecture:** Server action fetches time-series data with daily buckets. Client components render Recharts line charts with date range tabs. Charts section added below existing Phase 7 cards (unchanged). Responsive grid layout.

**Tech Stack:** Recharts, Prisma (time-series queries), Server Actions, date-fns

---

## File Structure

**New Files:**
- `src/actions/analytics.ts` - Server action for time-series chart data
- `src/components/admin/analytics-charts.tsx` - Parent client component (charts + tabs)
- `src/components/admin/date-range-tabs.tsx` - Date range selector tabs
- `src/components/admin/revenue-chart.tsx` - Revenue line chart
- `src/components/admin/order-volume-chart.tsx` - Order volume line chart
- `src/components/admin/user-growth-chart.tsx` - User growth line chart

**Modified Files:**
- `src/app/admin/dashboard/page.tsx` - Add charts section below existing cards
- `package.json` - Add recharts dependency

**Unchanged Files:**
- `src/components/admin/analytics-cards.tsx` - Existing Phase 7 cards (no changes)

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install recharts**

Run:
```bash
npm install recharts
```

Expected: Package added to package.json dependencies

- [ ] **Step 2: Verify installation**

Run:
```bash
npm list recharts
```

Expected: Shows recharts version installed

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts for admin dashboard charts

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Create Server Action for Chart Data

**Files:**
- Create: `src/actions/analytics.ts`

- [ ] **Step 1: Create actions directory**

Run:
```bash
mkdir -p src/actions
```

- [ ] **Step 2: Create server action file with types and date calculation**

```typescript
'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';
import { OrderStatus } from '@prisma/client';

export type DateRange = '7d' | '30d' | '90d' | 'all';

export type TimeSeriesData = {
  date: string;
  revenue: number;
  orderCount: number;
  userCount: number;
};

function getStartDate(range: DateRange): Date {
  const now = new Date();
  
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all':
      return new Date(0);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}
```

- [ ] **Step 3: Add getChartData function with queries**

```typescript
export async function getChartData(range: DateRange = '30d'): Promise<TimeSeriesData[]> {
  await requireAdmin();
  
  const startDate = getStartDate(range);
  
  // Query 1: Revenue by date (completed orders only)
  const revenueData = await prisma.$queryRaw<Array<{ date: Date; revenue: any }>>`
    SELECT 
      DATE("completedAt") as date,
      SUM("totalPrice") as revenue
    FROM "Order"
    WHERE 
      status = ${OrderStatus.COMPLETED}
      AND "completedAt" >= ${startDate}
    GROUP BY DATE("completedAt")
    ORDER BY date ASC
  `;
  
  // Query 2: Order count by date (all orders)
  const orderData = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
    SELECT 
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM "Order"
    WHERE "createdAt" >= ${startDate}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;
  
  // Query 3: Daily user signups
  const userData = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
    SELECT 
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM "User"
    WHERE "createdAt" >= ${startDate}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;
  
  // Merge data by date
  const dateMap = new Map<string, TimeSeriesData>();
  
  // Add revenue data
  revenueData.forEach(row => {
    const dateStr = row.date.toISOString().split('T')[0];
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { date: dateStr, revenue: 0, orderCount: 0, userCount: 0 });
    }
    dateMap.get(dateStr)!.revenue = Number(row.revenue) || 0;
  });
  
  // Add order data
  orderData.forEach(row => {
    const dateStr = row.date.toISOString().split('T')[0];
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { date: dateStr, revenue: 0, orderCount: 0, userCount: 0 });
    }
    dateMap.get(dateStr)!.orderCount = Number(row.count);
  });
  
  // Add user data (cumulative)
  let cumulativeUsers = 0;
  userData.forEach(row => {
    const dateStr = row.date.toISOString().split('T')[0];
    cumulativeUsers += Number(row.count);
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { date: dateStr, revenue: 0, orderCount: 0, userCount: 0 });
    }
    dateMap.get(dateStr)!.userCount = cumulativeUsers;
  });
  
  // Convert to array and sort
  const result = Array.from(dateMap.values()).sort((a, b) => 
    a.date.localeCompare(b.date)
  );
  
  return result;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
npm run build
```

Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add src/actions/analytics.ts
git commit -m "feat: add server action for chart time-series data

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Create Date Range Tabs Component

**Files:**
- Create: `src/components/admin/date-range-tabs.tsx`

- [ ] **Step 1: Create date range tabs component**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npm run build
```

Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/date-range-tabs.tsx
git commit -m "feat: add date range tabs component

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Create Revenue Chart Component

**Files:**
- Create: `src/components/admin/revenue-chart.tsx`

- [ ] **Step 1: Create revenue chart component**

```typescript
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

interface RevenueChartProps {
  data: TimeSeriesData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  function exportToCSV() {
    const csv = [
      'Date,Revenue',
      ...data.map((d) => `${d.date},${d.revenue.toFixed(2)}`),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="p-6" aria-label="Revenue trend chart">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Revenue Trend</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          aria-label="Export revenue data to CSV"
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
            tickFormatter={(value) => `$${value.toFixed(0)}`}
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
                    ${Number(data.revenue).toFixed(2)}
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npm run build
```

Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/revenue-chart.tsx
git commit -m "feat: add revenue chart component

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Create Order Volume Chart Component

**Files:**
- Create: `src/components/admin/order-volume-chart.tsx`

- [ ] **Step 1: Create order volume chart component**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npm run build
```

Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/order-volume-chart.tsx
git commit -m "feat: add order volume chart component

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Create User Growth Chart Component

**Files:**
- Create: `src/components/admin/user-growth-chart.tsx`

- [ ] **Step 1: Create user growth chart component**

```typescript
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

interface UserGrowthChartProps {
  data: TimeSeriesData[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  function exportToCSV() {
    const csv = [
      'Date,User Count',
      ...data.map((d) => `${d.date},${d.userCount}`),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-growth-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="p-6" aria-label="User growth chart">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">User Growth</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          aria-label="Export user growth data to CSV"
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
                    {data.userCount.toLocaleString()} users
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="userCount"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npm run build
```

Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/user-growth-chart.tsx
git commit -m "feat: add user growth chart component

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Create Analytics Charts Parent Component

**Files:**
- Create: `src/components/admin/analytics-charts.tsx`

- [ ] **Step 1: Create parent component with loading and empty states**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npm run build
```

Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/analytics-charts.tsx
git commit -m "feat: add analytics charts parent component

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Integrate Charts into Dashboard Page

**Files:**
- Modify: `src/app/admin/dashboard/page.tsx`

- [ ] **Step 1: Read current dashboard page**

Run:
```bash
cat src/app/admin/dashboard/page.tsx
```

Expected: Shows existing Phase 7 structure with getAnalyticsData and AnalyticsCards

- [ ] **Step 2: Add import for new components and server action**

Find the imports section at the top of the file. Add these imports:

```typescript
import { getChartData } from '@/actions/analytics';
import { AnalyticsCharts } from '@/components/admin/analytics-charts';
```

- [ ] **Step 3: Update page function to fetch chart data**

Replace the current function body:

```typescript
export default async function AdminDashboardPage() {
  await requireAdmin();
  
  const [cardData, chartData] = await Promise.all([
    getAnalyticsData(),
    getChartData('30d'),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      {/* Existing cards - unchanged */}
      <AnalyticsCards {...cardData} />
      
      {/* NEW: Charts section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Trends</h2>
        <AnalyticsCharts initialData={chartData} initialRange="30d" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
npm run build
```

Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/dashboard/page.tsx
git commit -m "feat: integrate charts into admin dashboard

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Manual Testing & Verification

**Files:**
- Test: All components in browser

- [ ] **Step 1: Start development server**

Run:
```bash
npm run dev
```

Expected: Server starts on http://localhost:3000

- [ ] **Step 2: Navigate to admin dashboard**

Open browser: http://localhost:3000/admin/dashboard

Expected: Dashboard loads with existing cards at top

- [ ] **Step 3: Verify charts render**

Scroll down to "Trends" section

Expected: 
- Three charts displayed side-by-side (desktop)
- Revenue chart (green line)
- Order volume chart (blue line)
- User growth chart (purple line)
- All charts show data with tooltips

- [ ] **Step 4: Test date range switching**

Click each tab: "Last 7 days", "Last 30 days", "Last 90 days", "All time"

Expected:
- Loading skeleton appears briefly
- Charts update with new data
- Active tab highlighted in blue

- [ ] **Step 5: Test CSV export**

Click download button on each chart

Expected:
- CSV file downloads
- File contains date and metric columns
- Data matches chart

- [ ] **Step 6: Test responsive layout**

Resize browser window to tablet size (~800px)

Expected:
- Two charts per row
- Third chart wraps to next row

Resize to mobile size (~400px)

Expected:
- Charts stack vertically (one per row)
- Date tabs scroll horizontally

- [ ] **Step 7: Test empty state**

If no data exists for a period, verify empty state shows "No data for this period"

- [ ] **Step 8: Verify existing cards unchanged**

Scroll to top of dashboard

Expected: Revenue, Orders, Users, Top Services cards display correctly (no regressions)

- [ ] **Step 9: Final production build test**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors

- [ ] **Step 10: Commit verification**

```bash
git add .
git commit -m "test: verify Phase 8 charts integration

All charts render correctly with date range filtering, CSV export,
loading states, empty states, and responsive layout. Existing Phase 7
cards unchanged.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ Three line charts (revenue, orders, users)
- ✅ Date range selector (7d/30d/90d/all)
- ✅ Time-series queries with daily buckets
- ✅ Loading skeletons
- ✅ Empty states
- ✅ Tooltips with formatted values
- ✅ CSV export per chart
- ✅ Responsive layout (3 cols desktop, stacked mobile)
- ✅ Server actions for data fetching
- ✅ Existing cards unchanged

**Placeholder Check:**
- ✅ No TBD/TODO in code
- ✅ All code blocks complete
- ✅ All imports defined
- ✅ All types defined

**Type Consistency:**
- ✅ `DateRange` type used consistently
- ✅ `TimeSeriesData` type used consistently
- ✅ `getChartData` signature matches usage
- ✅ Component props match parent usage

---

## Success Criteria

1. ✅ Dashboard shows three line charts below existing cards
2. ✅ Charts render with Recharts (smooth lines, tooltips work)
3. ✅ Date range selector switches between 7d/30d/90d/all
4. ✅ Loading state shows skeleton during data fetch
5. ✅ Empty state shows when no data for selected period
6. ✅ CSV export downloads data for each chart
7. ✅ Responsive layout works on desktop/tablet/mobile
8. ✅ Charts have proper labels, tooltips, formatting
9. ✅ Revenue chart shows dollar amounts, others show integers
10. ✅ User growth chart shows cumulative totals
11. ✅ Error handling prevents crashes, shows toast on failure
12. ✅ Existing cards unchanged (no regressions)
