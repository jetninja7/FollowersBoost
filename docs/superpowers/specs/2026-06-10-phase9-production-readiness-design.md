# Phase 9: Production Readiness - Design Spec

**Date:** 2026-06-10  
**Status:** Approved  
**Depends On:** Phase 8 (Analytics & Polish)

---

## Goal

Prepare the application for production deployment with essential monitoring, security hardening, deployment infrastructure, and database procedures. Build in four independent layers that can each ship separately.

## Scope

**In Scope:**
- Error tracking with Sentry
- Structured logging with Pino
- Rate limiting with Upstash Redis
- Security headers configuration
- Environment variable validation
- Health check endpoint
- Deployment documentation and checklist
- Database backup procedures
- Migration safety documentation
- Rollback playbook

**Out of Scope:**
- Performance monitoring/APM (beyond Sentry basics)
- Distributed tracing
- Real user monitoring (RUM)
- 2FA for admin accounts
- IP allowlisting
- Audit logging system
- WAF/DDoS protection
- Compliance documentation (GDPR, etc.)
- Custom alerting rules
- On-call rotation setup

---

## Architecture

### Four Independent Layers

Phase 9 is structured as four layers that ship independently:

```
Layer 1: Observability
├── Sentry integration (error tracking)
├── Pino logger (structured logging)
└── Error boundaries and handlers

Layer 2: Security Hardening
├── Rate limiting (Upstash Redis)
├── Security headers (next.config.js)
└── Environment validation (Zod)

Layer 3: Deployment Infrastructure
├── Health check endpoint
├── Vercel configuration updates
└── Deployment checklist documentation

Layer 4: Database Procedures
├── Backup verification documentation
├── Migration safety procedures
└── Emergency rollback playbook
```

**Deployment Strategy:**
Each layer can be deployed to production independently. No dependencies between layers. Can deploy Layer 1 first to start collecting errors, then Layer 2 for security, etc.

### File Structure

```
src/
├── lib/
│   ├── logger.ts              # Pino logger singleton
│   ├── sentry.ts              # Sentry client config
│   ├── env.ts                 # Environment validation
│   └── rate-limit.ts          # Rate limiter instances
├── instrumentation.ts         # Sentry instrumentation hook
├── middleware.ts              # Rate limiting + headers (modify existing)
└── app/
    ├── global-error.tsx       # Sentry error boundary (modify)
    └── api/
        └── health/
            └── route.ts       # Health check endpoint

docs/
├── deployment-guide.md        # Step-by-step deployment
├── backup-procedures.md       # Database backup/restore
└── rollback-playbook.md       # Emergency procedures

Updated files:
├── .env.production.example    # Add new env vars
├── next.config.js             # Security headers
├── vercel.json                # Updated config
└── package.json               # New dependencies
```

---

## Layer 1: Observability

### Sentry Integration

**Installation:**
- `@sentry/nextjs` (official Next.js SDK)
- Auto-instruments API routes, server components, client components

