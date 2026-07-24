# Production Deployment Checklist

**Date:** July 24, 2026  
**Project:** FollowersBoost  
**Status:** Ready for Production

## Pre-Deployment Steps

### 1. Environment Setup

- [ ] **Generate Production Encryption Key**
  ```bash
  openssl rand -hex 32
  ```
  Store securely in password manager (1Password, LastPass, etc.)

- [ ] **Set Vercel Environment Variables**
  Go to Vercel Dashboard → Project → Settings → Environment Variables
  
  **Required:**
  - `DATABASE_URL` - Vercel Postgres connection string
  - `NEXTAUTH_URL` - https://yourdomain.com
  - `NEXTAUTH_SECRET` - Generate: `openssl rand -base64 32`
  - `NEXT_PUBLIC_APP_URL` - https://yourdomain.com
  - `PROVIDER_ENCRYPTION_KEY` - Generated 64-char hex key

  **Payments:**
  - `STRIPE_SECRET_KEY` - Live key (sk_live_...)
  - `STRIPE_WEBHOOK_SECRET` - From Stripe dashboard
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Live key (pk_live_...)
  - `PAYPAL_CLIENT_ID` - Live credentials
  - `PAYPAL_CLIENT_SECRET` - Live credentials
  - `PAYPAL_MODE=live`
  - `NEXT_PUBLIC_PAYPAL_CLIENT_ID` - Live client ID

  **Email:**
  - `RESEND_API_KEY` - Production API key
  - `EMAIL_FROM` - noreply@yourdomain.com

  **Monitoring:**
  - `SENTRY_DSN` - Error tracking
  - `UPSTASH_REDIS_REST_URL` - Rate limiting
  - `UPSTASH_REDIS_REST_TOKEN` - Redis token

### 2. Database Setup

- [ ] **Provision Vercel Postgres Database**
  - Go to Vercel Dashboard → Storage → Create Database
  - Select PostgreSQL
  - Note the DATABASE_URL

- [ ] **Run Migrations**
  ```bash
  # Using Vercel CLI
  vercel env pull .env.production
  npx prisma migrate deploy
  ```

- [ ] **Seed Database (Optional)**
  ```bash
  # Only if you want sample data
  npx prisma db seed
  ```

- [ ] **Change Admin Password**
  - Login to admin panel: https://yourdomain.com/admin
  - Default: admin@followersboost.com / Admin123!
  - Change immediately after first login

### 3. Payment Provider Setup

#### Stripe

- [ ] Switch from test to live mode in Stripe Dashboard
- [ ] Create webhook endpoint: https://yourdomain.com/api/webhooks/stripe
- [ ] Configure webhook events:
  - `payment_intent.succeeded`
  - `payment_method.attached`
- [ ] Copy webhook secret to Vercel env vars
- [ ] Test a live $1 transaction

#### PayPal

- [ ] Switch from sandbox to live mode
- [ ] Create live app in PayPal Developer Dashboard
- [ ] Get live credentials (Client ID & Secret)
- [ ] Configure webhook: https://yourdomain.com/api/webhooks/paypal
- [ ] Test a live $1 transaction

### 4. Email Service Setup

- [ ] **Configure Resend**
  - Add domain to Resend dashboard
  - Verify DNS records (SPF, DKIM, DMARC)
  - Get production API key
  - Set `EMAIL_FROM` to verified domain email

- [ ] **Test Email Sending**
  ```bash
  # Send test email through admin panel
  # Or trigger test order notification
  ```

### 5. Security Hardening

- [ ] **Review CORS Settings**
  Check `src/middleware.ts` for proper origins

- [ ] **Enable Rate Limiting**
  Verify `UPSTASH_REDIS_REST_URL` is set

- [ ] **Review API Permissions**
  Audit all `/api/admin/*` routes for `requireAdmin()`

- [ ] **SSL Certificate**
  Verify HTTPS is enforced (Vercel auto-provisions)

- [ ] **Security Headers**
  Check `next.config.ts` for security headers:
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
  - Permissions-Policy

### 6. Monitoring Setup

- [ ] **Configure Sentry**
  - Create Sentry project
  - Add DSN to Vercel env vars
  - Set up error alerts (Slack/Email)
  - Configure release tracking

- [ ] **Set Up Uptime Monitoring**
  Recommended services:
  - BetterUptime (betteruptime.com)
  - Pingdom (pingdom.com)
  - UptimeRobot (uptimerobot.com)
  
  Monitor endpoints:
  - https://yourdomain.com/api/health
  - https://yourdomain.com/ (homepage)

- [ ] **Configure Log Drains** (Optional)
  - Vercel Dashboard → Settings → Log Drains
  - Options: Datadog, New Relic, LogDNA

