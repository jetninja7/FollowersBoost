import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  processPendingOrders,
  detectStuckOrders,
} from '@/lib/fulfillment/order-processor';
import {
  processOrdersForFulfillment,
  updateActiveOrdersFromProviders,
} from '@/lib/fulfillment/auto-fulfillment';
import { initializeProviderRegistry } from '@/lib/fulfillment/provider-registry';

/**
 * Cron endpoint for order processing
 * - Transitions PENDING orders (>1 min old) to PROCESSING
 * - Submits PROCESSING orders to fulfillment providers
 * - Updates IN_PROGRESS orders from providers
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
    // Initialize provider registry
    await initializeProviderRegistry();

    // Step 1: Transition PENDING → PROCESSING
    const pendingResult = await processPendingOrders();

    // Step 2: Submit PROCESSING orders to providers
    const fulfillmentResult = await processOrdersForFulfillment();

    // Step 3: Update IN_PROGRESS orders from providers
    const updateResult = await updateActiveOrdersFromProviders();

    // Step 4: Detect stuck orders
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
          fulfillment: fulfillmentResult,
          updates: updateResult,
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
      fulfillment: {
        processed: fulfillmentResult.processed,
        submitted: fulfillmentResult.submitted,
        failed: fulfillmentResult.failed,
      },
      updates: {
        checked: updateResult.checked,
        updated: updateResult.updated,
        failed: updateResult.failed,
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
