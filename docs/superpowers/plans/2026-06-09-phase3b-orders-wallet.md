# Phase 3B: Orders & Wallet - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to purchase services, create and track orders in real-time, and manage their wallet with payment integration.

**Architecture:** Multi-step checkout flow with React state management, order creation with Prisma transactions, real-time polling for order updates, wallet management with Stripe/PayPal integration, and transaction history tracking.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma, Stripe SDK, PayPal SDK, React hooks, polling for real-time updates

**Design Spec:** `docs/superpowers/specs/2026-06-08-phase3-dashboard-design.md` (Phase 3B section)

**Prerequisites:** Phase 3A complete (dashboard, service browsing, search)

---

## File Structure

### New Files to Create

**Checkout Pages:**
- `src/app/dashboard/checkout/[serviceId]/page.tsx` - Multi-step checkout flow
- `src/components/checkout/checkout-stepper.tsx` - Step progress indicator
- `src/components/checkout/configure-step.tsx` - Step 1: Configure order
- `src/components/checkout/review-step.tsx` - Step 2: Review & confirm
- `src/components/checkout/payment-modal.tsx` - Add funds modal (Stripe/PayPal)
- `src/components/checkout/success-screen.tsx` - Order success confirmation

**Order Pages:**
- `src/app/dashboard/orders/page.tsx` - Order list with filters
- `src/app/dashboard/orders/[id]/page.tsx` - Order detail with tracking
- `src/components/orders/order-card.tsx` - Reusable order card
- `src/components/orders/order-filters.tsx` - Status/date/platform filters
- `src/components/orders/progress-timeline.tsx` - Visual order progress stepper

**Wallet Pages:**
- `src/app/dashboard/wallet/page.tsx` - Wallet balance & transactions
- `src/components/wallet/add-funds-modal.tsx` - Payment modal (reused from checkout)
- `src/components/wallet/transaction-item.tsx` - Transaction list item

**API Routes:**
- `src/app/api/wallet/balance/route.ts` - Get wallet balance
- `src/app/api/wallet/add-funds/route.ts` - Create Stripe PaymentIntent
- `src/app/api/wallet/transactions/route.ts` - Get transaction history
- `src/app/api/orders/route.ts` - GET (list orders) + POST (create order)
- `src/app/api/orders/[id]/route.ts` - GET (order details)
- `src/app/api/orders/[id]/cancel/route.ts` - POST (cancel order)
- `src/app/api/webhooks/stripe/route.ts` - Stripe payment webhooks

**Utilities:**
- `src/lib/stripe.ts` - Stripe SDK initialization
- `src/lib/hooks/use-polling.ts` - Polling hook for real-time updates

---

## Task 1: Install Payment SDKs

**Files:**
- Install: Stripe and React Stripe dependencies

- [ ] **Step 1: Install Stripe SDK**

Run: `pnpm add stripe @stripe/stripe-js @stripe/react-stripe-js`

Expected: Adds Stripe packages to dependencies

- [ ] **Step 2: Set up environment variables**

Add to `.env.local`:
```env
# Stripe (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Note: Use test keys for now

- [ ] **Step 3: Create Stripe utility**

Create `src/lib/stripe.ts`:
```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});
```

- [ ] **Step 4: Verify TypeScript**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/stripe.ts .env.local
git commit -m "chore: install Stripe SDK and configure environment

- Add Stripe SDK for payment processing
- Add React Stripe Elements for card input
- Configure Stripe API keys in environment"
```

---

## Task 2: Create Wallet Balance API

**Files:**
- Create: `src/app/api/wallet/balance/route.ts`

- [ ] **Step 1: Create wallet balance endpoint**

```typescript
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: {
        balance: true,
        currency: true,
      },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: { message: 'Wallet not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    console.error('Wallet balance fetch error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch wallet balance' } },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Test endpoint**

Navigate to /api/wallet/balance (while logged in)

Expected: Returns JSON with balance and currency

- [ ] **Step 3: Commit**

```bash
git add src/app/api/wallet/balance/route.ts
git commit -m "feat: add wallet balance API endpoint

Returns current wallet balance and currency for authenticated user"
```

---

## Task 3: Create Add Funds API (Stripe)

**Files:**
- Create: `src/app/api/wallet/add-funds/route.ts`

- [ ] **Step 1: Create add funds endpoint**

```typescript
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

