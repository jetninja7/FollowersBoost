# 🚀 Deploy to Vercel - Step by Step Guide

## Prerequisites
- GitHub account
- Vercel account (free: vercel.com/signup)
- Domain name (optional but recommended)

---

## Step 1: Prepare for Deployment (5 minutes)

### 1.1 Create `.gitignore` (if not exists)
```bash
cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
/prisma/migrations/**/*.sql.log
EOF
```

### 1.2 Initialize Git Repository
```bash
# Check if git is initialized
git status

# If not initialized:
git init
git add .
git commit -m "feat: production-ready FollowersBoost v1.0"
```

### 1.3 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `followersboost`
3. Privacy: Private (recommended)
4. Click "Create repository"

### 1.4 Push to GitHub
```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/followersboost.git

# Push code
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel (10 minutes)

### 2.1 Import Project
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub account
4. Find and select `followersboost` repository
5. Click "Import"

### 2.2 Configure Project
**Framework Preset:** Next.js (auto-detected)
**Root Directory:** `./` (leave as is)
**Build Command:** `npm run build` (auto-configured)
**Output Directory:** `.next` (auto-configured)

### 2.3 Add Environment Variables

Click "Environment Variables" and add these:

#### Required Variables:
```env
# Database (use Vercel Postgres - see Step 3)
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_SECRET=<generate new: openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app

# Stripe (get from https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# PayPal (get from https://developer.paypal.com)
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=live
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxxxx

# Email (get from https://resend.com)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourdomain.com

# Optional but recommended
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**Important:** Use **production** API keys, not test/sandbox keys!

### 2.4 Deploy
1. Click "Deploy"
2. Wait 2-5 minutes
3. Watch build logs
4. Copy deployment URL when done

---

## Step 3: Setup Database (15 minutes)

### Option A: Vercel Postgres (Easiest)

#### 3.1 Create Database
1. Go to your Vercel project
2. Click "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose region (same as your app)
6. Click "Create"

#### 3.2 Connect Database
- Vercel automatically adds `DATABASE_URL` to environment variables
- No manual configuration needed!

#### 3.3 Run Migrations
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

### Option B: External Database (Railway, Supabase, Neon)

#### Using Railway:
1. Go to https://railway.app
2. Create new project
3. Add Postgres service
4. Copy connection string
5. Add to Vercel environment variables as `DATABASE_URL`
6. Redeploy Vercel project

---

## Step 4: Configure Webhooks (10 minutes)

### 4.1 Stripe Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_method.attached`
5. Copy webhook signing secret
6. Add to Vercel as `STRIPE_WEBHOOK_SECRET`
7. Redeploy

### 4.2 PayPal Webhook
1. Go to https://developer.paypal.com/dashboard/webhooks
2. Create webhook
3. URL: `https://your-domain.com/api/webhooks/paypal`
4. Events: All payment events
5. Copy webhook ID
6. Add to Vercel as `PAYPAL_WEBHOOK_ID`

---

## Step 5: Setup Custom Domain (15 minutes)

### 5.1 Buy Domain
- Namecheap.com
- GoDaddy.com
- Google Domains
- Cloudflare

Example: `followersboost.com`

### 5.2 Add Domain to Vercel
1. Go to Vercel project → Settings → Domains
2. Enter your domain
3. Click "Add"
4. Vercel shows DNS records to add

