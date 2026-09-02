import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser, toErrorResponse } from '@/lib/auth/guards';
import { createMeetingSchema } from '@/lib/validation/schemas';
import { createMeeting } from '@/services/meeting.service';
import { recordAuditLog } from '@/services/audit.service';
import { getResolvedPermissions } from '@/lib/permissions';

// "My meetings": meetings this user created or has ever joined — not the
// full org list (that's the admin-only /admin/meetings view).
export async function GET() {
  try {
    const user = await requireUser();

    const meetings = await prisma.meeting.findMany({
      where: {
        organizationId: user.organizationId,
        OR: [{ createdByUserId: user.id }, { participantSessions: { some: { userId: user.id } } }]
      },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true } } }
    });

    return NextResponse.json({ meetings });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    const permissions = await getResolvedPermissions(user);
    if (!permissions.canCreateMeeting) {
      return NextResponse.json({ error: 'You do not have permission to create meetings.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid meeting details.' }, { status: 400 });
    }

    const meeting = await createMeeting({
      organizationId: user.organizationId,
      createdByUserId: user.id,
      title: parsed.data.title
    });

    await recordAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: 'MEETING_CREATED',
      resourceType: 'Meeting',
      resourceId: meeting.id,
      request
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
