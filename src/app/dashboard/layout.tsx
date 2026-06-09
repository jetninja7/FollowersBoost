import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardRootLayout({
  children,
}: DashboardLayoutProps) {
  // Protect all dashboard routes
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
