'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';
import { OrderStatus, TransactionType, PaymentMethod } from '@prisma/client';

export type PlatformPerformance = {
  platformName: string;
  platformSlug: string;
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  completionRate: number;
};

export type PaymentMethodStats = {
  method: string;
  count: number;
  revenue: number;
  percentage: number;
};

export type CustomerSegment = {
  segment: string;
  userCount: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgOrderCount: number;
};

export type FulfillmentMetrics = {
  providerName: string;
  orderCount: number;
  successRate: number;
  avgCompletionTime: number; // in hours
  totalRevenue: number;
};

export type ConversionMetrics = {
  totalUsers: number;
  usersWithOrders: number;
  conversionRate: number;
  avgTimeToFirstOrder: number; // in days
  repeatCustomerRate: number;
};

export type CohortData = {
  cohortMonth: string;
  userCount: number;
  month0: number; // users active in registration month
  month1: number; // users active 1 month after
  month2: number;
  month3: number;
};

/**
 * Get platform performance breakdown
 */
export async function getPlatformPerformance(): Promise<PlatformPerformance[]> {
  await requireAdmin();

  try {
    // Get all orders grouped by platform
    const platformData = await prisma.$queryRaw<
      Array<{
        platformId: string;
        platformName: string;
        platformSlug: string;
        totalOrders: bigint;
        completedOrders: bigint;
        totalRevenue: any;
      }>
    >`
      SELECT
        p.id as "platformId",
        p.name as "platformName",
        p.slug as "platformSlug",
        COUNT(o.id) as "totalOrders",
        COUNT(CASE WHEN o.status = ${OrderStatus.COMPLETED} THEN 1 END) as "completedOrders",
        COALESCE(SUM(CASE WHEN o.status = ${OrderStatus.COMPLETED} THEN o."totalPrice" ELSE 0 END), 0) as "totalRevenue"
      FROM "Platform" p
      LEFT JOIN "ServiceCategory" sc ON sc."platformId" = p.id
      LEFT JOIN "Service" s ON s."categoryId" = sc.id
      LEFT JOIN "Order" o ON o."serviceId" = s.id
      WHERE p."isActive" = true
      GROUP BY p.id, p.name, p.slug
      ORDER BY "totalRevenue" DESC
    `;

    return platformData.map(row => {
      const totalOrders = Number(row.totalOrders);
      const completedOrders = Number(row.completedOrders);
      const revenue = Number(row.totalRevenue) || 0;

      return {
        platformName: row.platformName,
        platformSlug: row.platformSlug,
        revenue,
        orderCount: totalOrders,
        avgOrderValue: totalOrders > 0 ? revenue / completedOrders : 0,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      };
    });
  } catch (error) {
    console.error('Error fetching platform performance:', error);
    throw new Error('Failed to fetch platform performance');
  }
}

/**
 * Get payment method distribution
 */
