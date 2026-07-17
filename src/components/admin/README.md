# Admin Analytics Components

This directory contains analytics visualization components for the admin dashboard.

## Component Overview

### Standard Dashboard Components

#### `analytics-cards.tsx`
Displays key metric cards with revenue, order, user, and top service statistics.
- **Props**: `revenue`, `orders`, `users`, `topServices`
- **Used in**: `/admin/dashboard`

#### `analytics-charts.tsx`
Time-series charts wrapper with date range selection.
- **Props**: `initialData`, `initialRange`
- **Features**: Date range tabs (7d, 30d, 90d, all)
- **Used in**: `/admin/dashboard`

#### Chart Sub-components:
- `revenue-chart.tsx` - Revenue over time
- `order-volume-chart.tsx` - Order count trends
- `user-growth-chart.tsx` - User growth visualization
- `date-range-tabs.tsx` - Date range selector

### Advanced Analytics Components

#### `conversion-metrics-card.tsx`
Displays conversion funnel KPIs in a card layout.
- **Metrics**:
  - Conversion rate (% users who ordered)
  - Repeat customer rate (% with 2+ orders)
  - Average time to first order
- **Used in**: `/admin/analytics`

#### `customer-segments-chart.tsx`
Visual breakdown of customer segments (New, Occasional, Regular, VIP).
- **Features**:
  - Horizontal bar showing distribution
  - Detailed cards per segment
  - Revenue contribution per segment
- **Used in**: `/admin/analytics`

#### `platform-performance-chart.tsx`
Platform-level performance metrics with revenue bars.
- **Metrics per platform**:
  - Total revenue
  - Order count
  - Average order value
  - Completion rate
- **Used in**: `/admin/analytics`

#### `payment-methods-chart.tsx`
Payment method distribution and statistics.
- **Features**:
  - Visual distribution bar
  - Transaction counts
  - Revenue per method
- **Used in**: `/admin/analytics`

#### `fulfillment-metrics-table.tsx`
Provider-level fulfillment performance table.
- **Metrics per provider**:
  - Order count
  - Success rate (color-coded)
  - Average completion time
  - Total revenue
- **Used in**: `/admin/analytics`

#### `cohort-retention-table.tsx`
Cohort retention analysis heatmap.
- **Features**:
  - Monthly cohorts
  - Retention percentages (M0-M3)
  - Color-coded retention rates
- **Used in**: `/admin/analytics`

## Component Structure

```
src/components/admin/
├── analytics-cards.tsx                 # Standard dashboard cards
├── analytics-charts.tsx                # Time-series wrapper
├── date-range-tabs.tsx                 # Date range selector
├── revenue-chart.tsx                   # Revenue line chart
├── order-volume-chart.tsx              # Order volume chart
├── user-growth-chart.tsx               # User growth chart
│
├── conversion-metrics-card.tsx         # Conversion KPIs
├── customer-segments-chart.tsx         # Customer segmentation
├── platform-performance-chart.tsx      # Platform breakdown
├── payment-methods-chart.tsx           # Payment methods
├── fulfillment-metrics-table.tsx       # Provider performance
└── cohort-retention-table.tsx          # Retention heatmap
```

## Data Flow

1. **Server Actions** (`src/actions/analytics*.ts`) fetch data from database
2. **Page Components** (`src/app/admin/*/page.tsx`) call server actions
3. **Analytics Components** receive data as props and render visualizations
4. **Client Components** (marked with `'use client'`) handle interactivity

## Styling

All components use:
- Tailwind CSS for styling
- Lucide React for icons
- shadcn/ui Card component for containers
- Consistent color scheme:
  - Blue: Primary actions, revenue
  - Green: Positive metrics, success
  - Yellow: Warnings, medium priority
  - Red: Errors, critical issues
  - Purple: Users, customers
  - Orange: Services, fulfillment

## Usage Examples

### Standard Dashboard

```tsx
import { AnalyticsCards } from '@/components/admin/analytics-cards';
import { AnalyticsCharts } from '@/components/admin/analytics-charts';
import { getChartData } from '@/actions/analytics';

export default async function DashboardPage() {
  const cardData = await getAnalyticsData();
  const chartData = await getChartData('30d');

  return (
    <>
      <AnalyticsCards {...cardData} />
      <AnalyticsCharts initialData={chartData} initialRange="30d" />
    </>
  );
}
```

### Advanced Analytics

```tsx
import { ConversionMetricsCard } from '@/components/admin/conversion-metrics-card';
import { getConversionMetrics } from '@/actions/analytics-advanced';

export default async function AnalyticsPage() {
  const conversionData = await getConversionMetrics();

  return <ConversionMetricsCard data={conversionData} />;
}
```

## Adding New Analytics

To add a new analytics component:

1. **Create server action** in `src/actions/analytics-advanced.ts`:
```typescript
export async function getNewMetric(): Promise<NewMetricType> {
  await requireAdmin();
  // Query database
  return data;
}
```

2. **Create component** in `src/components/admin/`:
```tsx
interface NewMetricProps {
  data: NewMetricType;
}

export function NewMetricCard({ data }: NewMetricProps) {
  return <Card>...</Card>;
}
```

3. **Add to analytics page** in `src/app/admin/analytics/page.tsx`:
```tsx
const newMetricData = await getNewMetric();
// ...
<NewMetricCard data={newMetricData} />
```

## Performance Considerations

- All components are React Server Components by default
- Client components (marked with `'use client'`) used only for interactivity
- Data fetching happens server-side in parallel
- No client-side data fetching or state management needed

## Testing

Manual testing checklist for each component:
- [ ] Renders with sample data
- [ ] Handles empty data gracefully
- [ ] Responsive on mobile devices
- [ ] Icons display correctly
- [ ] Colors follow design system
- [ ] Loading states work properly
- [ ] Error states handled

## Future Enhancements

Potential improvements:
- [ ] Chart animations
- [ ] Drill-down interactions
- [ ] Export to CSV/PDF
- [ ] Real-time updates
- [ ] Customizable date ranges
- [ ] Comparative views (YoY, MoM)
