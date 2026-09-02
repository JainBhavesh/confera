import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { createLivestreamSchema } from '@/lib/validation/schemas';
import { createLivestream } from '@/services/livestream.service';
import { recordAuditLog } from '@/services/audit.service';
import { getResolvedPermissions } from '@/lib/permissions';

// Unlike meetings, livestreams are broadcast — any org member can discover
// and watch one, so this lists every livestream in the org, not just "mine".
export async function GET() {
  try {
    const user = await requireUser();

    const livestreams = await prisma.livestream.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true } } }
    });

    return NextResponse.json({ livestreams });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    const permissions = await getResolvedPermissions(user);
    if (!permissions.canCreateLivestream) {
      return NextResponse.json({ error: 'You do not have permission to create livestreams.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createLivestreamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid livestream details.' }, { status: 400 });
    }

    const livestream = await createLivestream({
      organizationId: user.organizationId,
      createdByUserId: user.id,
      title: parsed.data.title,
      visibility: parsed.data.visibility
    });

    await recordAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: 'LIVESTREAM_CREATED',
      resourceType: 'Livestream',
      resourceId: livestream.id,
      request
    });

    return NextResponse.json({ livestream }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
