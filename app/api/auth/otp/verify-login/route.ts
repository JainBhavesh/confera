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

  const rateLimitKey = `otp-verify:LOGIN:${ip}:${email}`;
  if (!checkRateLimit(rateLimitKey, { limit: 10, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const result = await verifyOtp(email, 'LOGIN', code);
  if (result !== 'OK') {
    return NextResponse.json({ error: otpVerifyErrorMessage(result), code: result }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'This account is unavailable.' }, { status: 403 });
  }

  // Successfully receiving and entering the code proves mailbox ownership,
  // so an OTP login also satisfies email verification if it hadn't happened yet.
  const verifiedUser = user.emailVerified
    ? user
    : await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifiedAt: new Date() }
      });

  await createSession(verifiedUser.id);

  return NextResponse.json({ user: toPublicUser(verifiedUser) });
}
