import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  processPendingOrders,
  detectStuckOrders,
} from '@/lib/fulfillment/order-processor';

/**
 * Cron endpoint for order processing
 * - Transitions PENDING orders (>1 min old) to PROCESSING
 * - Detects stuck IN_PROGRESS orders (no update in 24h)
 * - Logs execution to audit trail
 *
 * Runs every 5 minutes via Vercel Cron
 */
export async function GET(req: NextRequest) {
  // Verify cron secret (only allow Vercel Cron or authorized requests)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Process pending orders
    const pendingResult = await processPendingOrders();

    // Detect stuck orders
    const stuckResult = await detectStuckOrders();

    const duration = Date.now() - startTime;

    // Log execution to audit log
    await prisma.auditLog.create({
      data: {
        userId: 'SYSTEM',
        action: 'CRON_EXECUTION',
        entity: 'ORDER',
        entityId: 'CRON',
        changes: {
          duration,
          pendingOrders: pendingResult,
          stuckOrders: stuckResult,
        },
      },
    });

    return NextResponse.json({
      success: true,
      duration,
      pendingOrders: {
        processed: pendingResult.processed,
        successful: pendingResult.successful,
        failed: pendingResult.failed,
      },
      stuckOrders: {
        detected: stuckResult.detected,
        logged: stuckResult.logged,
        failed: stuckResult.failed,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error to audit log
    await prisma.auditLog.create({
      data: {
        userId: 'SYSTEM',
        action: 'CRON_EXECUTION_FAILED',
        entity: 'ORDER',
        entityId: 'CRON',
        changes: {
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