### 5.3 Configure DNS
**For root domain (followersboost.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 5.4 Wait for Propagation
- DNS: 5-60 minutes
- SSL Certificate: 5-60 minutes
- Check status in Vercel dashboard

### 5.5 Update Environment Variables
```env
NEXTAUTH_URL=https://followersboost.com
NEXT_PUBLIC_APP_URL=https://followersboost.com
```
Redeploy after updating.

---

## Step 6: Setup Email Domain (20 minutes)

### 6.1 Verify Domain in Resend
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain: `followersboost.com`
4. Add DNS records shown:
   - TXT record for verification
   - MX records for receiving
   - DKIM records for authentication

### 6.2 Wait for Verification
- Usually 5-60 minutes
- Check status in Resend dashboard

### 6.3 Test Email
```bash
# From your local machine
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@followersboost.com",
    "to": "your-email@gmail.com",
    "subject": "Test Email",
    "html": "<p>It works!</p>"
  }'
```

---

## Step 7: Post-Deployment Setup (15 minutes)

### 7.1 Change Admin Password
1. Go to `https://yourdomain.com/login`
2. Login: `admin@followersboost.com` / `Admin123!`
3. Go to Profile → Change Password
4. Use strong password

### 7.2 Add First Provider
1. Go to `https://yourdomain.com/admin/providers`
2. Click "Add Provider"
3. Select provider type
4. Enter API credentials
5. Test connection
6. Enable provider

### 7.3 Test Complete Flow
1. Create test user account
2. Add $10 via Stripe (real payment)
3. Place small order (10-50 units)
4. Check order processes
5. Verify emails sent
6. Check admin panel

---

## Step 8: Monitoring & Alerts (10 minutes)

### 8.1 Enable Vercel Analytics
1. Go to project → Analytics
2. Enable Web Analytics
3. View real-time traffic

### 8.2 Setup Uptime Monitoring
1. Go to https://uptimerobot.com (free)
2. Add monitor
3. URL: `https://yourdomain.com/api/health`
4. Interval: 5 minutes
5. Alert email: your email

### 8.3 Sentry Error Tracking (Optional)
1. Go to https://sentry.io
2. Create project (Next.js)
3. Copy DSN
4. Add `SENTRY_DSN` to Vercel
5. Redeploy

---

## Step 9: Cron Jobs (Auto-configured)

Vercel automatically runs cron jobs defined in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/process-orders",
    "schedule": "*/5 * * * *"
  }]
}
```

**Check cron logs:**
1. Vercel Dashboard → Functions
2. Filter by `/api/cron/process-orders`
3. View execution logs

**Note:** Cron jobs require Hobby plan or higher ($20/month)

---

## Step 10: Final Verification

### Checklist:
- [ ] Site loads at custom domain
- [ ] HTTPS works (green padlock)
- [ ] Can login as admin
- [ ] Can register new user
- [ ] Stripe payment works
- [ ] PayPal payment works
- [ ] Emails sending
- [ ] Orders processing
- [ ] Provider integration works
- [ ] Admin panel accessible
- [ ] Cron jobs running

---

## 🎉 You're Live!

### Production URLs:
- **Website:** https://yourdomain.com
- **Admin:** https://yourdomain.com/admin
- **API Health:** https://yourdomain.com/api/health

### Next Steps:
1. ✅ Soft launch to beta testers
2. ✅ Monitor for 24-48 hours
3. ✅ Fix any issues
4. ✅ Public launch
5. ✅ Marketing campaigns

---

## 🆘 Troubleshooting

### Build Failed?
```bash
# Check logs in Vercel dashboard
# Common issues:
# 1. Missing env variables
# 2. TypeScript errors
# 3. Prisma schema issues

# Fix locally:
npm run build

# If successful, push and redeploy
git add .
git commit -m "fix: build issues"
git push
```

### Database Migration Failed?
```bash
# Pull production env vars
vercel env pull .env.production

# Run migrations with production DB
npx prisma migrate deploy

# If issues, reset:
npx prisma migrate reset --force
npx prisma db seed
```

### Emails Not Sending?
1. Check Resend dashboard → Logs
2. Verify domain DNS records
3. Check spam folder
4. Verify `EMAIL_FROM` matches verified domain

### Payments Not Working?
1. Verify using **live** API keys (not test)
2. Check Stripe webhook is receiving events
3. Test with real card (4242... won't work in live mode)
4. Check Vercel function logs

### Orders Not Processing?
1. Check cron job logs in Vercel
2. Verify provider credentials
3. Check admin panel → Providers → Health
4. Manually trigger: `curl https://yourdomain.com/api/cron/process-orders`

---

## 📞 Support

**Vercel Issues:**
- Docs: https://vercel.com/docs
- Support: support@vercel.com

**Database Issues:**
- Vercel Postgres: support@vercel.com
- Railway: support@railway.app

**Payment Issues:**
- Stripe: https://support.stripe.com
- PayPal: https://www.paypal.com/support

---

## 🔄 Continuous Deployment

Every time you push to `main` branch, Vercel automatically:
1. Builds your app
2. Runs tests (if configured)
3. Deploys to production
4. Updates environment

```bash
# Make changes locally
git add .
git commit -m "feat: new feature"
git push

# Vercel auto-deploys (2-5 min)
```

---

## 💰 Costs

**Vercel:**
- Hobby: $20/month (includes cron jobs)
- Pro: $20/month per user

**Vercel Postgres:**
- Hobby: Free (500MB storage)
- Pro: $20/month (5GB storage)

**Stripe:**
- 2.9% + $0.30 per transaction

**PayPal:**
- 2.9% + $0.30 per transaction

**Resend:**
- Free: 3,000 emails/month
- Pro: $20/month (50,000 emails)

**Total minimum:** ~$40-60/month

---

Good luck with your launch! 🚀
