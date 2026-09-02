import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { getOrgScopedLivestream, endLivestream } from '@/services/livestream.service';
import { recordAuditLog } from '@/services/audit.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const livestream = await getOrgScopedLivestream(user.organizationId, id);
    if (!livestream) {
      return NextResponse.json({ error: 'Livestream not found.' }, { status: 404 });
    }

    return NextResponse.json({ livestream });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const livestream = await getOrgScopedLivestream(user.organizationId, id);
    if (!livestream) {
      return NextResponse.json({ error: 'Livestream not found.' }, { status: 404 });
    }
    if (livestream.createdByUserId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only the host or an admin can update this livestream.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const status = body && typeof body === 'object' ? (body as { status?: unknown }).status : undefined;
    const chatEnabled = body && typeof body === 'object' ? (body as { chatEnabled?: unknown }).chatEnabled : undefined;

    if (status === undefined && typeof chatEnabled !== 'boolean') {
      return NextResponse.json({ error: 'Unsupported update.' }, { status: 400 });
    }

    if (status === 'ENDED') {
      const updated = await endLivestream(livestream.id);
      await recordAuditLog({
        organizationId: user.organizationId,
        actorUserId: user.id,
        action: 'LIVESTREAM_ENDED',
        resourceType: 'Livestream',
        resourceId: livestream.id,
        request
      });
      return NextResponse.json({ livestream: updated });
    }

    if (typeof chatEnabled === 'boolean') {
      const updated = await prisma.livestream.update({ where: { id: livestream.id }, data: { chatEnabled } });
      return NextResponse.json({ livestream: updated });
    }

    return NextResponse.json({ error: 'Unsupported update.' }, { status: 400 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const livestream = await getOrgScopedLivestream(user.organizationId, id);
    if (!livestream) {
      return NextResponse.json({ error: 'Livestream not found.' }, { status: 404 });
    }
    if (livestream.createdByUserId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only the host or an admin can delete this livestream.' }, { status: 403 });
    }
    if (livestream.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Only livestreams that have not started can be deleted. End it instead.' }, { status: 400 });
    }

    await prisma.livestream.delete({ where: { id: livestream.id } });

    await recordAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: 'LIVESTREAM_DELETED',
      resourceType: 'Livestream',
      resourceId: livestream.id,
      request
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