**Configuration:**

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
  enabled: process.env.NODE_ENV === 'production',
  
  beforeSend(event) {
    // Scrub sensitive data before sending
    if (event.request?.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
    }
    if (event.request?.data) {
      // Redact password fields
      if (typeof event.request.data === 'object') {
        delete event.request.data.password;
        delete event.request.data.token;
      }
    }
    return event;
  },
  
  ignoreErrors: [
    // Ignore expected errors
    'NEXT_REDIRECT',
    'NEXT_NOT_FOUND',
  ],
});
```

**Instrumentation Hook:**

```typescript
// src/instrumentation.ts (Next.js 15+ instrumentation)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/sentry');
  }
}
```

**Integration Points:**

1. **Global Error Boundary:**
```typescript
// src/app/global-error.tsx
'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  
  return (
    <html>
      <body>
        <h1>Application Error</h1>
        <p>Something went wrong. Our team has been notified.</p>
      </body>
    </html>
  );
}
```

2. **API Route Error Handler:**
```typescript
// Pattern for all API routes
export async function POST(req: Request) {
  try {
    // ... route logic
  } catch (error) {
    logger.error({ err: error }, 'API error');
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

3. **Server Action Error Handler:**
```typescript
// Pattern for server actions
'use server';
export async function myAction(data: FormData) {
  try {
    // ... action logic
  } catch (error) {
    logger.error({ err: error }, 'Server action failed');
    Sentry.captureException(error);
    throw error;
  }
}
```

### Pino Logger

**Installation:**
- `pino` (core logger)
- `pino-pretty` (dev-only pretty printing)

**Configuration:**

```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  
  // Pretty print in development, JSON in production
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  
  formatters: {
    level: (label) => ({ level: label }),
  },
  
  // Redact sensitive fields
  redact: {
    paths: ['password', 'token', 'secret', 'authorization', 'cookie'],
    remove: true,
  },
  
  // Add service name
  base: {
    service: 'followersboost',
    env: process.env.NODE_ENV,
  },
});
```

**Usage Patterns:**

```typescript
// Structured logging with context
logger.info({ userId, orderId, amount }, 'Order created');
logger.error({ err, userId }, 'Payment failed');
logger.warn({ userId, reason: 'rate_limit' }, 'Request rate limited');
logger.debug({ query: 'SELECT ...', duration: 45 }, 'Database query');
```

**What Gets Logged:**

1. **API Requests:**
   - Method, path, status code, duration
   - User ID (if authenticated)
   - IP address
   
2. **Authentication Events:**
   - Login success/failure
   - Logout
   - Token refresh
   - Account lockout
   
3. **Business Events:**
   - Order created, updated, completed, cancelled
   - Payment success, failure, refund
   - Wallet adjustments
   - Service purchases
   
4. **Admin Actions:**
   - User status changes (suspend/activate)
   - Wallet manual adjustments
   - Service management (create/edit/delete)
   
5. **System Events:**
   - Cron job execution start/end
   - Database queries (in debug mode)
   - External API calls (Stripe, etc.)

**Log Rotation:**
- Logs written to stdout/stderr
- Vercel automatically captures and retains for 7 days
- No manual rotation needed on Vercel
- For self-hosted: use pino-roll or logrotate

**Log Levels by Environment:**
- Development: `debug`
- Staging: `info`
- Production: `info` (can change to `warn` to reduce volume)

---

## Layer 2: Security Hardening

### Rate Limiting

**Why Upstash Redis:**
- Serverless-friendly (no persistent connections)
- REST API (works on Vercel edge)
- Free tier: 10k requests/day
- Automatic persistence

**Installation:**
- `@upstash/ratelimit`
- `@upstash/redis`

**Configuration:**

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client from environment variables
const redis = Redis.fromEnv();

export const ratelimit = {
  // Auth endpoints: 5 attempts per 15 minutes per IP
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'ratelimit:auth',
    analytics: true,
  }),
  
  // General API: 100 requests per minute per IP
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'ratelimit:api',
    analytics: true,
  }),
  
  // Admin API: 200 requests per minute (higher limit for admins)
  admin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, '1 m'),
    prefix: 'ratelimit:admin',
    analytics: true,
  }),
  
  // Public API (unauthenticated): 20 requests per minute
  public: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: 'ratelimit:public',
    analytics: true,
  }),
};
```

**Middleware Integration:**

```typescript
// src/middleware.ts (modify existing or create)
import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/lib/rate-limit';

