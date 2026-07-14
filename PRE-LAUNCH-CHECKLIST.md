# 🚀 Pre-Launch Checklist

## ✅ Security & Credentials

### 1. Change Admin Password
- [ ] Login to dashboard
- [ ] Go to Profile/Settings
- [ ] Change password from default `Admin123!`
- [ ] Use strong password (16+ chars, mixed case, numbers, symbols)

### 2. Update Environment Variables
- [ ] Generate new `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- [ ] Update in production environment
- [ ] Never commit `.env.local` to git

### 3. Review CLAUDE.md
- [ ] Remove any sensitive testing notes
- [ ] Update default credentials section
- [ ] Document production-specific configs

---

## ✅ Legal & Compliance

### 1. Terms of Service Page
- [ ] Create `/app/(legal)/terms/page.tsx`
- [ ] Include service rules, refund policy, prohibited uses
- [ ] Add link to footer

### 2. Privacy Policy Page
- [ ] Create `/app/(legal)/privacy/page.tsx`
- [ ] Explain data collection, cookies, user rights (GDPR)
- [ ] Add link to footer

### 3. Refund Policy
- [ ] Document refund conditions
- [ ] Add to footer and checkout flow
- [ ] Update in admin panel help text

---

## ✅ Payment Configuration

### 1. Stripe Production Setup
- [ ] Go to https://dashboard.stripe.com
- [ ] Switch to live mode
- [ ] Get live API keys (pk_live_xxx and sk_live_xxx)
- [ ] Update `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Configure webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Add webhook signing secret to `STRIPE_WEBHOOK_SECRET`
- [ ] Test with real $0.50 charge

### 2. PayPal Production Setup
- [ ] Go to https://developer.paypal.com
- [ ] Switch from sandbox to live
- [ ] Get live client ID and secret
- [ ] Update `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
- [ ] Change `PAYPAL_MODE=live`
- [ ] Test with real $1 payment

### 3. Payment Testing
- [ ] Test Stripe with real card
- [ ] Test PayPal with real account
- [ ] Verify funds appear in wallet
- [ ] Verify webhook triggers properly

---

## ✅ Email Configuration

### 1. Domain Verification
- [ ] Go to https://resend.com/domains
- [ ] Add your domain (e.g., followersboost.com)
- [ ] Add DNS records (TXT, MX)
- [ ] Wait for verification (5-60 min)
- [ ] Update `EMAIL_FROM=noreply@yourdomain.com`

### 2. Email Testing
- [ ] Test order confirmation email
- [ ] Test order status update emails
- [ ] Test wallet deposit email
- [ ] Verify all emails deliver (check spam)

---

## ✅ Database & Infrastructure

### 1. Production Database
**Option A: Vercel Postgres (Easiest)**
- [ ] Create Vercel Postgres database
- [ ] Auto-fills `DATABASE_URL`
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Run seed: `npx prisma db seed`

**Option B: External Postgres**
- [ ] Sign up: Railway / Supabase / Neon
- [ ] Get connection string
- [ ] Update `DATABASE_URL`
- [ ] Run migrations
- [ ] Run seed

### 2. Redis (Rate Limiting)
- [ ] Sign up for Upstash Redis (free tier)
- [ ] Get REST URL and token
- [ ] Update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- [ ] Test rate limiting works

### 3. Monitoring
- [ ] Sentry account (optional but recommended)
- [ ] Add `SENTRY_DSN` if using
- [ ] Test error tracking

---

## ✅ Content & Branding

### 1. Landing Page Content
- [ ] Update hero text with your branding
- [ ] Update testimonials (remove fake names if needed)
- [ ] Update platform showcase text
- [ ] Add real statistics or remove counters
- [ ] Update FAQ answers

### 2. Service Descriptions
- [ ] Review all service descriptions
- [ ] Update delivery times to realistic values
- [ ] Update min/max quantities
- [ ] Verify pricing is correct

### 3. Email Templates
- [ ] Update company name in email footer
- [ ] Add real support email
- [ ] Add company address (if required)
- [ ] Test email formatting

---

## ✅ Provider Setup

### 1. Choose SMM Provider
**Recommended Providers:**
- JustAnotherPanel.com
- PerfectPanel.com
- BulkFollows.com
- SMMHeaven.com

### 2. Sign Up & Configure
- [ ] Create account with chosen provider
- [ ] Get API credentials
- [ ] Note API URL and key format
- [ ] Check their documentation

### 3. Add to System
- [ ] Login to admin panel: `/admin/providers`
- [ ] Click "Add Provider"
- [ ] Enter name, API URL, credentials
- [ ] Test connection
- [ ] Map services to your catalog

### 4. Test Order
- [ ] Place small test order (10-50 units)
- [ ] Verify it submits to provider
- [ ] Verify status updates
- [ ] Verify completion

---

## ✅ Final Testing

### 1. Complete Order Flow
- [ ] Register new test account
- [ ] Add funds via Stripe ($10)
- [ ] Place order (50 followers)
- [ ] Wait for processing
- [ ] Verify completion
- [ ] Check emails received

### 2. Admin Panel
- [ ] Login as admin
- [ ] View all orders
- [ ] Try manual status update
- [ ] Test refund flow
- [ ] Verify user management works

### 3. Edge Cases
- [ ] Try order with insufficient balance
- [ ] Try invalid quantities (too low/high)
- [ ] Try invalid URLs
- [ ] Test order cancellation
- [ ] Test multiple simultaneous orders

---

## ✅ Deployment

### 1. Version Control
```bash
# Initialize git if not done
git init
git add .
git commit -m "Initial production-ready commit"

