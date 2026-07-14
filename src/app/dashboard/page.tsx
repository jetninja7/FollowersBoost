import { requireAuth } from '@/lib/auth/session';
import { DashboardStats } from '@/components/dashboard/dashboard-stats-modern';
import { PlatformFilters } from '@/components/dashboard/platform-filters';
import { ServicesQuickView } from '@/components/dashboard/services-quick-view';
import { QuickActions } from '@/components/dashboard/quick-actions';

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <DashboardStats userId={session.user.id} userName={session.user.name || 'User'} />

      {/* Quick Action Buttons */}
      <QuickActions />

      {/* Platform Filters */}
      <PlatformFilters />

      {/* Services Quick View */}
      <ServicesQuickView />
    </div>
  );
}
