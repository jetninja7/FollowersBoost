# Phase 8: Analytics & Polish - Design Spec

**Date:** 2026-06-10  
**Status:** Approved  
**Depends On:** Phase 7 (Admin Panel Expansion)

---

## Goal

Enhance admin dashboard with visual trend analysis. Add three line charts (revenue, orders, users) with date range filtering. Polish chart presentation with loading states, empty states, tooltips, CSV export.

## Scope

**In Scope:**
- Three line charts: Revenue Trend, Order Volume, User Growth
- Date range selector: 7d, 30d, 90d, All time (preset tabs only)
- Time-series data queries with daily buckets
- Chart polish: loading skeletons, empty states, tooltips, CSV export
- Responsive layout (3 cols desktop, stacked mobile)
- Server actions for data fetching
- Existing cards remain at top (unchanged)

**Out of Scope:**
- Custom date picker (presets only)
- Compare periods feature
- Dashboard-wide polish (focus on charts only)
- Additional chart types (pie, bar)
- Real-time updates
- Admin panel-wide improvements (Phase 7 work untouched)

---

## Architecture & Structure

### Page Layout

```
/admin/dashboard
├── Existing Cards (unchanged from Phase 7)
│   ├── Revenue Card
│   ├── Order Stats Card
│   ├── User Stats Card
│   └── Top Services Card
│
└── NEW: Charts Section
    ├── Date Range Selector (7d/30d/90d/All tabs)
    ├── Chart Grid (3 columns, responsive)
    │   ├── Revenue Trend Chart (line, green)
    │   ├── Order Volume Chart (line, blue)
    │   └── User Growth Chart (line, purple)
    └── CSV Export Buttons (per chart)
```

### Tech Stack

- **Recharts** - line charts with tooltips
- **Prisma** - time-series queries (daily buckets)
- **Server Actions** - data fetching (not API routes)
- **Client Components** - charts need interactivity
- **Server Component** - dashboard page wraps client charts

### Component Split

- `analytics-cards.tsx` - **unchanged** (existing cards from Phase 7)
- `analytics-charts.tsx` - **NEW** client component (charts + date selector)
- `date-range-tabs.tsx` - **NEW** client component (tab buttons)
- `revenue-chart.tsx` - **NEW** client component (Recharts LineChart)
- `order-volume-chart.tsx` - **NEW** client component (Recharts LineChart)
- `user-growth-chart.tsx` - **NEW** client component (Recharts LineChart)
- `dashboard/page.tsx` - **modified** to fetch chart data + render both sections
- `actions/analytics.ts` - **NEW** server action for chart data

---

## Data Model & Queries

### Time-Series Data Structure

```typescript
type DateRange = '7d' | '30d' | '90d' | 'all';

type TimeSeriesData = {
  date: string;        // ISO date: "2026-06-01"
  revenue: number;     // sum of completed orders totalPrice
  orderCount: number;  // count of orders created
  userCount: number;   // cumulative count of users
}[];
```

### Query Strategy

**Server Action:** `getChartData(range: DateRange): Promise<TimeSeriesData[]>`

Located at: `src/actions/analytics.ts`

**Authentication:**
```typescript
'use server'
export async function getChartData(range: DateRange) {
  await requireAdmin(); // First check
  // Queries...
}
```

**Date Range Calculation:**
```typescript
const now = new Date();
const startDate = {
  '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
  '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
  'all': new Date(0), // Beginning of time
}[range];
```

**Revenue Query:**
```sql
SELECT 
  DATE(completedAt) as date, 
  SUM(totalPrice) as revenue
FROM Order
WHERE 
  status = 'COMPLETED' 
  AND completedAt >= $startDate
GROUP BY DATE(completedAt)
ORDER BY date ASC
```

**Order Volume Query:**
```sql
SELECT 
  DATE(createdAt) as date, 
  COUNT(*) as orderCount
FROM Order
WHERE createdAt >= $startDate
GROUP BY DATE(createdAt)
ORDER BY date ASC
```

**User Growth Query:**
```sql
SELECT 
  DATE(createdAt) as date, 
  COUNT(*) as dailyUsers
FROM User
WHERE createdAt >= $startDate
GROUP BY DATE(createdAt)
ORDER BY date ASC
```

Then cumulative sum client-side:
```typescript
let cumulative = 0;
const userCounts = dailyUserCounts.map(d => {
  cumulative += d.dailyUsers;
  return { date: d.date, userCount: cumulative };
});
```

**Data Merging:**

Merge three queries into single array by date:
- Create map of all dates from all three queries
- Fill missing dates with zero values (no data = 0, not gap)
- Sort ascending by date
- Return unified array: `{ date, revenue, orderCount, userCount }[]`

