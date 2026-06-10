import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';
import { AnalyticsCards } from '@/components/admin/analytics-cards';
import { OrderStatus } from '@prisma/client';
import { getChartData } from '@/actions/analytics';
import { AnalyticsCharts } from '@/components/admin/analytics-charts';

async function getAnalyticsData() {
  // Date calculations
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Revenue stats
  const [totalRevenue, todayRevenue, weekRevenue, monthRevenue] = await Promise.all([
    prisma.order.aggregate({
      where: { status: OrderStatus.COMPLETED },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: {
        status: OrderStatus.COMPLETED,
        completedAt: { gte: todayStart },
      },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: {
        status: OrderStatus.COMPLETED,
        completedAt: { gte: weekStart },
      },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: {
        status: OrderStatus.COMPLETED,
        completedAt: { gte: monthStart },
      },
      _sum: { totalPrice: true },
    }),
  ]);

  // Order stats by status
  const ordersByStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: true,
  });

  const totalOrders = await prisma.order.count();
  const orderStats = ordersByStatus.reduce((acc, { status, _count }) => {
    acc[status] = {
      count: _count,
      percentage: Math.round((_count / totalOrders) * 100),
    };
    return acc;
  }, {} as Record<string, { count: number; percentage: number }>);

  // User stats
  const [totalUsers, newUsersThisWeek, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: weekStart } },
    }),
    prisma.user.count({
      where: {
        orders: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
    }),
  ]);

  // Top services by revenue
  const topServicesData = await prisma.order.groupBy({
    by: ['serviceId'],
    where: { status: OrderStatus.COMPLETED },
    _sum: { totalPrice: true },
    _count: true,
    orderBy: { _sum: { totalPrice: 'desc' } },
    take: 5,
  });

  const serviceIds = topServicesData.map(s => s.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    include: { category: { include: { platform: true } } },
  });

  const topServices = topServicesData.map(data => {
    const service = services.find(s => s.id === data.serviceId);
    return {
      name: service?.name || 'Unknown',
      platform: service?.category.platform.name || 'Unknown',
      revenue: (Number(data._sum.totalPrice) || 0).toFixed(2),
      orderCount: data._count,
    };
  });

  return {
    revenue: {
      total: (Number(totalRevenue._sum.totalPrice) || 0).toFixed(2),
      today: (Number(todayRevenue._sum.totalPrice) || 0).toFixed(2),
      thisWeek: (Number(weekRevenue._sum.totalPrice) || 0).toFixed(2),
      thisMonth: (Number(monthRevenue._sum.totalPrice) || 0).toFixed(2),
    },
    orders: {
      total: totalOrders,
      byStatus: orderStats,
    },
    users: {
      total: totalUsers,
      newThisWeek: newUsersThisWeek,
      active: activeUsers,
    },
    topServices,
  };
}

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
