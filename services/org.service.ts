import type { Organization } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

/**
 * Resolves the organization that the public /register page signs new users
 * up into. This app is bootstrapped with a single organization (see
 * prisma/seed.ts) — multi-org signup/subdomain routing is a future addition.
 * Prefers SEED_ORG_SLUG when set, otherwise falls back to the
 * earliest-created organization.
 */
export async function getPublicOrganization(): Promise<Organization | null> {
  const slug = process.env.SEED_ORG_SLUG;
  if (slug) {
    const bySlug = await prisma.organization.findUnique({ where: { slug } });
    if (bySlug) return bySlug;
  }
  return prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } });
}
