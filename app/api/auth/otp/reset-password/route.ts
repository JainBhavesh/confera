import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyOtp, otpVerifyErrorMessage } from '@/lib/auth/otp';
import { hashPassword } from '@/lib/auth/password';
import { checkRateLimit, getRequestIp } from '@/lib/auth/rateLimit';
import { resetPasswordSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reset request.' }, { status: 400 });
  }

  const { email, code, newPassword } = parsed.data;
  const ip = getRequestIp(request);

  const rateLimitKey = `otp-verify:PASSWORD_RESET:${ip}:${email}`;
  if (!checkRateLimit(rateLimitKey, { limit: 10, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const result = await verifyOtp(email, 'PASSWORD_RESET', code);
  if (result !== 'OK') {
    return NextResponse.json({ error: otpVerifyErrorMessage(result), code: result }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'This account is unavailable.' }, { status: 403 });
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        // Entering the code proves mailbox ownership, same as the other OTP flows.
        emailVerified: true,
        emailVerifiedAt: user.emailVerified ? user.emailVerifiedAt : new Date()
      }
    }),
    // Changing the password invalidates every existing session — including
    // on other devices — in case the reset was prompted by a compromise.
    prisma.session.deleteMany({ where: { userId: user.id } })
  ]);

  return NextResponse.json({ ok: true });
}
