import type { User } from '@prisma/client';

export interface PublicUser {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: User['role'];
  isActive: boolean;
  emailVerified: boolean;
  avatarUrl: string | null;
  oauthProvider: string | null;
  createdAt: Date;
  // Permission overrides — null means "inherit the org default" (see lib/permissions.ts).
  canCreateMeeting: boolean | null;
  canCreateLivestream: boolean | null;
  canGenerateNotes: boolean | null;
  canViewTranscript: boolean | null;
  canViewActionItems: boolean | null;
  canViewRecording: boolean | null;
}

/** Strips sensitive fields (passwordHash) before a user record leaves the server. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    organizationId: user.organizationId,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    oauthProvider: user.oauthProvider,
    createdAt: user.createdAt,
    canCreateMeeting: user.canCreateMeeting,
    canCreateLivestream: user.canCreateLivestream,
    canGenerateNotes: user.canGenerateNotes,
    canViewTranscript: user.canViewTranscript,
    canViewActionItems: user.canViewActionItems,
    canViewRecording: user.canViewRecording
  };
}
