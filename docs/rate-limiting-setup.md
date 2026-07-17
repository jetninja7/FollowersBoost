# Rate Limiting Setup Guide

## Overview

FollowersBoost uses Upstash Redis for distributed rate limiting to prevent API abuse and ensure fair usage across all users.

## Quick Setup

### 1. Create Upstash Redis Account

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up for free account (no credit card required)
3. Create a new Redis database:
   - Name: `followersboost-ratelimit`
   - Type: Regional (lower latency) or Global (multi-region)
   - Region: Choose closest to your deployment

### 2. Get Credentials

From your Upstash database dashboard:
1. Click on your database
2. Scroll to **REST API** section
3. Copy the following values:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Add Environment Variables

Add to `.env.local` (development):
```bash
# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

Add to Vercel/Production environment variables:
- Go to Project Settings → Environment Variables
- Add both variables for Production, Preview, and Development

### 4. Verify Setup

Rate limiting will automatically activate when env vars are present. Check logs:
```bash
npm run dev
# Should NOT see: "Rate limiting disabled: Redis connection failed"
```

## Rate Limit Tiers

### Auth Endpoints (`'auth'`)
- **Limit**: 5 requests per 15 minutes per IP
- **Applies to**:
  - `/api/auth/signup`
  - Login attempts (future)
  - Password reset (future)

### Public Endpoints (`'public'`)
- **Limit**: 20 requests per minute per IP
- **Applies to**:
  - `/api/platforms` (unauthenticated)
  - `/api/health`
  - Public landing pages

### API Endpoints (`'api'`)
- **Limit**: 100 requests per minute per IP
- **Applies to**:
  - `/api/orders` (GET, POST)
  - `/api/wallet/add-funds`
  - `/api/wallet/balance`
  - Most authenticated endpoints

### Admin Endpoints (`'admin'`)
- **Limit**: 200 requests per minute per IP
- **Applies to**:
  - `/api/admin/*` routes
  - Higher limit for admin operations

## Implementation

### Method 1: Manual Application (Recommended)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/rate-limit-helpers';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, 'api');
  if (rateLimitResponse) {
    return rateLimitResponse; // Returns 429 if rate limit exceeded
  }

  // Your handler code
  // ...
}
```

### Method 2: Wrapper Function

```typescript
import { withRateLimit } from '@/lib/api/rate-limit-helpers';

export const POST = withRateLimit(async (request: NextRequest) => {
  // Your handler code - rate limiting applied automatically
}, 'auth');
```

### Method 3: Check Status

```typescript
import { isRateLimitingEnabled } from '@/lib/api/rate-limit-helpers';

if (isRateLimitingEnabled()) {
  console.log('Rate limiting is active');
}
```

## Response Format

When rate limit is exceeded, returns 429 status:

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

**Response Headers**:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: ISO timestamp when limit resets
- `Retry-After`: Seconds until retry allowed

## Client Identifier

Rate limits are applied per IP address:

1. **Behind Proxy/CDN**: Uses `X-Forwarded-For` header (first IP)
2. **Direct Connection**: Uses `X-Real-IP` header
3. **Fallback**: Uses `request.ip` or 'anonymous'

**Note**: Vercel automatically provides correct IP forwarding.

## Graceful Degradation

If Upstash Redis is not configured:
- Rate limiting is **disabled**
- All requests pass through
- Warning logged on startup
- No errors thrown

This allows development without Redis setup.

## Monitoring

### Check Rate Limit Status

Visit your Upstash dashboard:
- View request counts
- Monitor rate limit hits
- See top rate-limited IPs

### Application Logs

Rate limit responses are logged with context:
```
[RATE_LIMIT_EXCEEDED] IP: 192.168.1.1, Endpoint: POST /api/orders
```

### Analytics (Optional)

Upstash provides built-in analytics when `analytics: true` is set:
```typescript
new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true, // ← Enables analytics
});
```

## Testing

### Test Rate Limiting Locally

1. Start dev server: `npm run dev`
2. Make rapid requests to an endpoint:
   ```bash
   # Test auth rate limit (5 per 15min)
   for i in {1..6}; do
     curl -X POST http://localhost:3000/api/auth/signup \
       -H "Content-Type: application/json" \
       -d '{"email":"test'$i'@test.com","password":"Test123!","name":"Test"}' \
       && echo ""
   done
   # 6th request should return 429
   ```

3. Check for 429 response on 6th request

### Test Without Redis

1. Remove env vars from `.env.local`
2. Restart dev server
3. Should see: "Rate limiting disabled: Redis connection failed"
4. All requests should pass through

## Protected Endpoints

### Currently Rate Limited

✅ **Auth**:
- `POST /api/auth/signup` (5/15min)

✅ **Orders**:
- `GET /api/orders` (100/min)
- `POST /api/orders` (100/min)

✅ **Wallet**:
- `POST /api/wallet/add-funds` (100/min)

### Not Yet Rate Limited

Consider adding to:
- `/api/auth/[...nextauth]` (NextAuth handles its own)
- `/api/webhooks/*` (use webhook signatures instead)
- `/api/cron/*` (use Vercel cron secret)
- Admin routes (add `'admin'` tier)

## Customizing Limits

Edit `/src/lib/rate-limit.ts`:

```typescript
export const ratelimit = redis ? {
  // Custom tier: 50 requests per 30 seconds
  custom: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '30 s'),
    prefix: 'ratelimit:custom',
    analytics: true,
  }),
} : { /* ... */ };
```

Then use in routes:
```typescript
await applyRateLimit(request, 'custom');
```

## Troubleshooting

### "Rate limiting disabled" warning

**Cause**: Missing or invalid Upstash credentials

**Fix**:
1. Verify env vars are set: `echo $UPSTASH_REDIS_REST_URL`
2. Check credentials in Upstash console
3. Restart dev server after adding env vars

### Rate limit not working

**Cause**: IP address not detected correctly

**Fix**:
1. Check `getClientIdentifier()` in `rate-limit-helpers.ts`
2. Add debug logging:
   ```typescript
   const identifier = getClientIdentifier(request);
   console.log('Rate limit IP:', identifier);
   ```
3. Verify proxy headers (`X-Forwarded-For`) if behind CDN

### All requests return 429

**Cause**: Rate limit too low or IP shared

**Fix**:
1. Increase limit in `rate-limit.ts`
2. Use user ID instead of IP for authenticated routes:
   ```typescript
   const identifier = session?.user?.id || getClientIdentifier(request);
   ```

### Redis connection errors

**Cause**: Network issues or invalid credentials

**Fix**:
1. Test connection: `curl $UPSTASH_REDIS_REST_URL`
2. Regenerate token in Upstash console
3. Check firewall/network restrictions

## Cost

**Upstash Free Tier**:
- 10,000 requests per day
- 256 MB storage
- Sufficient for small-medium apps

**Paid Tiers**:
- Pay-per-request pricing
- No monthly minimums
- ~$0.20 per 100K requests

**Estimate**: App with 10K users, 50 API calls/day = ~500K requests/month = ~$1/month

## Best Practices

1. **Start Conservative**: Use lower limits initially, increase based on monitoring
2. **Different Tiers**: Use stricter limits for expensive operations (auth, orders)
3. **User Feedback**: Show clear error messages with `retryAfter` time
4. **Monitor Abuse**: Check Upstash dashboard for unusual patterns
5. **Whitelist**: Consider IP whitelist for trusted sources (webhooks, cron jobs)
6. **User-based Limits**: For authenticated routes, consider rate limiting by user ID instead of IP

## Security

- ✅ Prevents brute force attacks (auth endpoints)
- ✅ Prevents API abuse (order spam, wallet spam)
- ✅ Protects against DDoS (distributed limits)
- ✅ Fair usage enforcement (all users get equal share)

## Next Steps

1. Set up Upstash Redis account
2. Add environment variables
3. Test locally with rapid requests
4. Deploy to production
5. Monitor Upstash dashboard for rate limit hits
6. Adjust limits based on actual usage patterns

## Support

- Upstash Docs: https://docs.upstash.com/redis
- Rate Limit Docs: https://github.com/upstash/ratelimit
- Issues: Report in project GitHub
