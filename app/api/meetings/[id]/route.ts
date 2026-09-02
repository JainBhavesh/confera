import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { getOrgScopedMeeting, endMeeting } from '@/services/meeting.service';
import { recordAuditLog } from '@/services/audit.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const meeting = await getOrgScopedMeeting(user.organizationId, id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    return NextResponse.json({ meeting });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const meeting = await getOrgScopedMeeting(user.organizationId, id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }
    if (meeting.createdByUserId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only the host or an admin can update this meeting.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const status = body && typeof body === 'object' ? (body as { status?: unknown }).status : undefined;

    if (status === 'ENDED') {
      const updated = await endMeeting(meeting.id);
      return NextResponse.json({ meeting: updated });
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

    const meeting = await getOrgScopedMeeting(user.organizationId, id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }
    if (meeting.createdByUserId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only the host or an admin can delete this meeting.' }, { status: 403 });
    }
    if (meeting.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Only meetings that have not started can be deleted. End the meeting instead.' }, { status: 400 });
    }

    await prisma.meeting.delete({ where: { id: meeting.id } });

    await recordAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: 'MEETING_DELETED',
      resourceType: 'Meeting',
      resourceId: meeting.id,
      request
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
