# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FollowersBoost** is a production-ready SaaS platform for social media growth services. Users can purchase followers, likes, views, and other engagement services across 10 social media platforms (Instagram, Facebook, Twitter/X, YouTube, TikTok, LinkedIn, Telegram, Snapchat, Pinterest, Twitch).

**Tech Stack:**
- Next.js 15 (App Router) + TypeScript 5.5+
- PostgreSQL 16 + Prisma ORM
- NextAuth.js v5 (JWT strategy)
- Stripe + PayPal payment integration
- Tailwind CSS + shadcn/ui components
- Upstash Redis for rate limiting
- Sentry for error monitoring

## Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production (includes Prisma generation & migration)
npm start                # Start production server
npm run lint             # Run ESLint

# Database (Prisma)
npx prisma migrate dev   # Create and apply migration
npx prisma migrate deploy # Apply migrations (production)
npx prisma db seed       # Seed database with test data
npx prisma studio        # Open database GUI at http://localhost:5555
npx prisma generate      # Regenerate Prisma Client after schema changes

# Database utilities
npx tsx prisma/seed.ts   # Re-run seed script manually
```

## Default Admin Credentials (Development)

- Email: `admin@followersboost.com`
- Password: `Admin123!`

**⚠️ Change in production via admin panel or direct database update.**

## Architecture & Patterns

### Authentication Flow

**Provider:** NextAuth.js v5 with JWT session strategy
**Adapter:** Prisma (for OAuth account linking)
**Providers:** Credentials (email/password), Google OAuth (disabled by default)

Key files:
- `src/lib/auth/config.ts` - NextAuth configuration
- `src/lib/auth/session.ts` - `requireAuth()`, `requireAdmin()` helpers
- `src/lib/auth/password.ts` - bcrypt hashing utilities
- `src/app/api/auth/[...nextauth]/route.ts` - Auth API handler

**Session structure:**
```typescript
session.user.id     // User UUID
session.user.email  // Email address
session.user.role   // 'USER' | 'MODERATOR' | 'ADMIN'
session.user.name   // Display name
```

**Adding Google OAuth:**
1. Uncomment GoogleProvider in `src/lib/auth/config.ts`
2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`

### Database Schema (Prisma)

**Core Models:**
- `User` - Authentication, role-based access (`USER`, `MODERATOR`, `ADMIN`)
- `Wallet` - Per-user balance in USD (Decimal 10,2)
- `Transaction` - All wallet movements (DEPOSIT, ORDER_PAYMENT, REFUND)
- `Platform` - Social media platforms (Instagram, TikTok, etc.)
- `ServiceCategory` - Groups services within a platform (Followers, Likes, etc.)
- `Service` - Purchasable items with pricing and quantity ranges
- `Order` - User purchases with status machine (PENDING → PROCESSING → IN_PROGRESS → COMPLETED)
- `OrderLog` - Audit trail for all order state changes
- `Notification` - In-app notifications for order updates
- `AuditLog` - System-wide audit trail for sensitive actions

**Key relationships:**
- Each User has one Wallet (1:1)
- Orders reference Service via `serviceId` (no join enforced - service can be deleted)
- Transactions are scoped to Wallet (cascading delete)
- Stripe customer ID stored on User model (`stripeCustomerId`)

**Migration pattern:**
```bash
# After editing prisma/schema.prisma:
npx prisma migrate dev --name describe_change_here
npx prisma generate
```

### Order Fulfillment System

**Status Machine:** `src/lib/fulfillment/status-machine.ts`

Valid transitions:
```
PENDING → PROCESSING → IN_PROGRESS → COMPLETED
        ↓             ↓              ↓
      CANCELLED     FAILED         REFUNDED
```

**Automatic refunds:** Transitioning to `CANCELLED`, `FAILED`, or `REFUNDED` automatically:
1. Creates a REFUND transaction
2. Increments wallet balance
3. Creates user notification
4. Logs the change in OrderLog

**Order processor:** `src/lib/fulfillment/order-processor.ts`
- `transitionOrderStatus()` - Change status with validation, refunds, notifications
- `updateOrderProgress()` - Update `currentCount` field, auto-transition PROCESSING → IN_PROGRESS
- `processPendingOrders()` - Cron job: move PENDING → PROCESSING after 1 minute
- `detectStuckOrders()` - Cron job: flag IN_PROGRESS orders with no progress for 24+ hours

**Cron schedule:** Daily at midnight (see `vercel.json`)
- Endpoint: `/api/cron/process-orders`
- Auth: Vercel Cron secret header validation

