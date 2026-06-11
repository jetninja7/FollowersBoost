import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic'; // Don't cache health checks

export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const dbLatency = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      checks: {
        database: {
          status: 'up',
          latency: `${dbLatency}ms`,
        },
      },
    });
  } catch (error) {
    const dbLatency = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: 'down',
            latency: `${dbLatency}ms`,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      },
      { status: 503 }
    );
  }
}
