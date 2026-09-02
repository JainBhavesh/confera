import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { toPublicUser } from '@/services/user.service';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: toPublicUser(user) });
}