### Payment Integration

**Stripe:**
- Client: `src/lib/stripe.ts` - Lazy-loaded singleton with `isStripeEnabled()` check
- Customer management: `src/lib/stripe-customer.ts` - Create/retrieve Stripe Customer IDs
- UI helpers: `src/lib/stripe-ui.ts` - Payment method formatting for display
- Webhook: `/api/webhooks/stripe` - Handles `payment_intent.succeeded`, `payment_method.attached`
- Idempotency: `stripeEventId` on Transaction model prevents duplicate webhook processing

**PayPal:**
- Client: `src/lib/paypal.ts` - SDK initialization with sandbox/live mode toggle
- Endpoints: `/api/wallet/paypal/create-order`, `/api/wallet/paypal/capture-order`
- Server SDK: `@paypal/paypal-server-sdk` for order creation and capture

**Wallet flow:**
1. User initiates add funds (`POST /api/wallet/add-funds`)
2. System creates pending Transaction with `paymentIntentId`
3. Client completes payment via Stripe Elements or PayPal button
4. Webhook/capture endpoint marks transaction COMPLETED and increments wallet balance
5. User receives notification

### API Route Patterns

**Authentication:**
```typescript
import { requireAuth } from '@/lib/auth/session';

export async function GET(request: Request) {
  const session = await requireAuth(); // Throws 401 if not authenticated
  const userId = session.user.id;
  // ...
}
```

**Admin-only routes:**
```typescript
import { requireAdmin } from '@/lib/auth/require-admin';

export async function POST(request: Request) {
  const session = await requireAdmin(); // Throws 403 if not ADMIN role
  // ...
}
```

**Dynamic route params (Next.js 15):**
```typescript
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // MUST await params
  // ...
}
```

**Error handling:**
```typescript
try {
  // Business logic
  return Response.json({ success: true, data });
} catch (error) {
  console.error('[ERROR_CONTEXT]', error);
  return Response.json(
    { success: false, error: 'User-friendly message' },
    { status: 500 }
  );
}
```

**Input validation:**
```typescript
import { z } from 'zod';

const schema = z.object({
  amount: z.number().min(1).max(10000),
  paymentMethod: z.enum(['STRIPE', 'PAYPAL']),
});

const body = await request.json();
const validated = schema.parse(body); // Throws if invalid
```

### Component Organization

```
src/components/
├── ui/              # shadcn/ui base components (button, card, dialog, etc.)
├── layout/          # Header, footer, mobile menu
├── landing/         # Homepage sections (hero, services-grid, testimonials, faq)
├── dashboard/       # Sidebar, stat-card, service-card, empty-state
├── checkout/        # Stepper, payment-modal, review-step, saved-cards
├── orders/          # Order cards, order detail, status badges
├── wallet/          # Balance display, transaction history, add-funds button
├── notifications/   # Notification bell, notification list, notification item
├── admin/           # Admin-only components (user management, order management)
└── auth/            # Login form, signup form (though these are currently in app/(auth))
```

**Pattern:** Components are grouped by feature area, not by type. Use shadcn/ui for base UI elements.

### Environment Variables

**Required:**
```env
DATABASE_URL           # PostgreSQL connection string
NEXTAUTH_URL           # App URL (http://localhost:3000 in dev)
NEXTAUTH_SECRET        # Min 32 chars, generate with: openssl rand -base64 32
NEXT_PUBLIC_APP_URL    # Public-facing URL for client-side use
```

**Optional (feature flags):**
```env
# Stripe (payment processing)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# PayPal (alternative payment)
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID
NEXT_PUBLIC_PAYPAL_CLIENT_ID

# OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

# Monitoring
SENTRY_DSN
UPSTASH_REDIS_REST_URL      # Rate limiting
UPSTASH_REDIS_REST_TOKEN
```

**Validation:** All env vars validated at startup via `src/lib/env.ts` (Zod schemas).

**Missing optional vars:** Code gracefully degrades:
- No Stripe keys → Payment buttons show "Configure Stripe" message
- No Redis → Rate limiting middleware is skipped
- No Sentry → Error tracking disabled

### Rate Limiting

**Implementation:** `src/lib/rate-limit.ts` using Upstash Redis
**Middleware:** Applied automatically via `middleware.ts` (if configured)

**Current limits:**
- API routes: 10 requests per 10 seconds per IP
- Sensitive endpoints (auth, payments): 5 requests per minute

