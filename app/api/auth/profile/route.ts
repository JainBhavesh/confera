import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { updateProfileSchema } from '@/lib/validation/schemas';
import { toPublicUser } from '@/services/user.service';

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();

    const body = await request.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid profile update.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name }
    });

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (err) {
    return toErrorResponse(err);
  }
}
