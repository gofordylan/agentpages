import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const REVIEWS_PATH_RE = /^\/api\/agents\/[^/]+\/reviews$/;

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Check if route requires auth
  const isProtected =
    pathname === '/settings' ||
    pathname.startsWith('/api/profile') ||
    (REVIEWS_PATH_RE.test(pathname) && req.method !== 'GET');

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for NextAuth session cookie (don't import auth — Edge runtime incompatible)
  const token =
    req.cookies.get('__Secure-authjs.session-token')?.value ||
    req.cookies.get('authjs.session-token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/settings', '/api/profile', '/api/agents/:path*/reviews'],
};
