import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const STATE_COOKIE_PREFIX = 'oauth_state_';

export function generateState(): string {
  return randomBytes(24).toString('base64url');
}

export async function setStateCookie(provider: string, state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(`${STATE_COOKIE_PREFIX}${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60 // the whole round trip to the provider and back should take seconds, not minutes
  });
}

/** One-shot: clears the cookie regardless of outcome, so a stale state can never be replayed. */
export async function consumeStateCookie(provider: string, incomingState: string | null): Promise<boolean> {
  const cookieStore = await cookies();
  const name = `${STATE_COOKIE_PREFIX}${provider}`;
  const stored = cookieStore.get(name)?.value;
  cookieStore.delete(name);
  return Boolean(stored && incomingState && stored === incomingState);
}

/**
 * OAuth providers require the redirect_uri to exactly match what's registered
 * with them, so this is deliberately a fixed configured value rather than
 * derived from request headers (which can disagree with reality behind a
 * proxy and would otherwise cause confusing, hard-to-debug mismatches).
 */
export function getAppBaseUrl(): string {
  const base = process.env.APP_BASE_URL;
  if (!base) {
    throw new Error('APP_BASE_URL must be set for OAuth sign-in (used as the exact redirect_uri registered with the provider).');
  }
  return base.replace(/\/$/, '');
}
