import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export function isPasswordStrongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
