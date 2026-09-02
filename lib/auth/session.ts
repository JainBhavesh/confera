import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import type { User } from '@prisma/client';

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
