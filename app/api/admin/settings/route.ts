import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin, toErrorResponse } from '@/lib/auth/guards';
import { updateSettingsSchema } from '@/lib/validation/schemas';
import { recordAuditLog } from '@/services/audit.service';

const DEFAULT_PERMISSION_FIELDS = [
  'defaultCanCreateMeeting',
  'defaultCanCreateLivestream',
  'defaultCanGenerateNotes',
  'defaultCanViewTranscript',
  'defaultCanViewActionItems'
] as const;

function serializeOrganization(organization: {
  id: string;
  name: string;
  registrationEnabled: boolean;
  publicMeetingsEnabled: boolean;
  defaultCanCreateMeeting: boolean;
  defaultCanCreateLivestream: boolean;
  defaultCanGenerateNotes: boolean;
  defaultCanViewTranscript: boolean;
  defaultCanViewActionItems: boolean;
}) {
  return {
    id: organization.id,
    name: organization.name,
    registrationEnabled: organization.registrationEnabled,
    publicMeetingsEnabled: organization.publicMeetingsEnabled,
    defaultCanCreateMeeting: organization.defaultCanCreateMeeting,
    defaultCanCreateLivestream: organization.defaultCanCreateLivestream,
    defaultCanGenerateNotes: organization.defaultCanGenerateNotes,
    defaultCanViewTranscript: organization.defaultCanViewTranscript,
    defaultCanViewActionItems: organization.defaultCanViewActionItems
  };
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    const organization = await prisma.organization.findUniqueOrThrow({ where: { id: admin.organizationId } });
    return NextResponse.json({ organization: serializeOrganization(organization) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json().catch(() => null);
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid settings update.' }, { status: 400 });
    }

    const organization = await prisma.organization.update({
      where: { id: admin.organizationId },
      data: parsed.data
    });

    if (parsed.data.registrationEnabled !== undefined) {
      await recordAuditLog({
        organizationId: admin.organizationId,
        actorUserId: admin.id,
        action: parsed.data.registrationEnabled ? 'REGISTRATION_ENABLED' : 'REGISTRATION_DISABLED',
        resourceType: 'Organization',
        resourceId: organization.id,
        request
      });
    }

    if (parsed.data.publicMeetingsEnabled !== undefined) {
      await recordAuditLog({
        organizationId: admin.organizationId,
        actorUserId: admin.id,
        action: parsed.data.publicMeetingsEnabled ? 'PUBLIC_MEETINGS_ENABLED' : 'PUBLIC_MEETINGS_DISABLED',
        resourceType: 'Organization',
        resourceId: organization.id,
        request
      });
    }

    const changedDefaultPermissions = DEFAULT_PERMISSION_FIELDS.filter((key) => parsed.data[key] !== undefined);
    if (changedDefaultPermissions.length > 0) {
      await recordAuditLog({
        organizationId: admin.organizationId,
        actorUserId: admin.id,
        action: 'DEFAULT_PERMISSIONS_UPDATED',
        resourceType: 'Organization',
        resourceId: organization.id,
        metadata: { changed: changedDefaultPermissions },
        request
      });
    }

    return NextResponse.json({ organization: serializeOrganization(organization) });
  } catch (err) {
    return toErrorResponse(err);
  }
}