export async function middleware(req: NextRequest) {
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const pathname = req.nextUrl.pathname;
  
  // Rate limit auth endpoints aggressively
  if (pathname.startsWith('/api/auth/')) {
    const { success, remaining } = await ratelimit.auth.limit(ip);
    if (!success) {
      return new NextResponse('Too many requests', { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
        },
      });
    }
  }
  
  // Rate limit admin API
  if (pathname.startsWith('/api/admin/')) {
    const { success, remaining } = await ratelimit.admin.limit(ip);
    if (!success) {
      return new NextResponse('Too many requests', { status: 429 });
    }
  }
  
  // Rate limit general API routes
  if (pathname.startsWith('/api/')) {
    const { success } = await ratelimit.api.limit(ip);
    if (!success) {
      return new NextResponse('Too many requests', { status: 429 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
```

### Security Headers

**Configuration:**

```javascript
// next.config.js (modify existing)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS protection (legacy, but still good)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.stripe.com",
              "frame-src https://js.stripe.com",
            ].join('; '),
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Environment Validation

**Configuration:**

```typescript
// src/lib/env.ts
import { z } from 'zod';

// Server-side environment schema
const serverSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Auth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  
  // Rate Limiting
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  
  // System
  NODE_ENV: z.enum(['development', 'production', 'test']),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Client-side environment schema (NEXT_PUBLIC_ vars)
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
});

// Validate and export typed environment
export const env = {
  ...serverSchema.parse(process.env),
  ...clientSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  }),
};

// Type-safe access to environment variables
export type Env = typeof env;
```

**Usage:**

```typescript
import { env } from '@/lib/env';

// Type-safe, validated access
const dbUrl = env.DATABASE_URL;
const apiUrl = env.NEXT_PUBLIC_APP_URL;
```

**Startup Validation:**

Environment validation happens automatically when `env.ts` is first imported. If any variable is missing or invalid, the app crashes at startup with a clear error message listing all validation failures.

### CSRF Protection

**Built-in Protection:**
- NextAuth handles CSRF tokens for auth routes automatically
- Next.js has built-in CSRF protection for POST requests from same origin
- No additional library needed

**What's Covered:**
- All `/api/auth/*` routes (NextAuth)
- Server Actions (Next.js automatic)
- API routes require explicit checking if accessed cross-origin

**Manual Check (if needed):**
```typescript
// For API routes that need explicit CSRF check
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const headersList = headers();
  const origin = headersList.get('origin');
  const host = headersList.get('host');
  
  if (origin && !origin.includes(host!)) {
    return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 });
  }
  
  // ... rest of handler
}
```

### Input Validation

**Current State:**
- Already using Zod for form validation
- Continue this pattern for all new endpoints

**Pattern:**
```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  amount: z.number().positive(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const validated = schema.parse(body); // Throws if invalid
  // ... use validated data
}
```

---

## Layer 3: Deployment Infrastructure

### Health Check Endpoint

**Purpose:**
- Verify app is running and can connect to database
- Used by monitoring services
- Used by load balancers for health checks

**Implementation:**

```typescript
// src/app/api/health/route.ts
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
```

### Vercel Configuration

**Updated vercel.json:**

```json
{
  "crons": [
    {
      "path": "/api/cron/process-orders",
      "schedule": "*/5 * * * *"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"],
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build"
}
```

### Deployment Documentation

**docs/deployment-guide.md:**

Complete step-by-step guide covering:

1. **Prerequisites**
   - Vercel account
   - GitHub repository connected
   - Domain configured (optional)

2. **External Services Setup**
   - Vercel Postgres database provisioning
   - Upstash Redis setup
   - Sentry project creation
   - Stripe webhook configuration

3. **Environment Variables**
   - List of all required variables
   - How to set them in Vercel dashboard
   - How to generate secrets (NEXTAUTH_SECRET)

4. **Database Setup**
   - Run initial migration: `npx prisma migrate deploy`
   - Seed data if needed
   - Verify connection

5. **Deployment Steps**
   - Deploy to preview: `vercel`
   - Test preview deployment
   - Deploy to production: `vercel --prod`

6. **Post-Deployment Verification**
   - Health check: `/api/health`
   - Auth flow test
   - Payment flow test
   - Admin panel test
   - Cron job verification

7. **Monitoring Setup**
   - Verify Sentry receiving events
   - Check Vercel logs
   - Set up uptime monitoring (external service)

**Deployment Checklist:**

```markdown
## Pre-Deployment Checklist

### Environment Variables
- [ ] All env vars set in Vercel dashboard
- [ ] NEXTAUTH_SECRET generated (use: `openssl rand -base64 32`)
- [ ] Stripe keys are PRODUCTION keys (sk_live_, pk_live_)
- [ ] Stripe webhook secret from production webhook
- [ ] Sentry DSN from Sentry project
- [ ] Upstash Redis credentials
- [ ] Database URL from Vercel Postgres

### Database
- [ ] Production database provisioned
- [ ] Migrations run: `npx prisma migrate deploy`
- [ ] Connection tested
- [ ] Backups enabled

### External Services
- [ ] Stripe webhook configured: https://yourdomain.com/api/webhooks/stripe
- [ ] Sentry project created and DSN copied
- [ ] Upstash Redis database created
- [ ] Domain DNS configured (if custom domain)

### Code Review
- [ ] All features tested locally
- [ ] No console.logs in production code
- [ ] No test API keys in code
- [ ] .env files not committed

### Deployment
- [ ] Deploy to preview and test: `vercel`
- [ ] All tests pass on preview
- [ ] Deploy to production: `vercel --prod`

### Post-Deployment
- [ ] Health check responds: https://yourdomain.com/api/health
- [ ] Sign up flow works
- [ ] Login flow works
- [ ] Order placement works
- [ ] Payment works (small test order)
- [ ] Admin panel accessible
- [ ] Cron job appears in Vercel logs within 5 minutes
- [ ] Sentry receiving events (trigger test error)
- [ ] Logs visible in Vercel dashboard

### Monitoring
- [ ] Set up external uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure Sentry alerts
- [ ] Document on-call procedures
```

---

## Layer 4: Database Procedures

### Backup Strategy

**Recommended: Vercel Postgres**

Vercel Postgres includes:
- Automated daily backups (retained 7 days)
- Point-in-time recovery
- Managed by Vercel
- No manual setup required

**Backup Verification Procedure:**

```markdown
# docs/backup-procedures.md

## Backup Verification

### Monthly Task (1st of each month)

1. **Check Backup Status:**
   - Log into Vercel dashboard
   - Navigate to Storage > Your Database
   - Check "Backups" tab
   - Verify daily backups exist for past 7 days
   - Verify backup sizes are reasonable (not 0 bytes)

2. **Test Restore (Quarterly):**
   - Create staging environment
   - Restore latest backup to staging
   - Verify data integrity:
     - User count matches
     - Order count matches
     - Recent orders visible
   - Test critical flows on staging

### If Using Self-Hosted Database

**Backup Script:**
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DATABASE_URL="postgresql://..."

pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-bucket/backups/

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

**Cron Schedule:**
```cron
0 2 * * * /path/to/backup-db.sh
```

**Restore Procedure:**
```bash
# Restore from backup
gunzip backup_20260610_020000.sql.gz
psql $DATABASE_URL < backup_20260610_020000.sql
```
```

### Migration Safety

**docs/migration-safety.md:**

```markdown
# Migration Safety Procedures

## Before Every Production Migration

1. **Backup Database:**
   - Verify recent backup exists
   - Create manual backup if needed: Vercel dashboard > Create Backup

2. **Test Migration on Staging:**
   - Restore production backup to staging
   - Run migration on staging: `npx prisma migrate deploy`
   - Verify app works on staging
   - Review generated SQL for destructive operations

3. **Review Migration:**
   ```bash
   # See SQL that will be executed
   npx prisma migrate diff \
     --from-schema-datamodel prisma/schema.prisma \
     --to-schema-datasource $DATABASE_URL \
     --script
   ```

4. **Plan Rollback:**
   - Identify if migration is reversible
   - Document rollback steps
   - Have backup ready to restore

## During Migration

1. **Enable Maintenance Mode (if needed):**
   - For large schema changes, consider brief downtime
   - Communicate to users in advance

2. **Run Migration:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Monitor:**
   - Watch Vercel logs for errors
   - Check Sentry for exceptions
   - Monitor health check endpoint

4. **Verify:**
   - Test critical flows immediately
   - Check database structure: `npx prisma db pull`

## Migration Best Practices

### Safe Migrations:
- Add nullable columns
- Add new tables
- Add indexes (use CONCURRENTLY in Postgres)
- Rename columns (with aliasing in application code first)

### Dangerous Migrations:
- Drop tables (ensure no references)
- Drop columns (ensure not in use)
- Change column types (data loss risk)
- Add NOT NULL constraints (requires backfill)

### Making Dangerous Migrations Safer:

**Example: Add NOT NULL column**

Step 1: Add nullable column
```prisma
model User {
  newColumn String?
}
```
Deploy + backfill data.

Step 2: Make NOT NULL
```prisma
model User {
  newColumn String
}
```
Deploy.

**Example: Rename column**

Step 1: Add new column, alias in code
```prisma
model User {
  oldColumn String
  newColumn String?
}
```
Code reads oldColumn, writes both. Deploy.

Step 2: Backfill
```sql
UPDATE "User" SET "newColumn" = "oldColumn" WHERE "newColumn" IS NULL;
```

Step 3: Switch code to read newColumn
Deploy.

Step 4: Drop oldColumn
```prisma
model User {
  newColumn String
}
```
Deploy.
```

### Rollback Playbook

**docs/rollback-playbook.md:**

```markdown
# Emergency Rollback Playbook

## When to Rollback

Rollback immediately if:
- Health check fails after deployment
- Critical functionality broken (auth, payments, orders)
- Database errors in Sentry
- Significant user-facing errors

## Rollback Steps

### 1. Immediate Deployment Rollback

**Via Vercel Dashboard:**
1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." menu → "Redeploy"
4. Wait for redeployment to complete (~2 minutes)

**Via CLI:**
```bash
# List recent deployments
vercel ls

# Promote previous deployment to production
vercel promote [deployment-url]
```

### 2. Verify Rollback

- Check health endpoint: `curl https://yourdomain.com/api/health`
- Test auth flow (login/signup)
- Test order placement
- Check Sentry for errors
- Monitor for 5-10 minutes

### 3. Database Rollback (if needed)

**If migration caused the issue:**

Option A: Rollback migration
```bash
# If Prisma migration is reversible
npx prisma migrate resolve --rolled-back [migration-name]
```

Option B: Restore from backup
1. Vercel dashboard > Storage > Your Database
2. Go to Backups tab
3. Find backup from before migration
4. Click "Restore"
5. Confirm restore
6. Wait for restore to complete (~5-10 minutes)
7. Run verification queries to confirm data

### 4. Root Cause Analysis

After rollback and stability restored:

1. **Gather Information:**
   - Sentry errors during incident
   - Vercel deployment logs
   - Database logs
   - User reports

2. **Identify Root Cause:**
   - What changed in the deployment?
   - What failed specifically?
   - Why didn't testing catch it?

3. **Document:**
   - Create incident post-mortem
   - Note what worked/didn't work in rollback
   - Update runbooks if needed

4. **Fix and Retry:**
   - Fix issue locally
   - Add test to prevent regression
   - Test on staging
   - Deploy to production with caution

## Common Issues and Solutions

### Issue: Database Connection Errors

**Symptoms:** Health check fails, Sentry shows Prisma errors

**Solution:**
1. Check DATABASE_URL is correct in Vercel env vars
2. Verify database is running (Vercel dashboard)
3. Check for connection limit issues
4. Restart database if needed (Vercel dashboard)

### Issue: Environment Variable Missing

**Symptoms:** App crashes at startup, Zod validation error

**Solution:**
1. Check Vercel env vars for the deployment
2. Add missing variable
3. Redeploy: `vercel --prod`

### Issue: Migration Failed Mid-Execution

**Symptoms:** Some tables updated, some not

**Solution:**
1. Restore database from backup (pre-migration)
2. Fix migration script
3. Test on staging
4. Retry migration

### Issue: Cron Job Not Running

**Symptoms:** Orders not processing

**Solution:**
1. Check vercel.json has correct cron config
2. Verify endpoint works: `curl https://yourdomain.com/api/cron/process-orders`
3. Check Vercel dashboard > Cron Jobs for errors
4. Redeploy if needed

## Communication Template

When rollback occurs:

**Internal (team Slack):**
```
🚨 ROLLBACK INITIATED

Deployment: [deployment-url]
Reason: [brief description]
Status: [In Progress / Complete]
ETA: [time estimate]
```

**External (if user-facing):**
```
We experienced a brief technical issue and have rolled back to the previous version. All systems are now stable. We apologize for any inconvenience.
```

## Prevention

After each incident:
- Add monitoring for that failure mode
- Add tests to catch the issue
- Update deployment checklist
- Update staging environment to match prod more closely
```

---

## Updated Environment Configuration

**Updated .env.production.example:**

```bash
# System
NODE_ENV=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@host:5432/followersboost

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe (PRODUCTION KEYS)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring
SENTRY_DSN=https://...@o....ingest.sentry.io/...

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Public Variables
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Dependencies

**New Dependencies:**

```json
{
  "dependencies": {
    "@sentry/nextjs": "^9.x",
    "@upstash/ratelimit": "^2.x",
    "@upstash/redis": "^1.x",
    "pino": "^9.x"
  },
  "devDependencies": {
    "pino-pretty": "^13.x"
  }
}
```

**Installation:**
```bash
pnpm add @sentry/nextjs @upstash/ratelimit @upstash/redis pino
pnpm add -D pino-pretty
```

---

## Testing Strategy

### Layer 1 - Observability Testing

**Manual Tests:**
1. Trigger error in API route → verify appears in Sentry
2. Check logs contain expected fields (userId, orderId, etc.)
3. Verify sensitive data redacted (passwords, tokens)
4. Test log rotation (check logs accumulate over time)

### Layer 2 - Security Testing

**Manual Tests:**
1. Rate limiting: Make 6 auth requests in 15 minutes → should get 429 on 6th
2. Security headers: Check response headers in browser devtools
3. Environment validation: Remove required env var → app should fail at startup with clear error
4. CSRF: Attempt cross-origin POST → should fail

### Layer 3 - Deployment Testing

**Staging Tests:**
1. Health check returns 200 and correct JSON
2. Health check returns 503 if database down
3. Deployment checklist steps all work
4. Environment variables all set correctly

### Layer 4 - Database Testing

**Quarterly Tests:**
1. Restore backup to staging
2. Verify data integrity
3. Run migration on restored backup
4. Verify migration succeeds

---

## Implementation Order

### Layer 1: Observability (Days 1-2)
1. Install Sentry + Pino
2. Add instrumentation hooks
3. Update error boundaries
4. Add logging to API routes
5. Add logging to server actions
6. Test error reporting
7. Deploy to staging
8. Deploy to production

### Layer 2: Security (Day 3)
1. Install Upstash packages
2. Set up Redis database
3. Implement rate limiting
4. Add security headers
5. Create environment validation
6. Test rate limiting
7. Deploy to staging
8. Deploy to production

### Layer 3: Deployment (Day 4)
1. Create health check endpoint
2. Update vercel.json
3. Write deployment guide
4. Create deployment checklist
5. Test deployment process on staging
6. Review with team

### Layer 4: Database (Day 5)
1. Write backup procedures
2. Write migration safety docs
3. Write rollback playbook
4. Test backup restore on staging
5. Review procedures with team

**Each layer can deploy independently.** Don't wait for all layers to complete before deploying Layer 1.

---

## Success Criteria

1. ✅ Sentry receives errors from production
2. ✅ Structured logs visible in Vercel dashboard
3. ✅ Rate limiting blocks excessive requests (returns 429)
4. ✅ Security headers present in all responses
5. ✅ Environment validation fails at startup if env vars missing/invalid
6. ✅ Health check endpoint returns 200 when healthy, 503 when unhealthy
7. ✅ Deployment checklist successfully used to deploy to production
8. ✅ Backup verification completed once
9. ✅ Team familiar with rollback procedures
10. ✅ All sensitive data redacted from logs
11. ✅ No secrets in Sentry events
12. ✅ Application starts successfully in production

---

## Future Enhancements (Out of Scope)

- APM (Application Performance Monitoring) for slow queries
- Distributed tracing across services
- Real User Monitoring (RUM) for frontend performance
- Custom metrics and dashboards
- Advanced alerting rules (Slack, PagerDuty)
- 2FA for admin accounts
- IP allowlisting for admin panel
- Comprehensive audit logging system
- Automated security scanning (Snyk, Dependabot)
- Load testing and capacity planning
- Blue-green deployments
- Feature flags system
- Chaos engineering / resilience testing
