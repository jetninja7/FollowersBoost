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

  // Admin API: 200 requests per minute (higher limit)
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
