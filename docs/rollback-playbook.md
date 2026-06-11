# Emergency Rollback Playbook

## When to Rollback

Rollback immediately if:
- Health check fails after deployment
- Critical functionality broken (auth, payments, orders)
- Widespread errors in Sentry
- Database connection failures
- Significant user-facing errors

## Rollback Steps

### 1. Immediate Deployment Rollback

**Via Vercel Dashboard:**
1. Go to Deployments tab
2. Find previous working deployment (marked as "Ready")
3. Click "..." menu → "Promote to Production"
4. Wait for deployment (~2 minutes)

**Via CLI:**
```bash
# List recent deployments
vercel ls

# Promote previous deployment
vercel promote <previous-deployment-url>
```

### 2. Verify Rollback Success

```bash
# Check health endpoint
curl https://yourdomain.com/api/health

# Expected: {"status":"healthy",...}
```

**Manual Verification:**
- [ ] Visit homepage - loads correctly
- [ ] Login works
- [ ] Sign up works
- [ ] Order placement works
- [ ] Admin panel accessible
- [ ] No errors in Sentry

**Monitor for 5-10 minutes:**
- Watch Sentry dashboard
- Watch Vercel logs
- Monitor health check

### 3. Database Rollback (If Needed)

**Only if migration caused the issue.**

#### Option A: Rollback Prisma Migration

```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration-name>

# Apply previous migration state
# (Only works if migration is reversible)
```

#### Option B: Restore from Backup

1. **Access Vercel Dashboard:**
   - Storage > Your Database
   - Click "Backups" tab

2. **Select Backup:**
   - Find backup from before migration (check timestamp)
   - Click "Restore"

3. **Confirm Restore:**
   - ⚠️ **WARNING:** This overwrites current data
   - Type confirmation
   - Wait 5-10 minutes

4. **Verify Data Integrity:**
   ```bash
   # Check recent data
   npx prisma studio
   
   # Verify counts
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "Order";
   ```

### 4. Root Cause Analysis

After stability is restored:

#### Gather Information

- Sentry errors during incident
- Vercel deployment logs
- Database logs (Vercel dashboard)
- User reports

#### Identify Root Cause

Questions to answer:
- What changed in the deployment?
- What failed specifically?
- Why didn't staging catch it?
- What was different between staging and production?

#### Document Incident

Create post-mortem document:
- Timeline of events
- Root cause
- Impact (users affected, duration)
- Resolution steps
- Prevention measures

### 5. Fix and Retry

1. **Fix Issue Locally:**
   - Reproduce the error
   - Implement fix
   - Add test to prevent regression

2. **Test on Staging:**
   - Deploy to staging
   - Run full test suite
   - Verify fix works

3. **Deploy to Production:**
   - Deploy during low-traffic period
   - Monitor closely for 30 minutes
   - Be ready to rollback again if needed

## Common Issues & Solutions

### Issue: Database Connection Errors

**Symptoms:**
- Health check fails
- Sentry shows Prisma errors
- "Unable to connect to database"

**Solution:**
1. Check DATABASE_URL in Vercel env vars
2. Verify database is running (Vercel dashboard > Storage)
3. Check for connection limit issues:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```
4. Restart database if needed (Vercel dashboard)

### Issue: Environment Variable Missing

**Symptoms:**
- App crashes at startup
- Zod validation error in logs
- "Required environment variable not found"

**Solution:**
1. Check Vercel env vars for the deployment
2. Add missing variable
3. Redeploy: `vercel --prod`

### Issue: Rate Limiting Broken

**Symptoms:**
- All API requests return 429
- Upstash Redis errors in logs

**Solution:**
1. Check UPSTASH credentials in Vercel env vars
2. Verify Redis database is active (console.upstash.com)
3. Check rate limit configuration in `src/lib/rate-limit.ts`
4. Temporarily disable rate limiting:
   ```typescript
   // Comment out rate limit checks in middleware.ts
   ```
5. Deploy fix

### Issue: Sentry Quota Exceeded

**Symptoms:**
- Sentry dashboard shows "quota exceeded"
- Events not being captured

**Solution:**
1. Increase Sentry quota (sentry.io dashboard)
2. Reduce sample rate in `src/lib/sentry.ts`:
   ```typescript
   tracesSampleRate: 0.05, // Lower from 0.1
   ```
3. Deploy update

### Issue: Migration Failed Mid-Execution

**Symptoms:**
- Some tables updated, some not
- Schema mismatch errors

**Solution:**
1. Restore database from backup (pre-migration)
2. Fix migration script locally
3. Test on staging thoroughly
4. Retry migration with monitoring

### Issue: Cron Job Not Running

**Symptoms:**
- Orders not processing
- No cron logs in Vercel

**Solution:**
1. Check vercel.json has correct cron config
2. Verify endpoint works manually:
   ```bash
   curl https://yourdomain.com/api/cron/process-orders
   ```
3. Check Vercel dashboard > Cron Jobs for errors
4. Redeploy if needed

## Communication Templates

### Internal (Team Slack)

```
🚨 ROLLBACK INITIATED

Time: <timestamp>
Deployment: <deployment-url>
Reason: <brief description>
Status: [In Progress / Complete]
Impact: <users affected / duration>
Next Steps: <what we're doing>
```

### External (If User-Facing Outage)

```
We experienced a technical issue and have rolled back 
to the previous version. All systems are now stable. 
We apologize for any inconvenience.

Affected timeframe: <start> - <end>
```

### Post-Incident Update

```
Incident resolved. Root cause: <brief explanation>
Prevention: <what we're doing to prevent recurrence>
```

## Prevention Checklist

After each incident, update:
- [ ] Add monitoring for that failure mode
- [ ] Add test to catch the issue
- [ ] Update deployment checklist
- [ ] Update staging environment to match prod
- [ ] Review with team
- [ ] Document lessons learned

## Emergency Contacts

- **Vercel Support:** support@vercel.com
- **Sentry Support:** support@sentry.io
- **Upstash Support:** support@upstash.com
- **Team Lead:** [Contact info]
- **On-Call Engineer:** [Rotation schedule]
