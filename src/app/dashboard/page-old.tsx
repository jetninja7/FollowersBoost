import { requireAuth } from '@/lib/auth/session';
import { StatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { Wallet, Package, CheckCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await requireAuth();
  const user = session.user;

  // Fetch stats via API (or directly via Prisma for now)
  // For simplicity in Phase 3A, we'll use direct Prisma queries
  // In production, you'd call the API endpoint

  const { prisma } = await import('@/lib/db/prisma');

  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
    select: { balance: true },
  });

  const activeOrdersCount = await prisma.order.count({
    where: {
      userId: user.id,
      status: { in: ['IN_PROGRESS', 'PROCESSING'] },
    },
  });

  const completedOrdersCount = await prisma.order.count({
    where: {
      userId: user.id,
      status: 'COMPLETED',
    },
  });

  const totalSpentResult = await prisma.order.aggregate({
    where: {
      userId: user.id,
      status: 'COMPLETED',
    },
    _sum: {
      totalPrice: true,
    },
  });

  const totalSpent = totalSpentResult._sum.totalPrice || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your account
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Wallet Balance"
          value={`$${Number(wallet?.balance || 0).toFixed(2)}`}
          icon={Wallet}
          description="USD"
          action={
            <Button size="sm" className="w-full">
              Add Funds
            </Button>
          }
        />

        <StatCard
          title="Active Orders"
          value={activeOrdersCount}
          icon={Package}
          description="In progress"
        />

        <StatCard
          title="Completed Orders"
          value={completedOrdersCount}
          icon={CheckCircle}
          description="Lifetime"
        />

        <StatCard
          title="Total Spent"
          value={`$${Number(totalSpent).toFixed(2)}`}
          icon={DollarSign}
          description="Lifetime"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/services">
          <Button className="w-full" size="lg">
            Browse Services
          </Button>
        </Link>
        <Link href="/dashboard/orders">
          <Button variant="outline" className="w-full" size="lg">
            View All Orders
          </Button>
        </Link>
      </div>

      {/* Recent Activity - Placeholder for Phase 3A */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <p className="text-sm text-gray-500">No recent orders</p>
      </div>
    </div>
  );
}
