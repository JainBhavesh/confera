import type { User } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { uploadAvatarFromUrl } from '@/lib/avatarStorage';
import { getPublicOrganization } from '@/services/org.service';

export type OAuthProviderName = 'google' | 'facebook';

interface OAuthProfile {
  provider: OAuthProviderName;
  providerId: string;
  email: string;
  name: string;
  avatarSourceUrl?: string | null;
}

export type OAuthSignInResult =
  | { status: 'ok'; user: User }
  | { status: 'registration_disabled' }
  | { status: 'account_disabled' }
  | { status: 'linked_to_other_provider' };

/**
 * Single entry point for both "Continue with Google" and "Continue with
 * Facebook": matches an existing account by email (providers only ever hand
 * us a verified email, so this is safe to trust), links this provider to it
 * if it's not already linked elsewhere, or creates a brand-new account —
 * mirroring the same org-resolution and registration-enabled gate normal
 * email/password signup uses.
 */
export async function signInWithOAuth(profile: OAuthProfile): Promise<OAuthSignInResult> {
  const email = profile.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (!existing.isActive) return { status: 'account_disabled' };

    // Already linked to a *different* provider account — don't silently
    // relink to a new external identity out from under the existing one.
    if (existing.oauthProvider && (existing.oauthProvider !== profile.provider || existing.oauthId !== profile.providerId)) {
      return { status: 'linked_to_other_provider' };
    }

    if (existing.oauthProvider === profile.provider && existing.oauthId === profile.providerId) {
      return { status: 'ok', user: existing };
    }

    // First time this (previously password-only) account signs in via OAuth — link it.
    const avatarUrl = existing.avatarUrl ?? (profile.avatarSourceUrl ? await uploadAvatarFromUrl(profile.avatarSourceUrl) : null);
    const linked = await prisma.user.update({
      where: { id: existing.id },
      data: {
        oauthProvider: profile.provider,
        oauthId: profile.providerId,
        emailVerified: true,
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        avatarUrl
      }
    });
    return { status: 'ok', user: linked };
  }

  const organization = await getPublicOrganization();
  if (!organization || !organization.registrationEnabled) {
    return { status: 'registration_disabled' };
  }

  const avatarUrl = profile.avatarSourceUrl ? await uploadAvatarFromUrl(profile.avatarSourceUrl) : null;

  const created = await prisma.user.create({
    data: {
      organizationId: organization.id,
      name: profile.name,
      email,
      passwordHash: null,
      role: 'USER',
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      avatarUrl,
      oauthProvider: profile.provider,
      oauthId: profile.providerId
    }
  });

  return { status: 'ok', user: created };
}
