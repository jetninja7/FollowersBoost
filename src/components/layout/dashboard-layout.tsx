import { ReactNode } from 'react';
import { DashboardSidebar } from './dashboard-sidebar';
import { NotificationBell } from '@/components/notifications/notification-bell';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />

      {/* Header with notification bell */}
      <header className="lg:pl-60 sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-end">
          <NotificationBell />
        </div>
      </header>

      {/* Main content area with left margin for sidebar */}
      <main className="lg:pl-60">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
