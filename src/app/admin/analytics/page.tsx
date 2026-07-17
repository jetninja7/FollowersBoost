import { requireAdmin } from '@/lib/auth/require-admin';
import {
  getPlatformPerformance,
  getPaymentMethodStats,
  getCustomerSegments,
  getConversionMetrics,
  getFulfillmentMetrics,
  getCohortAnalysis,
} from '@/actions/analytics-advanced';
import { PlatformPerformanceChart } from '@/components/admin/platform-performance-chart';
import { PaymentMethodsChart } from '@/components/admin/payment-methods-chart';
import { CustomerSegmentsChart } from '@/components/admin/customer-segments-chart';
import { ConversionMetricsCard } from '@/components/admin/conversion-metrics-card';
import { FulfillmentMetricsTable } from '@/components/admin/fulfillment-metrics-table';
import { CohortRetentionTable } from '@/components/admin/cohort-retention-table';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';

export default async function AdvancedAnalyticsPage() {
  await requireAdmin();

  // Fetch all analytics data in parallel
  const [
    platformPerformance,
    paymentMethods,
    customerSegments,
    conversionMetrics,
    fulfillmentMetrics,
    cohortData,
  ] = await Promise.all([
    getPlatformPerformance(),
    getPaymentMethodStats(),
    getCustomerSegments(),
    getConversionMetrics(),
    getFulfillmentMetrics(),
    getCohortAnalysis(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/dashboard"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="text-sm text-gray-600">
              Deep insights into business performance and customer behavior
            </p>
          </div>
        </div>
      </div>

      {/* Conversion & Customer Insights Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Customer Insights
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionMetricsCard data={conversionMetrics} />
          <PaymentMethodsChart data={paymentMethods} />
        </div>
      </section>

      {/* Customer Segmentation */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Customer Segmentation
        </h2>
        <CustomerSegmentsChart data={customerSegments} />
      </section>

      {/* Platform & Fulfillment Performance */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Platform & Fulfillment Performance
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlatformPerformanceChart data={platformPerformance} />
          <div className="lg:col-span-2">
            <FulfillmentMetricsTable data={fulfillmentMetrics} />
          </div>
        </div>
      </section>

      {/* Cohort Analysis */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          User Retention Analysis
        </h2>
        <CohortRetentionTable data={cohortData} />
      </section>

      {/* Info footer */}
      <div className="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> All analytics data is updated in real-time.
          Cohort analysis requires at least 6 months of user activity data.
          Fulfillment metrics show the last 90 days of data.
        </p>
      </div>
    </div>
  );
}
