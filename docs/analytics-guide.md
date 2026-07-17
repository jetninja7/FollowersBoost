# Analytics Dashboard Guide

## Overview

The FollowersBoost admin panel now includes comprehensive analytics capabilities with two main dashboards:

1. **Standard Dashboard** (`/admin/dashboard`) - Overview metrics with time-series charts
2. **Advanced Analytics** (`/admin/analytics`) - Deep insights into business performance

## Standard Dashboard Features

### Key Metrics Cards
- **Revenue Tracking**: Total, today, this week, this month
- **Order Statistics**: Breakdown by status with percentages
- **User Analytics**: Total users, new this week, active users (30 days)
- **Top Services**: Revenue-ranked list with order counts

### Time-Series Charts
- Revenue trends over time
- Order volume tracking
- User growth visualization
- Date range selection: 7 days, 30 days, 90 days, all time

## Advanced Analytics Features

Access via the sidebar link "Analytics" or the "Advanced Analytics" button on the main dashboard.

### 1. Customer Insights

#### Conversion Metrics Card
Displays key conversion funnel metrics:
- **Conversion Rate**: Percentage of users who placed at least one order
- **Repeat Customer Rate**: Percentage of customers who returned for 2+ orders
- **Average Time to First Order**: Days between signup and first purchase

**Use cases:**
- Evaluate marketing effectiveness
- Identify onboarding friction
- Track customer engagement quality

#### Payment Methods Chart
Visual breakdown of payment method usage:
- Distribution by transaction count and revenue
- Color-coded bars for each payment method (Stripe, PayPal)
- Detailed statistics per method

**Use cases:**
- Plan payment integrations
- Optimize checkout experience
- Identify preferred payment methods by region

### 2. Customer Segmentation

Users are automatically segmented into four tiers based on order history:
- **New** (0 orders): Users who registered but never purchased
- **Occasional** (1-2 orders): Early-stage customers
- **Regular** (3-5 orders): Engaged customers
- **VIP** (6+ orders): High-value customers

**Metrics per segment:**
- User count and percentage
- Total revenue contribution
- Average order value
- Average order count per user

**Use cases:**
- Identify which segments drive revenue
- Target re-engagement campaigns
- Customize pricing/promotions by segment
- Calculate customer lifetime value

### 3. Platform Performance

Detailed breakdown for each social media platform:
- Total orders and revenue
- Average order value
- Completion rate (% of completed orders)
- Visual bar chart ranked by revenue

**Use cases:**
- Identify top-performing platforms
- Allocate marketing budget
- Optimize service offerings
- Detect quality issues (low completion rates)

### 4. Fulfillment Performance (90 days)

Provider-level fulfillment metrics in a sortable table:
- Order volume per provider
- Success rate (completed / total orders)
- Average completion time
- Total revenue processed

**Metrics explanation:**
- **Success Rate**: 
  - 🟢 Green (90%+): Excellent
  - 🟡 Yellow (70-89%): Good
  - 🔴 Red (<70%): Needs attention
- **Avg Time**: Time from order creation to completion
  - Formats: minutes (m), hours (h), days (d)

**Use cases:**
- Monitor provider reliability
- Identify slow or failing providers
- Optimize provider selection algorithm
- Plan capacity with providers

### 5. Cohort Retention Analysis

Monthly cohort tracking showing user retention patterns:
- Each row = cohort of users who registered in a given month
- Columns show % of cohort who placed orders in subsequent months
- **M0**: Registration month activity
- **M1-M3**: Activity 1-3 months after registration

**Color coding:**
- 🟢 Green (50%+): Excellent retention
- 🟡 Yellow (25-49%): Good retention
- 🟠 Orange (10-24%): Fair retention
- 🔴 Red (<10%): Poor retention

**Use cases:**
- Measure product-market fit
- Evaluate onboarding effectiveness
- Identify optimal re-engagement timing
- Compare cohort behavior over time
- Forecast long-term revenue

**Note:** Requires at least 6 months of user activity data

## Data Refresh

All analytics data is:
- ✅ **Real-time**: Computed on page load
- ✅ **Accurate**: Directly queried from PostgreSQL
- ✅ **Complete**: Includes all historical data

No caching or background jobs required.

## Performance Considerations

### Query Optimization
- All queries use database indexes
- Time-series queries use date grouping
- Platform/provider joins are left joins (handle missing data)

### Expected Response Times
- Standard dashboard: < 500ms
- Advanced analytics: < 1000ms
- Cohort analysis: < 1500ms (most complex)