export async function getPaymentMethodStats(): Promise<PaymentMethodStats[]> {
  await requireAdmin();

  try {
    const paymentData = await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: {
        type: TransactionType.DEPOSIT,
        status: 'COMPLETED',
        paymentMethod: { not: null },
      },
      _count: true,
      _sum: { amount: true },
    });

    const totalRevenue = paymentData.reduce(
      (sum, row) => sum + (Number(row._sum.amount) || 0),
      0
    );

    return paymentData
      .filter(row => row.paymentMethod !== null)
      .map(row => ({
        method: row.paymentMethod as string,
        count: row._count,
        revenue: Number(row._sum.amount) || 0,
        percentage: totalRevenue > 0 ? ((Number(row._sum.amount) || 0) / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error('Error fetching payment method stats:', error);
    throw new Error('Failed to fetch payment method stats');
  }
}

/**
 * Get customer segmentation analysis
 */
export async function getCustomerSegments(): Promise<CustomerSegment[]> {
  await requireAdmin();

  try {
    // Get user order statistics
    const userData = await prisma.$queryRaw<
      Array<{
        userId: string;
        orderCount: bigint;
        totalSpent: any;
      }>
    >`
      SELECT
        u.id as "userId",
        COUNT(o.id) as "orderCount",
        COALESCE(SUM(CASE WHEN o.status = ${OrderStatus.COMPLETED} THEN o."totalPrice" ELSE 0 END), 0) as "totalSpent"
      FROM "User" u
      LEFT JOIN "Order" o ON o."userId" = u.id
      WHERE u.role = 'USER'
      GROUP BY u.id
    `;

    // Segment users
    const segments = {
      new: { users: [] as typeof userData, label: 'New (0 orders)' },
      occasional: { users: [] as typeof userData, label: 'Occasional (1-2 orders)' },
      regular: { users: [] as typeof userData, label: 'Regular (3-5 orders)' },
      vip: { users: [] as typeof userData, label: 'VIP (6+ orders)' },
    };

    userData.forEach(user => {
      const orderCount = Number(user.orderCount);
      if (orderCount === 0) segments.new.users.push(user);
      else if (orderCount <= 2) segments.occasional.users.push(user);
      else if (orderCount <= 5) segments.regular.users.push(user);
      else segments.vip.users.push(user);
    });

    return Object.entries(segments).map(([key, data]) => {
      const userCount = data.users.length;
      const totalRevenue = data.users.reduce((sum, u) => sum + (Number(u.totalSpent) || 0), 0);
      const totalOrders = data.users.reduce((sum, u) => sum + Number(u.orderCount), 0);

      return {
        segment: data.label,
        userCount,
        totalRevenue,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        avgOrderCount: userCount > 0 ? totalOrders / userCount : 0,
      };
    });
  } catch (error) {
    console.error('Error fetching customer segments:', error);
    throw new Error('Failed to fetch customer segments');
  }
}

/**
 * Get conversion metrics
 */
export async function getConversionMetrics(): Promise<ConversionMetrics> {
  await requireAdmin();

  try {
    const [totalUsers, usersWithOrders, timeToFirstOrder, repeatCustomers] = await Promise.all([
      // Total users
      prisma.user.count({ where: { role: 'USER' } }),

      // Users who have placed at least one order
      prisma.user.count({
        where: {
          role: 'USER',
          orders: { some: {} },
        },
      }),

      // Average time to first order
      prisma.$queryRaw<Array<{ avgDays: number }>>`
        SELECT AVG(EXTRACT(EPOCH FROM (o."createdAt" - u."createdAt")) / 86400) as "avgDays"
        FROM "User" u
        INNER JOIN LATERAL (
          SELECT "createdAt"
          FROM "Order"
          WHERE "userId" = u.id
          ORDER BY "createdAt" ASC
          LIMIT 1
        ) o ON true
        WHERE u.role = 'USER'
      `,

      // Users with 2+ orders
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT u.id) as count
        FROM "User" u
        WHERE u.role = 'USER'
          AND (
            SELECT COUNT(*)
            FROM "Order" o
            WHERE o."userId" = u.id
          ) >= 2
      `,
    ]);

    const repeatCustomersCount = Number(repeatCustomers[0]?.count || 0);

    return {
      totalUsers,
      usersWithOrders,
      conversionRate: totalUsers > 0 ? (usersWithOrders / totalUsers) * 100 : 0,
      avgTimeToFirstOrder: Number(timeToFirstOrder[0]?.avgDays) || 0,
      repeatCustomerRate: usersWithOrders > 0 ? (repeatCustomersCount / usersWithOrders) * 100 : 0,
    };
  } catch (error) {
    console.error('Error fetching conversion metrics:', error);
    throw new Error('Failed to fetch conversion metrics');
  }
}

/**
 * Get fulfillment provider performance
 */
export async function getFulfillmentMetrics(): Promise<FulfillmentMetrics[]> {
  await requireAdmin();

  try {
    const providerData = await prisma.$queryRaw<
      Array<{
        providerName: string;
        totalOrders: bigint;
        completedOrders: bigint;
        avgCompletionHours: number;
        totalRevenue: any;
      }>
    >`
      SELECT
        COALESCE(p.name, 'Manual') as "providerName",
        COUNT(o.id) as "totalOrders",
        COUNT(CASE WHEN o.status = ${OrderStatus.COMPLETED} THEN 1 END) as "completedOrders",
        AVG(
          CASE
            WHEN o.status = ${OrderStatus.COMPLETED} AND o."completedAt" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (o."completedAt" - o."createdAt")) / 3600
            ELSE NULL
          END
        ) as "avgCompletionHours",
        COALESCE(SUM(CASE WHEN o.status = ${OrderStatus.COMPLETED} THEN o."totalPrice" ELSE 0 END), 0) as "totalRevenue"
      FROM "Order" o
      LEFT JOIN "Provider" p ON p.id = o."fulfillmentProviderId"
      WHERE o."createdAt" >= NOW() - INTERVAL '90 days'
      GROUP BY p.name
      ORDER BY "totalOrders" DESC
    `;

    return providerData.map(row => {
      const totalOrders = Number(row.totalOrders);
      const completedOrders = Number(row.completedOrders);

      return {
        providerName: row.providerName,
        orderCount: totalOrders,
        successRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        avgCompletionTime: Number(row.avgCompletionHours) || 0,
        totalRevenue: Number(row.totalRevenue) || 0,
      };
    });
  } catch (error) {
    console.error('Error fetching fulfillment metrics:', error);
    throw new Error('Failed to fetch fulfillment metrics');
  }
}

/**
 * Get cohort retention analysis (last 6 months)
 */
export async function getCohortAnalysis(): Promise<CohortData[]> {
  await requireAdmin();

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get users grouped by registration month
    const cohorts = await prisma.$queryRaw<
      Array<{
        cohortMonth: Date;
        userCount: bigint;
      }>
    >`
      SELECT
        DATE_TRUNC('month', "createdAt") as "cohortMonth",
        COUNT(*) as "userCount"
      FROM "User"
      WHERE "createdAt" >= ${sixMonthsAgo}
        AND role = 'USER'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY "cohortMonth" ASC
    `;

    // For each cohort, calculate retention in subsequent months
    const cohortData = await Promise.all(
      cohorts.map(async cohort => {
        const cohortStart = new Date(cohort.cohortMonth);
        const cohortEnd = new Date(cohortStart);
        cohortEnd.setMonth(cohortEnd.getMonth() + 1);

        // Get active users per month (users who placed orders)
        const retention = await prisma.$queryRaw<
          Array<{
            monthOffset: number;
            activeUsers: bigint;
          }>
        >`
          WITH cohort_users AS (
            SELECT id
            FROM "User"
            WHERE "createdAt" >= ${cohortStart}
              AND "createdAt" < ${cohortEnd}
              AND role = 'USER'
          )
          SELECT
            FLOOR(EXTRACT(EPOCH FROM (DATE_TRUNC('month', o."createdAt") - ${cohortStart})) / 2592000) as "monthOffset",
            COUNT(DISTINCT o."userId") as "activeUsers"
          FROM "Order" o
          INNER JOIN cohort_users cu ON cu.id = o."userId"
          WHERE o."createdAt" >= ${cohortStart}
          GROUP BY "monthOffset"
          ORDER BY "monthOffset"
        `;

        const retentionMap = new Map(
          retention.map(r => [Number(r.monthOffset), Number(r.activeUsers)])
        );

        return {
          cohortMonth: cohortStart.toISOString().slice(0, 7), // YYYY-MM format
          userCount: Number(cohort.userCount),
          month0: retentionMap.get(0) || 0,
          month1: retentionMap.get(1) || 0,
          month2: retentionMap.get(2) || 0,
          month3: retentionMap.get(3) || 0,
        };
      })
    );

    return cohortData;
  } catch (error) {
    console.error('Error fetching cohort analysis:', error);
    throw new Error('Failed to fetch cohort analysis');
  }
}