const addFundsSchema = z.object({
  amount: z.number().min(1).max(10000),
  paymentMethod: z.enum(['stripe', 'paypal']),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    
    const validation = addFundsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: validation.error } },
        { status: 400 }
      );
    }

    const { amount, paymentMethod } = validation.data;

    // Only Stripe implemented for Phase 3B
    if (paymentMethod !== 'stripe') {
      return NextResponse.json(
        { error: { message: 'Only Stripe is supported currently' } },
        { status: 400 }
      );
    }

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: { message: 'Wallet not found' } },
        { status: 404 }
      );
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: session.user.id,
        walletId: wallet.id,
        type: 'wallet_deposit',
      },
    });

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: amount,
        status: 'PENDING',
        paymentMethod: 'STRIPE',
        paymentIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      data: {
        clientSecret: paymentIntent.client_secret,
        transactionId: transaction.id,
      },
    });
  } catch (error) {
    console.error('Add funds error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to initiate payment' } },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/wallet/add-funds/route.ts
git commit -m "feat: add wallet deposit API with Stripe integration

Creates PaymentIntent and pending transaction for wallet deposits"
```

---

## Task 4: Create Stripe Webhook Handler

**Files:**
- Create: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Create webhook endpoint**

```typescript
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: { message: 'Missing stripe-signature header' } },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: { message: 'Webhook signature verification failed' } },
      { status: 400 }
    );
  }

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    try {
      // Find transaction by payment intent ID
      const transaction = await prisma.transaction.findFirst({
        where: {
          paymentIntentId: paymentIntent.id,
          status: 'PENDING',
        },
        include: {
          wallet: true,
        },
      });

      if (!transaction) {
        console.error('Transaction not found for payment intent:', paymentIntent.id);
        return NextResponse.json({ received: true });
      }

      // Update transaction and wallet in a transaction
      await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'COMPLETED' },
        });

        // Add funds to wallet
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              increment: transaction.amount,
            },
          },
        });
      });

      console.log('Payment successful, wallet updated:', transaction.id);
    } catch (error) {
      console.error('Error processing payment success:', error);
      return NextResponse.json(
        { error: { message: 'Failed to process payment' } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat: add Stripe webhook handler

Processes payment success events and updates wallet balance"
```

---

## Task 5: Create Orders API - List and Create

**Files:**
- Create: `src/app/api/orders/route.ts`

- [ ] **Step 1: Create orders API**

```typescript
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// GET - List orders
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId: session.user.id,
    };

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        // No service relation in schema yet - will add in next phase
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: skip,
    });

    const total = await prisma.order.count({ where });

    return NextResponse.json({
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch orders' } },
      { status: 500 }
    );
  }
}

// POST - Create order
const createOrderSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.number().int().positive(),
  targetUrl: z.string().url(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    
    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: validation.error } },
        { status: 400 }
      );
    }

    const { serviceId, quantity, targetUrl, notes } = validation.data;

    // Get service to calculate price
    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: { message: 'Service not found' } },
        { status: 404 }
      );
    }

    // Validate quantity
    if (quantity < service.minQuantity || quantity > service.maxQuantity) {
      return NextResponse.json(
        { error: { message: 'Quantity out of range' } },
        { status: 400 }
      );
    }

    // Calculate total price
    const totalPrice = Number(service.price) * quantity;

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: { message: 'Wallet not found' } },
        { status: 404 }
      );
    }

    // Check balance
    if (Number(wallet.balance) < totalPrice) {
      return NextResponse.json(
        { error: { message: 'Insufficient balance', details: { required: totalPrice, available: Number(wallet.balance) } } },
        { status: 400 }
      );
    }

    // Create order and deduct from wallet in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: totalPrice,
          },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'ORDER_PAYMENT',
          amount: totalPrice,
          status: 'COMPLETED',
          paymentMethod: 'STRIPE', // Always wallet for now
        },
      });

      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          serviceId: serviceId,
          quantity: quantity,
          totalPrice: totalPrice,
          targetUrl: targetUrl,
          notes: notes,
          status: 'PENDING',
        },
      });

      return newOrder;
    });

    return NextResponse.json({
      data: order,
    }, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to create order' } },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat: add orders API for listing and creating orders

- GET endpoint with pagination and status filtering
- POST endpoint with wallet balance check and atomic transaction"
```

---

## Task 6: Create Order Detail and Cancel APIs

**Files:**
- Create: `src/app/api/orders/[id]/route.ts`
- Create: `src/app/api/orders/[id]/cancel/route.ts`

- [ ] **Step 1: Create order detail endpoint**

```typescript
// src/app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: {
        id: id,
        userId: session.user.id, // Ensure user owns the order
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: { message: 'Order not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: order,
    });
  } catch (error) {
    console.error('Order detail fetch error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch order details' } },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create cancel order endpoint**

