import type { Organization, User } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export interface ResolvedPermissions {
  canCreateMeeting: boolean;
  canCreateLivestream: boolean;
  canGenerateNotes: boolean;
  canViewTranscript: boolean;
  canViewActionItems: boolean;
  canViewRecording: boolean;
}

export const PERMISSION_KEYS = [
  'canCreateMeeting',
  'canCreateLivestream',
  'canGenerateNotes',
  'canViewTranscript',
  'canViewActionItems',
  'canViewRecording'
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

type UserOverrides = Pick<User, 'role' | PermissionKey>;
type OrgDefaults = Pick<
  Organization,
  | 'defaultCanCreateMeeting'
  | 'defaultCanCreateLivestream'
  | 'defaultCanGenerateNotes'
  | 'defaultCanViewTranscript'
  | 'defaultCanViewActionItems'
  | 'defaultCanViewRecording'
>;

const ALL_ALLOWED: ResolvedPermissions = {
  canCreateMeeting: true,
  canCreateLivestream: true,
  canGenerateNotes: true,
  canViewTranscript: true,
  canViewActionItems: true,
  canViewRecording: true
};

/**
 * Resolves a user's effective permissions: their own override if set,
 * otherwise the org's default. Admins are never restricted by these
 * toggles — they're the ones who set them for everyone else.
 */
export function resolvePermissions(user: UserOverrides, organization: OrgDefaults): ResolvedPermissions {
  if (user.role === 'ADMIN') {
    return { ...ALL_ALLOWED };
  }

  return {
    canCreateMeeting: user.canCreateMeeting ?? organization.defaultCanCreateMeeting,
    canCreateLivestream: user.canCreateLivestream ?? organization.defaultCanCreateLivestream,
    canGenerateNotes: user.canGenerateNotes ?? organization.defaultCanGenerateNotes,
    canViewTranscript: user.canViewTranscript ?? organization.defaultCanViewTranscript,
    canViewActionItems: user.canViewActionItems ?? organization.defaultCanViewActionItems,
    canViewRecording: user.canViewRecording ?? organization.defaultCanViewRecording
  };
}

/** Convenience wrapper for route handlers that only have the user, not the org, in hand. */
export async function getResolvedPermissions(user: User): Promise<ResolvedPermissions> {
  if (user.role === 'ADMIN') {
    return { ...ALL_ALLOWED };
  }
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
  return resolvePermissions(user, organization);
}

/**
 * Nulls out fields the viewing user isn't permitted to see. Enforced
 * server-side (not just hidden in the UI) so a lacking permission actually
 * withholds the data rather than just the display of it. Action items live
 * on their own ActionItem rows now and are gated by canViewActionItems at
 * the /api/action-items routes instead of here.
 */
export function redactMeetingNotes<T extends { transcript: string | null; translations: unknown }>(
  notes: T,
  permissions: ResolvedPermissions
): T {
  return {
    ...notes,
    transcript: permissions.canViewTranscript ? notes.transcript : null,
    translations: permissions.canViewTranscript ? notes.translations : null
  };
}