**Date Formatting:**
- Store as ISO strings: "2026-06-01"
- Display format: "Jun 1" for chart labels
- Tooltip format: "Jun 9, 2026"

---

## Chart Implementation

### Component Structure

**AnalyticsCharts (Parent):**

```typescript
// src/components/admin/analytics-charts.tsx
'use client'

interface AnalyticsChartsProps {
  initialData: TimeSeriesData[];
  initialRange?: DateRange;
}

export function AnalyticsCharts({ 
  initialData,
  initialRange = '30d' 
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RevenueChart data={data} />
          <OrderVolumeChart data={data} />
          <UserGrowthChart data={data} />
        </div>
      )}
    </div>
  );
}
```

**DateRangeTabs:**

```typescript
// src/components/admin/date-range-tabs.tsx
'use client'

interface DateRangeTabsProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeTabs({ range, onChange }: DateRangeTabsProps) {
  const tabs = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ];
  
  return (
    <div className="flex gap-2 border-b">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value as DateRange)}
          className={cn(
            'px-4 py-2 border-b-2 transition-colors',
            range === tab.value
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

### Recharts Configuration

**Shared Chart Pattern:**

All three charts use:
```typescript
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
```

**Base Structure:**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis 
      dataKey="date" 
      tickFormatter={(date) => format(new Date(date), 'MMM d')}
    />
    <YAxis tickFormatter={valueFormatter} />
    <Tooltip content={<CustomTooltip />} />
    <Line 
      type="monotone" 
      dataKey={metricKey}
      stroke={color}
      strokeWidth={2}
      dot={false}
      activeDot={{ r: 6 }}
    />
  </LineChart>
</ResponsiveContainer>
```

**Chart-Specific Config:**

1. **RevenueChart:**
   - dataKey: `"revenue"`
   - stroke: `"#10b981"` (green)
   - YAxis formatter: `(value) => "$" + value.toFixed(2)`
   - Tooltip formatter: `(value) => "$" + Number(value).toFixed(2)`

2. **OrderVolumeChart:**
   - dataKey: `"orderCount"`
   - stroke: `"#3b82f6"` (blue)
   - YAxis formatter: `(value) => value.toLocaleString()`
   - Tooltip formatter: `(value) => value.toLocaleString() + " orders"`

3. **UserGrowthChart:**
   - dataKey: `"userCount"`
   - stroke: `"#8b5cf6"` (purple)
   - YAxis formatter: `(value) => value.toLocaleString()`
   - Tooltip formatter: `(value) => value.toLocaleString() + " users"`

**Custom Tooltip:**

```typescript
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  const value = payload[0].value;
  
  return (
    <div className="bg-white border rounded shadow-lg p-3">
      <p className="text-sm text-gray-600 mb-1">
        {format(new Date(data.date), 'MMM d, yyyy')}
      </p>
      <p className="text-lg font-semibold">
        {payload[0].formatter(value)}
      </p>
    </div>
  );
}
```

### Polish Features

**Loading State:**

```typescript
function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <Card key={i} className="p-6">
          <div className="h-[300px] bg-gray-200 animate-pulse rounded" />
        </Card>
      ))}
    </div>
  );
}
```

**Empty State:**

```typescript
function EmptyState({ message }: { message: string }) {
  return (
    <Card className="p-12 text-center">
      <p className="text-gray-500">{message}</p>
    </Card>
  );
}
```

**CSV Export:**

Each chart has export button:
```typescript
function exportToCSV(data: TimeSeriesData[], metric: string) {
  const csv = [
    'Date,' + metric,
    ...data.map(d => `${d.date},${d[metric]}`)
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${metric}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

Button placement: Top-right corner of each chart card

Icon: Download icon from lucide-react

---

## Error Handling & Responsive Design

### Error Handling

**Server Action Errors:**
```typescript
async function handleRangeChange(newRange: DateRange) {
  setLoading(true);
  try {
    const newData = await getChartData(newRange);
    setData(newData);
    setRange(newRange);
  } catch (error) {
    toast.error('Failed to load chart data');
    // Keep showing previous data, don't clear charts
  } finally {
    setLoading(false);
  }
}
```

**Query Timeouts:**
- Prisma queries have 30s timeout
- If exceeded, return error to client
- User sees toast: "Failed to load chart data"

**Validation:**
- Range param validated server-side
- Invalid range defaults to '30d'
- Enum type ensures only valid ranges accepted

**Data Validation:**
- Check for null aggregation results (no data)
- Return empty array if no data exists
- Client shows empty state message

### Responsive Breakpoints

**Desktop (≥1024px):**
- 3 charts side-by-side
- Chart height: 300px
- Date tabs: horizontal row

**Tablet (768-1023px):**
- 2 charts per row
- Third chart wraps to next row
- Chart height: 300px

**Mobile (<768px):**
- 1 chart per row, stacked vertically
- Chart height: 250px
- Date tabs: scrollable horizontal (overflow-x-auto)

**Implementation:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card className="p-6">
    <ResponsiveContainer width="100%" height={300}>
      {/* Chart */}
    </ResponsiveContainer>
  </Card>
</div>
```