# Create GitHub repo
# Push to GitHub
git remote add origin https://github.com/yourusername/followersboost.git
git push -u origin main
```

### 2. Deploy to Vercel
- [ ] Go to https://vercel.com
- [ ] Click "New Project"
- [ ] Import from GitHub
- [ ] Configure environment variables (copy from .env.local)
- [ ] Deploy
- [ ] Wait 2-5 minutes
- [ ] Get production URL

### 3. Domain Setup
- [ ] Buy domain (Namecheap, GoDaddy, etc.)
- [ ] Add domain to Vercel project
- [ ] Update DNS records
- [ ] Wait for SSL (5-60 min)
- [ ] Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL`

### 4. Cron Jobs
- [ ] Verify `vercel.json` has cron config
- [ ] Cron runs every 5 minutes automatically
- [ ] Check logs: Vercel dashboard → Functions → Logs

---

## ✅ Post-Launch Monitoring

### 1. Day 1 Checklist
- [ ] Check order processing every hour
- [ ] Monitor error logs
- [ ] Check email deliverability
- [ ] Test all payment methods
- [ ] Verify provider integration

### 2. Week 1 Checklist
- [ ] Review user feedback
- [ ] Fix any bugs reported
- [ ] Monitor conversion rates
- [ ] Check payment gateway fees
- [ ] Review provider performance

### 3. Setup Alerts
- [ ] Sentry error alerts
- [ ] Stripe payment alerts
- [ ] Database connection monitoring
- [ ] Uptime monitoring (UptimeRobot)

---

## 🚨 Emergency Contacts

**Important URLs:**
- Production: `https://yourdomain.com`
- Admin: `https://yourdomain.com/admin`
- Vercel Dashboard: `https://vercel.com/dashboard`
- Database: `[Your DB provider dashboard]`

**Support Contacts:**
- Vercel Support: support@vercel.com
- Stripe Support: https://support.stripe.com
- PayPal Support: https://www.paypal.com/support

---

## 📊 Success Metrics

**Track these KPIs:**
- [ ] Orders per day
- [ ] Revenue per day
- [ ] Average order value
- [ ] Conversion rate (visitors → orders)
- [ ] Refund rate
- [ ] Customer support tickets
- [ ] Provider fulfillment time
- [ ] Email open rates

---

## ✅ Launch Day

**Final checks before announcing:**
1. [ ] All items above completed
2. [ ] Test order completed successfully
3. [ ] All payment methods working
4. [ ] Emails delivering properly
5. [ ] Domain DNS propagated
6. [ ] SSL certificate active
7. [ ] Admin panel accessible
8. [ ] Monitoring active

**Then:**
- [ ] Soft launch to friends/testers
- [ ] Fix any issues found
- [ ] Full public launch
- [ ] Announce on social media
- [ ] Start marketing campaigns

---

## 🎉 You're Live!

Congratulations on launching FollowersBoost! 🚀

**Next Steps:**
- Monitor closely for first week
- Gather user feedback
- Iterate and improve
- Scale marketing
- Add new features based on demand
