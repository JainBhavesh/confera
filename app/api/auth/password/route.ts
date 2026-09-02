import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { changePasswordSchema } from '@/lib/validation/schemas';

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();

    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid password change request.' }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    // An OAuth-only account has no password yet to verify — this call is
    // "set my first password" rather than "change my password" for them.
    if (user.passwordHash && !(await verifyPassword(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
