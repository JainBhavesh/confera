import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import type { User } from '@prisma/client';
import { defaultLocale, isLocale, LOCALE_AUTO_COOKIE_NAME, LOCALE_COOKIE_NAME } from '@/i18n/locales';

const SESSION_COOKIE_NAME = 'confera_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function createSession(userId: string): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { id: token, userId, expiresAt }
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt
  });

  // A returning user's saved language preference should win over whatever
  // locale cookie (default, or negotiated from Accept-Language) is currently
  // set — otherwise User.locale would be write-only and never actually
  // change what renders. Every login path (password, OTP, OAuth) funnels
  // through this one function, so this is the single place to apply it.
  //
  // User.locale is only ever written by an explicit choice (see
  // app/api/locale/route.ts — a timezone auto-guess never persists to the
  // DB), so a non-default value here is a real preference and safe to force.
  // Still sitting at the bare default is ambiguous — could be a genuine
  // choice of English, or just a user who's never touched the setting — so
  // in that case we leave whatever the cookie/timezone guess already has
  // rather than stomping a better guess with an unconfirmed default.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { locale: true } });
  if (user && isLocale(user.locale) && user.locale !== defaultLocale && cookieStore.get(LOCALE_COOKIE_NAME)?.value !== user.locale) {
    cookieStore.set(LOCALE_COOKIE_NAME, user.locale, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    });
    cookieStore.set(LOCALE_AUTO_COOKIE_NAME, '0', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    });
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { id: token } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  return session.user;
}
