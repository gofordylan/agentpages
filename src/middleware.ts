import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const isProtected = req.nextUrl.pathname === '/settings' ||
    req.nextUrl.pathname.startsWith('/api/profile');

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for NextAuth session cookie (don't import auth — Edge runtime incompatible)
  const token =
    req.cookies.get('__Secure-authjs.session-token')?.value ||
    req.cookies.get('authjs.session-token')?.value;

  if (!token) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/settings', '/api/profile'],
};
