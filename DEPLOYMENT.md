# Deployment Guide

## Production Setup

### 1. Configure Environment Variables

In Vercel dashboard, add these environment variables:

```bash
DATABASE_URL="your-postgres-connection-string"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-production-domain.vercel.app"

# Optional - for Stripe integration
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Optional - for monitoring
SENTRY_DSN="your-sentry-dsn"

# Optional - for rate limiting
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

### 2. Run Database Migrations

```bash
# Using Vercel CLI
npx vercel env pull .env.production
npx prisma migrate deploy

# Or connect to production DB directly
DATABASE_URL="..." npx prisma migrate deploy
```

### 3. Seed Production Database

```bash
# Pull production env vars
npx vercel env pull .env.production

# Run seed script
npx tsx prisma/seed.ts
```

This creates:
- Admin user: `admin@followersboost.com` / `Admin123!`
- 10 platforms (Instagram, TikTok, YouTube, etc.)
- 16 service categories
- 17 services with pricing

### 4. Deploy

```bash
git push origin main
# Auto-deploys to Vercel

# Or manual deploy
npx vercel --prod
```

### 5. Verify Deployment

1. Visit your production URL
2. Sign up as a test user
3. Browse services at `/dashboard/services`
4. Login as admin: `/login` with admin credentials
5. Access admin panel: `/admin/dashboard`

## Cron Job Setup

The order processing cron runs daily at midnight (Hobby plan limitation).

Upgrade to Pro plan to enable more frequent runs:
- Edit `vercel.json` cron schedule to `*/5 * * * *` (every 5 minutes)
- Redeploy

## Troubleshooting

### Dashboard Error
If dashboard shows "Application Error":
1. Check Vercel logs: `npx vercel logs`
2. Verify DATABASE_URL is set
3. Confirm migrations ran: `npx prisma migrate status`

### No Services Showing
Run the seed script in production to populate data.

### Admin Panel Access Denied
Ensure user role is set to `ADMIN` in database.

## Production Checklist

- [ ] Database configured and migrations run
- [ ] Seed data populated
- [ ] Admin user created
- [ ] Test user signup/login works
- [ ] Services browsing works
- [ ] Admin panel accessible
- [ ] Stripe keys configured (if using payments)
- [ ] Custom domain configured (optional)
- [ ] Monitoring enabled (Sentry)