### Scaling Recommendations
For databases with 100K+ orders:
1. Consider adding materialized views for time-series data
2. Implement caching layer (Redis) for cohort analysis
3. Add date range filters to limit data scanned

## Technical Architecture

### Server Actions
- `src/actions/analytics.ts` - Time-series chart data
- `src/actions/analytics-advanced.ts` - Advanced insights (6 functions)

### Components
```
src/components/admin/
├── analytics-cards.tsx           # Standard dashboard cards
├── analytics-charts.tsx          # Time-series charts wrapper
├── platform-performance-chart.tsx
├── conversion-metrics-card.tsx
├── customer-segments-chart.tsx
├── payment-methods-chart.tsx
├── fulfillment-metrics-table.tsx
└── cohort-retention-table.tsx
```

### Pages
- `/admin/dashboard` - Standard dashboard
- `/admin/analytics` - Advanced analytics

### Database Models Used
- `User` - Customer data, registrations
- `Order` - Order history, status, revenue
- `Transaction` - Payment methods, deposits
- `Platform` + `ServiceCategory` + `Service` - Platform hierarchy
- `Provider` - Fulfillment provider data

## Common Use Cases

### 1. Monthly Business Review
Navigate to: `/admin/analytics`

Review in order:
1. Conversion metrics (top of page)
2. Customer segments (revenue distribution)
3. Platform performance (revenue drivers)
4. Fulfillment metrics (operational health)

### 2. Provider Health Check
Navigate to: `/admin/analytics` → Fulfillment Performance section

Look for:
- Success rates below 80%
- Average completion times trending up
- Order volume declining

**Action**: Visit `/admin/providers` to adjust provider priorities

### 3. Customer Re-engagement Campaign
Navigate to: `/admin/analytics` → Customer Segmentation

Target groups:
- **New users (0 orders)**: Send welcome offer
- **Occasional (1-2 orders)**: Loyalty discount
- **Dormant regulars**: Win-back campaign

Use cohort analysis to time campaigns (e.g., target M1 when retention drops)

### 4. Marketing ROI Analysis
Compare these metrics:

**Standard Dashboard:**
- Revenue this week vs. last week
- New users this week

**Advanced Analytics:**
- Conversion rate trend
- Average time to first order
- Segment distribution changes

Calculate: `Revenue / (New Users × Avg Order Value)` to estimate CAC payback

### 5. Platform Expansion Decision
Navigate to: `/admin/analytics` → Platform Performance

Evaluate:
1. **Revenue per platform**: Prioritize high-revenue platforms
2. **Completion rate**: Avoid expanding platforms with low completion
3. **Order volume**: Ensure sufficient provider capacity

## Troubleshooting

### "No data for this period"
- Check that orders exist in the database
- Verify date range is appropriate
- Confirm orders have `completedAt` timestamps for revenue queries

### Cohort analysis empty
- Requires 6+ months of user data
- Users must have `createdAt` timestamps
- Orders must be linked to users

### Slow page loads
1. Check database indexes are present:
   ```sql
   \d "Order"  -- Should show indexes on status, createdAt, userId
   ```
2. Monitor query performance in database logs
3. Consider adding EXPLAIN ANALYZE to analytics queries

### Provider names showing as "Manual"
- Orders without `fulfillmentProviderId` are grouped as "Manual"
- This is expected for orders created before the fulfillment system
- New orders should automatically populate this field

## Future Enhancements (Roadmap)

Potential additions:
- [ ] Export analytics to CSV
- [ ] Custom date range picker
- [ ] Revenue forecasting
- [ ] Churn prediction model
- [ ] Real-time dashboard with WebSocket updates
- [ ] Scheduled email reports
- [ ] A/B test result tracking
- [ ] Geographic revenue breakdown (requires IP geolocation)

## API Endpoints

All analytics functions are server actions, not REST endpoints.

To call from external systems, create API routes in `src/app/api/admin/analytics/`:

Example:
```typescript
// src/app/api/admin/analytics/conversion/route.ts
import { getConversionMetrics } from '@/actions/analytics-advanced';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  await requireAdmin();
  const data = await getConversionMetrics();
  return Response.json(data);
}
```

## Security

- ✅ All analytics routes protected by `requireAdmin()`
- ✅ No sensitive data exposed in client-side components
- ✅ SQL injection prevented via Prisma parameterized queries
- ✅ No user PII in aggregate analytics

## Support

For questions or issues:
1. Check this guide first
2. Review database schema: `prisma/schema.prisma`
3. Inspect SQL queries in `src/actions/analytics-advanced.ts`
4. Report bugs: GitHub Issues
