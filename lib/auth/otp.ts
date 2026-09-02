import { randomInt, createHash, timingSafeEqual } from 'crypto';
import type { OtpPurpose } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { sendOtpEmail } from '@/lib/email/otpEmail';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

function generateCode(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/**
 * Generates a fresh code, invalidates any prior unconsumed code for the same
 * (email, purpose), stores the hash, and emails the plaintext code. Only one
 * code per (email, purpose) is ever valid at a time.
 */
export async function issueOtp(email: string, purpose: OtpPurpose): Promise<void> {
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.$transaction([
    prisma.emailOtp.updateMany({
      where: { email, purpose, consumedAt: null },
      data: { consumedAt: new Date() }
    }),
    prisma.emailOtp.create({ data: { email, purpose, codeHash, expiresAt } })
  ]);

  await sendOtpEmail(email, code, purpose);
}

export type OtpVerifyResult = 'OK' | 'INVALID' | 'EXPIRED' | 'LOCKED' | 'NOT_FOUND';

/**
 * Checks `code` against the latest unconsumed (email, purpose) OTP. Wrong
 * codes increment an attempt counter (locking the code out after
 * OTP_MAX_ATTEMPTS); a correct code is marked consumed so it can't be reused.
 */
export async function verifyOtp(email: string, purpose: OtpPurpose, code: string): Promise<OtpVerifyResult> {
  const record = await prisma.emailOtp.findFirst({
    where: { email, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' }
  });

  if (!record) return 'NOT_FOUND';
  if (record.attempts >= OTP_MAX_ATTEMPTS) return 'LOCKED';
  if (record.expiresAt < new Date()) return 'EXPIRED';

  const provided = Buffer.from(hashCode(code));
  const stored = Buffer.from(record.codeHash);
  const matches = provided.length === stored.length && timingSafeEqual(provided, stored);

  if (!matches) {
    await prisma.emailOtp.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return 'INVALID';
  }

  await prisma.emailOtp.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return 'OK';
}

const VERIFY_ERROR_MESSAGES: Record<Exclude<OtpVerifyResult, 'OK'>, string> = {
  NOT_FOUND: 'No pending code for this email. Request a new one.',
  EXPIRED: 'This code has expired. Request a new one.',
  LOCKED: 'Too many incorrect attempts. Request a new code.',
  INVALID: 'Incorrect code. Please try again.'
};

export function otpVerifyErrorMessage(result: Exclude<OtpVerifyResult, 'OK'>): string {
  return VERIFY_ERROR_MESSAGES[result];
}