### 7. Performance Optimization

- [ ] **Enable Vercel Analytics**
  ```bash
  npm install @vercel/analytics
  ```
  Add to root layout

- [ ] **Configure Caching**
  - Review Next.js cache headers
  - Enable Redis caching for dashboard stats (optional)

- [ ] **Image Optimization**
  - Verify all images use Next.js Image component
  - Check image loading performance

- [ ] **Database Indexes**
  Review Prisma schema indexes for query performance

### 8. Legal Compliance

- [ ] **Add Privacy Policy**
  - Create `/privacy` page
  - Include data collection, storage, sharing details
  - Link in footer

- [ ] **Add Terms of Service**
  - Create `/terms` page
  - Include service terms, refund policy, acceptable use
  - Link in footer

- [ ] **Add Cookie Consent Banner** (if in EU)
  Consider: cookie-consent libraries

- [ ] **GDPR Compliance**
  - ✅ Email preferences system (done)
  - ✅ One-click unsubscribe (done)
  - [ ] Data export functionality (optional)
  - [ ] Account deletion (optional)

### 9. Build & Deploy

- [ ] **Test Build Locally**
  ```bash
  npm run build
  ```
  Fix any TypeScript errors

- [ ] **Run All Tests**
  ```bash
  # Email preferences
  DATABASE_URL="<prod-db-url>" npx tsx test-email-preferences-simple.ts
  
  # Provider encryption
  PROVIDER_ENCRYPTION_KEY="<prod-key>" npx tsx test-provider-encryption.ts
  ```

- [ ] **Commit Latest Changes**
  ```bash
  git status
  git add .
  git commit -m "chore: production deployment preparation"
  ```

- [ ] **Deploy to Vercel**
  ```bash
  git push origin main
  ```
  
  Or via Vercel CLI:
  ```bash
  vercel --prod
  ```

- [ ] **Verify Deployment**
  - Check build logs in Vercel dashboard
  - Visit production URL
  - Test login
  - Test order flow
  - Test payment flow

### 10. Post-Deployment Verification

- [ ] **Health Check**
  ```bash
  curl https://yourdomain.com/api/health
  # Should return: {"status":"ok"}
  ```

- [ ] **Database Connection**
  - Login to admin panel
  - Check user list loads
  - Check orders list loads

- [ ] **Provider Credentials**
  - Check Vercel logs for "Decrypted provider credentials"
  - Verify no decryption errors

- [ ] **Email System**
  - Create test order
  - Verify order confirmation email sent
  - Check unsubscribe link works

- [ ] **Payment Processing**
  - Test Stripe payment ($1 test)
  - Test PayPal payment ($1 test)
  - Verify webhook delivery

- [ ] **Rate Limiting**
  - Make 10+ rapid requests to /api/platforms
  - Verify 429 rate limit response

## Post-Launch Monitoring (First 24 Hours)

### Hour 1-4: Critical Monitoring

- [ ] Monitor Sentry for errors every 30 minutes
- [ ] Check Vercel logs for crashes
- [ ] Verify first real orders complete successfully
- [ ] Monitor payment webhook deliveries

### Hour 4-12: Regular Monitoring

- [ ] Check error rates in Sentry (hourly)
- [ ] Monitor order fulfillment status
- [ ] Verify email deliverability
- [ ] Check database performance

### Hour 12-24: Stability Check

- [ ] Review all error logs
- [ ] Check order completion rate
- [ ] Verify no payment failures
- [ ] Monitor response times

## Emergency Rollback Procedure

If critical issues occur:

1. **Revert Deployment**
   ```bash
   # Vercel Dashboard → Deployments → Previous deployment → Promote to Production
   ```

2. **Check Database Migrations**
   ```bash
   npx prisma migrate status
   ```

3. **Restore Database** (if needed)
   ```bash
   # From backup (see docs/backup-procedures.md)
   ```

4. **Notify Users**
   - Add banner to site about maintenance
   - Email active users (if extended outage)

## Success Metrics

After 24 hours, verify:

- [ ] Zero critical errors in Sentry
- [ ] >99% uptime (uptime monitor)
- [ ] All payment webhooks delivered successfully
- [ ] Email deliverability >95%
- [ ] Order completion rate >90%
- [ ] Average response time <500ms
- [ ] No database connection errors

## Support Readiness

- [ ] Set up support email (support@yourdomain.com)
- [ ] Create FAQ page with common issues
- [ ] Prepare customer support scripts
- [ ] Set up ticketing system (optional: Zendesk, Intercom)

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Production URL:** https://_______________  
**Status:** ✅ PRODUCTION READY

---

*Checklist completed: _____ / _____ items*