**Bypass in development:**
Set `UPSTASH_REDIS_REST_URL` to empty string or remove from `.env.local`.

### Logging

**Library:** Pino (structured JSON logging in production, pretty-printed in dev)
**File:** `src/lib/logger.ts`

**Usage:**
```typescript
import { logger } from '@/lib/logger';

logger.info({ userId, action: 'order_created' }, 'Order created successfully');
logger.error({ error, orderId }, 'Order processing failed');
```

**Log levels:** Controlled by `LOG_LEVEL` env var (debug, info, warn, error)

### Error Monitoring (Sentry)

**Instrumentation:** `src/instrumentation.ts` (loaded automatically by Next.js)
**Config:** `src/lib/sentry.ts`

**Manual error capture:**
```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // risky operation
} catch (error) {
  Sentry.captureException(error, {
    extra: { orderId, userId },
    tags: { feature: 'order-processing' },
  });
}
```

**User context:** Automatically set in auth callbacks (session.user.id → Sentry user ID)

## Testing & Verification

**No formal test suite yet.** Use these patterns:

**Manual API testing:**
```bash
# Login required for most endpoints - test in browser first
curl http://localhost:3000/api/dashboard/stats

# Check health endpoint (no auth)
curl http://localhost:3000/api/health
```

**UI testing:** Start dev server and use Playwright (see MCP integration):
```bash
npm run dev
# Then ask Claude to test features via Playwright MCP
```

**Database inspection:**
```bash
npx prisma studio  # Visual database browser
```

## Common Gotchas

1. **Next.js 15 params:** Always `await params` in dynamic routes - sync access throws error
2. **Prisma types:** After schema changes, run `npx prisma generate` or TypeScript will complain
3. **Stripe webhooks:** Requires HTTPS in production - use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. **Session user.id:** Not available by default - custom JWT callback adds it (see `src/lib/auth/config.ts`)
5. **Decimal types:** Prisma Decimal must be converted to number for JSON responses:
   ```typescript
   balance: wallet.balance.toNumber()
   ```
6. **Service deletions:** Orders don't cascade-delete when Service is deleted (intentional for audit trail). Admin panel hides deleted services.

## Deployment (Vercel)

**Build command:** `prisma generate && prisma migrate deploy && next build` (auto-configured in `package.json`)
**Environment:** Set all required env vars in Vercel dashboard
**Database:** Vercel Postgres recommended (auto-configures `DATABASE_URL`)
**Cron jobs:** Configured in `vercel.json` - requires Hobby plan or higher

**Pre-deployment checklist:**
1. Run `npm run build` locally to catch TypeScript errors
2. Test database migration on staging DB: `npx prisma migrate deploy`
3. Verify all env vars set in Vercel
4. Configure Stripe webhook in Stripe dashboard → point to production URL
5. Change admin password after first deployment

**Rollback procedure:** See `docs/rollback-playbook.md`

## Project Status

**Completed phases:**
- ✅ Phase 1: Foundation (auth, database schema, seed data)
- ✅ Phase 2: Landing page (hero, services grid, pricing, testimonials, FAQ)
- ✅ Phase 3A: Dashboard (service marketplace, platform pages, search)
- ✅ Phase 3B: Orders & Wallet (checkout flow, payment integration, order management)
- ✅ Phase 4: Admin panel (user management, order management, service CRUD)
- ✅ Phase 5: Payment integration (Stripe + PayPal, saved cards, webhook handling)

**Current state:** Production-ready MVP. All core features functional.

**Outstanding work:**
- Order fulfillment automation (currently manual via admin panel)
- Email notifications (in-app notifications only)
- Analytics dashboard enhancements
- Rate limiting enforcement (requires Upstash setup)

**Memory reference:** See `.claude/projects/-Users-balu-FollowersBoost/memory/followersboost-project-state.md` for phase-specific details.

## Code Style Preferences

- Use async/await, not Promise chains
- Prefer server components over client components (add `'use client'` only when needed)
- Use TypeScript strict mode - no `any` types
- Prisma queries: use `include` for relations, not raw SQL
- Error messages: user-facing (hide implementation details), log full error server-side
- File naming: kebab-case for all files except React components (PascalCase.tsx)
- Imports: absolute paths via `@/` alias, not relative `../../`

## Documentation

- **Deployment:** `docs/deployment-guide.md`
- **Rollback:** `docs/rollback-playbook.md`
- **Migrations:** `docs/migration-safety.md`
- **Backups:** `docs/backup-procedures.md`
- **Phase completion reports:** `docs/phase*.md`
