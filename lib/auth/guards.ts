import type { User } from '@prisma/client';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') {
    throw new AuthError('Forbidden', 403);
  }
  return user;
}

/** Server Component/page equivalent of requireUser — redirects instead of throwing. */
export async function requireUserPage(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

/** Server Component/page equivalent of requireAdmin — redirects instead of throwing. */
export async function requireAdminPage(): Promise<User> {
  const user = await requireUserPage();
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  return user;
}

/** Maps an error from a route handler to a JSON response, treating AuthError specially. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
