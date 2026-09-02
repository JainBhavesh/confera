import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { createActionItemSchema } from '@/lib/validation/schemas';
import { getOrgScopedMeeting, isMeetingHost } from '@/services/meeting.service';
import { getResolvedPermissions } from '@/lib/permissions';
import { recordAuditLog } from '@/services/audit.service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();

    const permissions = await getResolvedPermissions(user);
    if (!permissions.canViewActionItems) {
      return NextResponse.json({ error: 'You do not have permission to view action items.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId') ?? undefined;
    const status = searchParams.get('status') ?? undefined;
    const assignedToUserId = searchParams.get('assignedToUserId') ?? undefined;

    const actionItems = await prisma.actionItem.findMany({
      where: {
        organizationId: user.organizationId,
        ...(meetingId ? { meetingId } : {}),
        ...(status ? { status: status as never } : {}),
        ...(assignedToUserId ? { assignedToUserId } : {})
      },
      orderBy: { createdAt: 'desc' },
      include: {
        meeting: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ actionItems });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    const body = await request.json().catch(() => null);
    const parsed = createActionItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid action item.' }, { status: 400 });
    }

    const meeting = await getOrgScopedMeeting(user.organizationId, parsed.data.meetingId);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }
    if (!isMeetingHost(meeting, user)) {
      return NextResponse.json({ error: 'Only the meeting host or an admin can add action items.' }, { status: 403 });
    }

    const actionItem = await prisma.actionItem.create({
      data: {
        organizationId: user.organizationId,
        meetingId: meeting.id,
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: parsed.data.dueDate,
        assignedToUserId: parsed.data.assignedToUserId,
        source: 'MANUAL'
      },
      include: { meeting: { select: { id: true, title: true } }, assignedTo: { select: { id: true, name: true } } }
    });

    await recordAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: 'ACTION_ITEM_CREATED',
      resourceType: 'ActionItem',
      resourceId: actionItem.id,
      metadata: { meetingId: meeting.id },
      request
    });

    return NextResponse.json({ actionItem }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
