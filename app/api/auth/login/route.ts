import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { checkRateLimit, getRequestIp } from '@/lib/auth/rateLimit';
import { issueOtp } from '@/lib/auth/otp';
import { loginSchema } from '@/lib/validation/schemas';
import { toPublicUser } from '@/services/user.service';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const rateLimitKey = `login:${getRequestIp(request)}:${email}`;
  if (!checkRateLimit(rateLimitKey, { limit: 10, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  if (!user.passwordHash) {
    // An OAuth-only account — there's no password to check against. Naming
    // the provider here is a deliberate, small trade-off of email
    // enumeration resistance for a much less confusing error message; the
    // codebase already makes this same call for the OTP "unverified" path above.
    const provider = user.oauthProvider === 'facebook' ? 'Facebook' : 'Google';
    return NextResponse.json({ error: `This account signs in with ${provider}. Use "Continue with ${provider}" instead.` }, { status: 401 });
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  if (!user.emailVerified) {
    // Correct credentials but the mailbox was never confirmed — send a fresh
    // verification code (same per-email cooldown key as POST /api/auth/otp/request,
    // so this doesn't stack extra sends on top of a manual resend) and point
    // the client at the verify-email step instead of starting a session.
    if (checkRateLimit(`otp-cooldown:EMAIL_VERIFICATION:${user.email}`, { limit: 1, windowMs: 60 * 1000 })) {
      await issueOtp(user.email, 'EMAIL_VERIFICATION').catch((err) => console.error(err));
    }
    return NextResponse.json(
      { error: 'Please verify your email to continue.', code: 'EMAIL_NOT_VERIFIED', email: user.email },
      { status: 403 }
    );
  }

  await createSession(user.id);

  return NextResponse.json({ user: toPublicUser(user) });
}
