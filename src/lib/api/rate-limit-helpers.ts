import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/lib/rate-limit';

/**
 * Get client identifier for rate limiting
 * Uses IP address, falling back to a header if behind proxy
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (when behind proxy/CDN)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to request IP (may be proxy IP)
  return request.ip || 'anonymous';
}

/**
 * Check rate limit and return 429 if exceeded
 */
export async function checkRateLimit(
  request: NextRequest,
  limiterType: 'auth' | 'api' | 'admin' | 'public' = 'api'
): Promise<{ success: true } | NextResponse> {
  const identifier = getClientIdentifier(request);
  const limiter = ratelimit[limiterType];

  const { success, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limiterType === 'auth' ? '5' : limiterType === 'public' ? '20' : limiterType === 'admin' ? '200' : '100',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return { success: true };
}

/**
 * Wrapper for API routes with rate limiting
 *
 * Usage:
 * ```typescript
 * export const POST = withRateLimit(async (request: NextRequest) => {
 *   // Your handler code
 * }, 'auth');
 * ```
 */
export function withRateLimit<T extends (request: NextRequest, ...args: any[]) => Promise<Response | NextResponse>>(
  handler: T,
  limiterType: 'auth' | 'api' | 'admin' | 'public' = 'api'
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const rateLimitResult = await checkRateLimit(request, limiterType);

    if (rateLimitResult !== null && 'success' in rateLimitResult && rateLimitResult.success === true) {
      return handler(request, ...args);
    }

    return rateLimitResult;
  }) as T;
}

/**
 * Check if rate limiting is enabled
 */
export function isRateLimitingEnabled(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Apply rate limit manually in route handler
 * Returns null if check passes, or error response if rate limit exceeded
 */
export async function applyRateLimit(
  request: NextRequest,
  limiterType: 'auth' | 'api' | 'admin' | 'public' = 'api'
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, limiterType);

  if ('success' in result && result.success === true) {
    return null; // Rate limit check passed
  }

  return result; // Return error response
}
