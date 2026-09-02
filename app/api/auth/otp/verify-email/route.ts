import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyOtp, otpVerifyErrorMessage } from '@/lib/auth/otp';
import { createSession } from '@/lib/auth/session';
import { checkRateLimit, getRequestIp } from '@/lib/auth/rateLimit';
import { otpVerifySchema } from '@/lib/validation/schemas';
import { toPublicUser } from '@/services/user.service';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = otpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email or code.' }, { status: 400 });
  }

  const { email, code } = parsed.data;
  const ip = getRequestIp(request);

  const rateLimitKey = `otp-verify:EMAIL_VERIFICATION:${ip}:${email}`;
  if (!checkRateLimit(rateLimitKey, { limit: 10, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'No pending code for this email. Request a new one.', code: 'NOT_FOUND' }, { status: 400 });
  }
  if (!user.isActive) {
    return NextResponse.json({ error: 'This account is unavailable.' }, { status: 403 });
  }

  // Deliberately no "already verified" shortcut here: that would mean a POST
  // carrying nothing but a known, already-verified email logs the caller in
  // without checking `code` at all. Once emailVerified flips to true the
  // prior OTP row is already consumed, so verifyOtp naturally reports
  // NOT_FOUND for a resubmit — the code is still always checked.
  const result = await verifyOtp(email, 'EMAIL_VERIFICATION', code);
  if (result !== 'OK') {
    return NextResponse.json({ error: otpVerifyErrorMessage(result), code: result }, { status: 400 });
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifiedAt: new Date() }
  });

  await createSession(verifiedUser.id);

  return NextResponse.json({ user: toPublicUser(verifiedUser) });
}
