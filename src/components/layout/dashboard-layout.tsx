import { ReactNode } from 'react';
import { DashboardSidebar } from './dashboard-sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />

      {/* Main content area with left margin for sidebar */}
      <main className="lg:pl-60">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
