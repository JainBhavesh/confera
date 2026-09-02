import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { issueOtp } from '@/lib/auth/otp';
import { checkRateLimit, getRequestIp } from '@/lib/auth/rateLimit';
import { otpRequestSchema } from '@/lib/validation/schemas';

const GENERIC_MESSAGE = 'If that email is eligible, a verification code has been sent.';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = otpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { email, purpose } = parsed.data;
  const ip = getRequestIp(request);

  // A short per-(email, purpose) cooldown backs the client's resend timer;
  // a wider window caps total codes sent, and a per-IP bucket stops one
  // client from hammering many different email addresses.
  if (!checkRateLimit(`otp-cooldown:${purpose}:${email}`, { limit: 1, windowMs: 60 * 1000 })) {
    return NextResponse.json({ error: 'Please wait before requesting another code.' }, { status: 429 });
  }
  if (!checkRateLimit(`otp-request:${purpose}:${email}`, { limit: 5, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  if (!checkRateLimit(`otp-request-ip:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Across every purpose: don't reveal whether the account exists — only
  // send when it does and is active, but always return the same response.
  if (purpose === 'LOGIN' || purpose === 'PASSWORD_RESET') {
    if (user && user.isActive) {
      await issueOtp(email, purpose);
    }
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE, cooldownSeconds: 60 });
  }

  // purpose === 'EMAIL_VERIFICATION'
  if (user?.emailVerified) {
    return NextResponse.json({
      ok: true,
      alreadyVerified: true,
      message: 'This email is already verified. You can log in.'
    });
  }
  if (user && user.isActive) {
    await issueOtp(email, 'EMAIL_VERIFICATION');
  }
  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE, cooldownSeconds: 60 });
}
