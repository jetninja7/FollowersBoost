import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/lib/rate-limit';

export async function middleware(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? '127.0.0.1';
  const pathname = req.nextUrl.pathname;

  // Rate limit auth endpoints aggressively
  if (pathname.startsWith('/api/auth/')) {
    const { success, remaining } = await ratelimit.auth.limit(ip);
    if (!success) {
      return new NextResponse('Too many authentication attempts. Please try again later.', {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'Retry-After': '900', // 15 minutes
        },
      });
    }
    return NextResponse.next();
  }

  // Rate limit admin API
  if (pathname.startsWith('/api/admin/')) {
    const { success, remaining } = await ratelimit.admin.limit(ip);
    if (!success) {
      return new NextResponse('Too many requests', {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
        },
      });
    }
    return NextResponse.next();
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
  matcher: ['/api/:path*'],
};
