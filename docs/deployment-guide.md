# Deployment Guide

## Prerequisites

- Vercel account
- GitHub repository connected to Vercel
- Domain configured (optional)

## External Services Setup

### 1. Vercel Postgres Database

1. Go to Vercel dashboard > Storage
2. Create new Postgres database
3. Copy `DATABASE_URL` to environment variables

### 2. Upstash Redis

1. Go to console.upstash.com
2. Create new Redis database
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 3. Sentry

1. Go to sentry.io and create account
2. Create new Next.js project
3. Copy `SENTRY_DSN`

### 4. Stripe Webhooks

1. Go to Stripe dashboard > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Environment Variables

Set these in Vercel dashboard (Settings > Environment Variables):

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Stripe (use LIVE keys for production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Public
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# System
NODE_ENV=production
LOG_LEVEL=info
```

### Optional Variables

```bash
# OAuth (if using Google sign-in)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Database Setup

1. **Run migrations:**

```bash
npx prisma migrate deploy
```

2. **Verify connection:**

```bash
npx prisma db pull
```

## Pre-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] NEXTAUTH_SECRET generated (32+ characters)
- [ ] Stripe keys are PRODUCTION keys (sk_live_, pk_live_)
- [ ] Stripe webhook configured to production URL
- [ ] Sentry project created
- [ ] Upstash Redis database created
- [ ] Database migrations run successfully
- [ ] Health check responds locally

## Deployment Steps

### 1. Deploy to Preview

```bash
vercel
```

Test the preview deployment:
- Visit preview URL
- Test authentication
- Test order placement
- Test admin panel
- Check health endpoint: `<preview-url>/api/health`

### 2. Deploy to Production

```bash
vercel --prod
```

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://yourdomain.com/api/health
```

Expected: `{"status":"healthy",...}`

### 2. Critical Flow Tests

- [ ] Sign up flow works
- [ ] Login flow works
- [ ] Password reset works
- [ ] Order placement works
- [ ] Payment processing works
- [ ] Admin panel accessible
- [ ] Cron job runs (check Vercel logs after 5 minutes)

### 3. Monitoring

- [ ] Sentry receiving events (trigger test error)
- [ ] Logs visible in Vercel dashboard
- [ ] Rate limiting works (test excessive requests)

## Troubleshooting

### Database Connection Errors

Check:
1. DATABASE_URL is correct in Vercel env vars
2. Database is running (Vercel dashboard > Storage)
3. Migrations are up to date: `npx prisma migrate deploy`

### Sentry Not Receiving Events

Check:
1. SENTRY_DSN is correct
2. NODE_ENV is set to "production"
3. Trigger test error to verify

### Rate Limiting Not Working

Check:
1. UPSTASH_REDIS_REST_URL and TOKEN are correct
2. Redis database is active (console.upstash.com)
3. Check Vercel logs for rate limit errors

## Rolling Back

See `docs/rollback-playbook.md` for emergency rollback procedures.
