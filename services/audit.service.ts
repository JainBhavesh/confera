import type { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_DISABLED'
  | 'USER_ENABLED'
  | 'REGISTRATION_ENABLED'
  | 'REGISTRATION_DISABLED'
  | 'PUBLIC_MEETINGS_ENABLED'
  | 'PUBLIC_MEETINGS_DISABLED'
  | 'MEETING_CREATED'
  | 'MEETING_DELETED'
  | 'MEETING_INVITES_SENT'
  | 'PARTICIPANT_MUTED'
  | 'PARTICIPANT_UNMUTED'
  | 'LIVESTREAM_CREATED'
  | 'LIVESTREAM_DELETED'
  | 'LIVESTREAM_ENDED'
  | 'LIVESTREAM_FORCE_ENDED'
  | 'CHAT_MESSAGE_DELETED'
  | 'ACTION_ITEM_CREATED'
  | 'ACTION_ITEM_UPDATED'
  | 'ACTION_ITEM_DELETED'
  | 'USER_PERMISSIONS_UPDATED'
  | 'DEFAULT_PERMISSIONS_UPDATED';

interface RecordAuditLogInput {
  organizationId: string;
  actorUserId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
}

export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadataJson: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      ipAddress: input.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: input.request?.headers.get('user-agent') ?? undefined
    }
  });
}
