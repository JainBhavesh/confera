// Shared, client-safe permission metadata for the admin UI. Deliberately
// separate from lib/permissions.ts, which imports the Prisma client and
// isn't safe to pull into a 'use client' bundle.

export const PERMISSION_KEYS = [
  'canCreateMeeting',
  'canCreateLivestream',
  'canGenerateNotes',
  'canViewTranscript',
  'canViewActionItems',
  'canViewRecording'
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type PermissionMap = Record<PermissionKey, boolean>;

export const PERMISSION_LABELS: Record<PermissionKey, { title: string; description: string }> = {
  canCreateMeeting: { title: 'Create meetings', description: 'Can start new meetings.' },
  canCreateLivestream: { title: 'Create livestreams', description: 'Can start new livestreams.' },
  canGenerateNotes: { title: 'Generate AI meeting notes', description: 'Can request an AI-generated summary and action items for meetings they host.' },
  canViewTranscript: { title: 'View meeting transcripts', description: 'The full transcript is shown alongside AI notes.' },
  canViewActionItems: { title: 'View action items', description: 'Action items are shown alongside AI notes.' },
  canViewRecording: { title: 'View meeting recordings', description: 'Can play back a meeting\'s recorded audio.' }
};

/** PATCH /api/admin/settings expects defaultCanCreateMeeting, not canCreateMeeting. */
export function toSettingsField(key: PermissionKey): string {
  return `default${key[0].toUpperCase()}${key.slice(1)}`;
}
