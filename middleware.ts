import { NextResponse, type NextRequest } from 'next/server';

// Edge-safe gate: only checks that a session cookie is present, since Prisma
// can't run on the edge runtime. This is NOT the real auth check — every
// page and API route still validates the session and role server-side via
// getCurrentUser()/requireUser()/requireAdmin(). This layer only stops
// logged-out visitors from momentarily seeing a protected page shell.
const SESSION_COOKIE_NAME = 'confera_session';
// /meet/[meetingId] is deliberately excluded: an org can allow guest join via
// its invite link (Admin → Settings → publicMeetingsEnabled), so a logged-out
// visitor must be able to reach the page at all — the page itself does the
// real authorization check (member vs. guest vs. rejected).
const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/meetings', '/profile'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/meetings/:path*', '/profile/:path*']
};
