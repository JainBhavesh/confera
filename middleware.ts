import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, isLocale, LOCALE_AUTO_COOKIE_NAME, LOCALE_COOKIE_NAME, type Locale } from '@/i18n/locales';

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

// Simple Accept-Language negotiation against our fixed 24-locale list — only
// base-tag matching (e.g. "de-AT" -> "de"), no full BCP-47 fallback chain,
// since that's all next-intl's `i18n/request.ts` needs as a first-visit seed.
function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { base: tag.split('-')[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { base } of ranked) {
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  let response: NextResponse;
  if (isProtected && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    response = NextResponse.redirect(loginUrl);
  } else {
    response = NextResponse.next();
  }

  if (!request.cookies.has(LOCALE_COOKIE_NAME)) {
    // First visit: seed from Accept-Language and mark it auto-detected, so
    // the client-side timezone check (components/i18n/TimezoneLocaleSync)
    // is still free to refine it, and either one backs off the moment the
    // user picks a language explicitly via the switcher.
    response.cookies.set(LOCALE_COOKIE_NAME, negotiateLocale(request.headers.get('accept-language')), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax'
    });
    response.cookies.set(LOCALE_AUTO_COOKIE_NAME, '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax'
    });
  }

  return response;
}

export const config = {
  // Runs on everything except API routes, static/image assets and files
  // with an extension — locale negotiation needs to reach public pages too
  // (landing, login, register), not just the PROTECTED_PREFIXES the auth
  // gate above cares about.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.well-known).*)']
};