### Accessibility

**Chart Labels:**
- Revenue chart: `aria-label="Revenue trend chart"`
- Orders chart: `aria-label="Order volume chart"`
- Users chart: `aria-label="User growth chart"`

**Keyboard Navigation:**
- Date range tabs: arrow keys navigate, Enter/Space selects
- Focus visible on tab buttons
- Tab order: range tabs → export buttons → charts

**Screen Readers:**
- Chart summaries: "Revenue over [period]: $X,XXX.XX"
- Data table alternative provided via CSV export

**Color Contrast:**
- Line colors meet WCAG AA standards
- Tooltip background white with border (high contrast)

**Export Buttons:**
- `aria-label="Export revenue data to CSV"`
- `aria-label="Export order volume data to CSV"`
- `aria-label="Export user growth data to CSV"`

---

## Integration with Dashboard Page

**Current Structure (Phase 7):**

```tsx
// src/app/admin/dashboard/page.tsx
export default async function AdminDashboardPage() {
  await requireAdmin();
  const data = await getAnalyticsData(); // Existing function
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <AnalyticsCards {...data} />
    </div>
  );
}
```

**Modified Structure (Phase 8):**

```tsx
// src/app/admin/dashboard/page.tsx
import { getAnalyticsData } from './analytics'; // Existing
import { getChartData } from '@/actions/analytics'; // NEW

export default async function AdminDashboardPage() {
  await requireAdmin();
  
  const [cardData, chartData] = await Promise.all([
    getAnalyticsData(),      // Existing cards
    getChartData('30d'),     // NEW: Initial chart data
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

No changes to existing card queries or components.

---

## Dependencies

**New Package:**
- `recharts` - chart library (~150KB gzipped)

**Install:**
```bash
npm install recharts
```

**Existing Dependencies:**
- `date-fns` - already installed (date formatting)
- `lucide-react` - already installed (download icon)
- `sonner` - already installed (toast notifications)

---

## Testing Strategy

**Manual Testing:**
- Load dashboard → verify charts render with 30d data
- Switch date ranges → verify data updates, loading state shows
- Resize window → verify responsive breakpoints (desktop/tablet/mobile)
- Export CSV → verify download triggers, data format correct
- Empty state → change date range to period with no data, verify message
- Error state → simulate server error, verify toast + keep previous data

**Data Validation:**
- Verify revenue only includes COMPLETED orders
- Verify order counts match by status
- Verify user growth is cumulative (not daily new users)
- Verify dates fill gaps (no missing days in range)

**No automated tests required** (polish phase, visual verification sufficient)

---

## Performance Considerations

**Query Optimization:**
- Date-based indexes already exist on Order.createdAt, Order.completedAt, User.createdAt
- GROUP BY DATE queries are fast (<100ms for typical datasets)
- Queries run in parallel (Promise.all)

**Caching:**
- No caching needed (admin dashboard, fresh data expected)
- Server actions run on demand, not statically generated

**Bundle Size:**
- Recharts adds ~150KB gzipped
- Lazy load charts component if needed (future optimization)

**Data Transfer:**
- 7d: ~7 data points
- 30d: ~30 data points
- 90d: ~90 data points
- All: depends on account age (max few hundred points)
- Total payload: <10KB for typical ranges

---

## Success Criteria

1. Dashboard shows three line charts below existing cards
2. Charts render with Recharts (smooth lines, tooltips work)
3. Date range selector switches between 7d/30d/90d/all
4. Loading state shows skeleton during data fetch
5. Empty state shows when no data for selected period
6. CSV export downloads data for each chart
7. Responsive layout works on desktop/tablet/mobile
8. Charts have proper labels, tooltips, formatting
9. Revenue chart shows dollar amounts, others show integers
10. User growth chart shows cumulative totals (not daily)
11. Error handling prevents crashes, shows toast on failure
12. Existing cards unchanged (no regressions)

---

## Future Enhancements (Out of Scope)

- Custom date picker (start/end date selection)
- Compare periods ("vs previous period")
- Additional chart types (pie for platform breakdown, bar for categories)
- Export all charts as single CSV
- Print/PDF export
- Dashboard-wide polish (improve cards, better mobile layout)
- Real-time updates (websocket for live data)
- Chart interactions (click date → drill down to orders)
- Annotations (mark events on timeline)
- Forecasting (trend projections)
