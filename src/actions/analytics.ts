'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';
import { OrderStatus } from '@prisma/client';

export type DateRange = '7d' | '30d' | '90d' | 'all';

export type TimeSeriesData = {
  date: string;
  revenue: number;
  orderCount: number;
  userCount: number;
};

function getStartDate(range: DateRange): Date {
  const now = new Date();

  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all':
      return new Date(0);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export async function getChartData(range: DateRange = '30d'): Promise<TimeSeriesData[]> {
  await requireAdmin();

  const startDate = getStartDate(range);

  // Query 1: Revenue by date (completed orders only)
  const revenueData = await prisma.$queryRaw<Array<{ date: Date; revenue: any }>>`
    SELECT
      DATE("completedAt") as date,
      SUM("totalPrice") as revenue
    FROM "Order"
    WHERE
      status = ${OrderStatus.COMPLETED}
      AND "completedAt" >= ${startDate}
    GROUP BY DATE("completedAt")
    ORDER BY date ASC
  `;

  // Query 2: Order count by date (all orders)
  const orderData = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
    SELECT
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM "Order"
    WHERE "createdAt" >= ${startDate}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  // Query 3: Daily user signups
  const userData = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
    SELECT
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM "User"
    WHERE "createdAt" >= ${startDate}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  // Merge data by date
  const dateMap = new Map<string, TimeSeriesData>();

  // Add revenue data
  revenueData.forEach(row => {
    const dateStr = row.date.toISOString().split('T')[0];
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { date: dateStr, revenue: 0, orderCount: 0, userCount: 0 });
    }
    dateMap.get(dateStr)!.revenue = Number(row.revenue) || 0;
  });

  // Add order data
  orderData.forEach(row => {
    const dateStr = row.date.toISOString().split('T')[0];
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { date: dateStr, revenue: 0, orderCount: 0, userCount: 0 });
    }
    dateMap.get(dateStr)!.orderCount = Number(row.count);
  });

  // Add user data (cumulative)
  let cumulativeUsers = 0;
  userData.forEach(row => {
    const dateStr = row.date.toISOString().split('T')[0];
    cumulativeUsers += Number(row.count);
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { date: dateStr, revenue: 0, orderCount: 0, userCount: 0 });
    }
    dateMap.get(dateStr)!.userCount = cumulativeUsers;
  });

  // Convert to array and sort
  const result = Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return result;
}