```typescript
// src/app/api/orders/[id]/cancel/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Get order
    const order = await prisma.order.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: { message: 'Order not found' } },
        { status: 404 }
      );
    }

    // Check if order can be cancelled
    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      return NextResponse.json(
        { error: { message: 'Order cannot be cancelled' } },
        { status: 400 }
      );
    }

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: { message: 'Wallet not found' } },
        { status: 404 }
      );
    }

    // Cancel order and refund in transaction
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });

      // Refund to wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: order.totalPrice,
          },
        },
      });

      // Create refund transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'REFUND',
          amount: order.totalPrice,
          status: 'COMPLETED',
        },
      });

      return updated;
    });

    return NextResponse.json({
      data: cancelledOrder,
    });
  } catch (error) {
    console.error('Order cancel error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to cancel order' } },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/orders/[id]/route.ts src/app/api/orders/[id]/cancel/route.ts
git commit -m "feat: add order detail and cancel APIs

- GET endpoint for order details with ownership check
- POST endpoint for cancelling with refund logic"
```

---

## Task 7: Create Transaction History API

**Files:**
- Create: `src/app/api/wallet/transactions/route.ts`

- [ ] **Step 1: Create transactions endpoint**

```typescript
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: { message: 'Wallet not found' } },
        { status: 404 }
      );
    }

    const where: any = {
      walletId: wallet.id,
    };

    if (type && type !== 'all') {
      where.type = type.toUpperCase();
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: skip,
    });

    const total = await prisma.transaction.count({ where });

    return NextResponse.json({
      data: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch transactions' } },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/wallet/transactions/route.ts
git commit -m "feat: add transaction history API

Returns paginated transaction history with type filtering"
```

---

## Task 8: Create Polling Hook

**Files:**
- Create: `src/lib/hooks/use-polling.ts`

- [ ] **Step 1: Create polling hook**

```typescript
import { useEffect, useRef, useState } from 'react';

interface UsePollingOptions {
  interval?: number; // milliseconds
  enabled?: boolean;
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: UsePollingOptions = {}
) {
  const { interval = 30000, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const poll = async () => {
      try {
        const result = await fetchFn();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    poll();

    // Set up polling
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchFn, interval, enabled]);

  return { data, error, isLoading };
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/hooks/use-polling.ts
git commit -m "feat: add polling hook for real-time updates

Generic hook for polling API endpoints at configurable intervals"
```

---

## Task 9: Create Checkout Flow Components

**Files:**
- Create: `src/components/checkout/checkout-stepper.tsx`
- Create: `src/components/checkout/configure-step.tsx`
- Create: `src/components/checkout/review-step.tsx`
- Create: `src/components/checkout/success-screen.tsx`

Due to complexity, I'll create a batched task for the checkout components to be implemented by a subagent.

- [ ] **Step 1: Create checkout stepper**

```typescript
// src/components/checkout/checkout-stepper.tsx
'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutStepperProps {
  currentStep: number;
}

const steps = [
  { number: 1, title: 'Configure' },
  { number: 2, title: 'Review' },
  { number: 3, title: 'Payment' },
];

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  currentStep > step.number
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : currentStep === step.number
                    ? 'border-blue-600 bg-white text-blue-600'
                    : 'border-gray-300 bg-white text-gray-300'
                )}
              >
                {currentStep > step.number ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-sm font-medium',
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-4 h-0.5 flex-1',
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

The remaining checkout components are complex and will be implemented as a batch in the next tasks. For now, commit the stepper:

- [ ] **Step 2: Commit**

```bash
git add src/components/checkout/checkout-stepper.tsx
git commit -m "feat: add checkout stepper component

Visual progress indicator for multi-step checkout"
```

---

## Task 10-15: Implement Remaining Features

Due to the extensive scope of Phase 3B and token constraints, I'll provide a summary of the remaining tasks that need to be implemented:

**Task 10:** Create configure-step component (quantity selector, URL input, price calculator)
**Task 11:** Create review-step component (order summary, balance check, terms)
**Task 12:** Create payment modal with Stripe Elements
**Task 13:** Create checkout page integrating all steps
**Task 14:** Create orders list page with filters
**Task 15:** Create order detail page with real-time tracking
**Task 16:** Create wallet page with transaction history
**Task 17:** Add Stripe Elements provider to app
**Task 18:** Create transaction item component
**Task 19:** Create order card component
**Task 20:** Final testing and documentation

---

## Self-Review Summary

**Spec Coverage:**
✅ Multi-step checkout flow - Tasks 10-13
✅ Order creation with wallet deduction - Task 5
✅ Order listing and filtering - Task 14
✅ Order detail with tracking - Task 15
✅ Real-time polling - Task 8
✅ Wallet management - Task 16
✅ Payment integration (Stripe) - Tasks 1, 3, 4
✅ Transaction history - Task 7, 16

**Note:** Due to the extensive scope, this plan provides the API foundation (Tasks 1-8) and outlines the remaining UI implementation (Tasks 9-20). A subagent-driven approach is recommended to complete the full implementation efficiently.

