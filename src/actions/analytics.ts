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
  const endDate = new Date();

  try {
    // Query 1: Revenue by date (completed orders only)
    const revenueData = await prisma.$queryRaw<Array<{ date: Date; revenue: any }>>`
      SELECT
        DATE("completedAt") as date,
        SUM("totalPrice") as revenue
      FROM "Order"
      WHERE
        status = ${OrderStatus.COMPLETED}
        AND "completedAt" IS NOT NULL
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

    // Query 3: Baseline user count (users created before startDate)
    const baselineUsers = await prisma.user.count({
      where: {
        createdAt: {
          lt: startDate,
        },
      },
    });

    // Query 4: Daily user signups within the range
    const userData = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Generate all dates in the range to fill gaps
    const allDates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      allDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Initialize dateMap with all dates
    const dateMap = new Map<string, TimeSeriesData>();
    allDates.forEach(dateStr => {
      dateMap.set(dateStr, { date: dateStr, revenue: 0, orderCount: 0, userCount: baselineUsers });
    });

    // Add revenue data
    revenueData.forEach(row => {
      const dateStr = row.date.toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        dateMap.get(dateStr)!.revenue = Number(row.revenue) || 0;
      }
    });

    // Add order data
    orderData.forEach(row => {
      const dateStr = row.date.toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        dateMap.get(dateStr)!.orderCount = Number(row.count);
      }
    });

    // Add user data (cumulative from baseline)
    let cumulativeUsers = baselineUsers;
    allDates.forEach(dateStr => {
      // Find if there's signup data for this date
      const signupData = userData.find(row => row.date.toISOString().split('T')[0] === dateStr);
      if (signupData) {
        cumulativeUsers += Number(signupData.count);
      }
      dateMap.get(dateStr)!.userCount = cumulativeUsers;
    });

    // Convert to array (already sorted by allDates order)
    const result = Array.from(dateMap.values());

    return result;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw new Error('Failed to fetch analytics data');
  }
}
