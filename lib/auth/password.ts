import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export function isPasswordStrongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

/** A one-off password for an account auto-created on someone else's behalf (e.g. a meeting invite) — emailed once, meant to be changed. */
export function generateTempPassword(): string {
  return randomBytes(12).toString('base64url');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
