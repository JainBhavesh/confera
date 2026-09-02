import { describe, expect, it, vi, beforeEach } from 'vitest';

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock('@/lib/db/prisma', () => ({
  prisma: { meeting: { findFirst } }
}));

const { getOrgScopedMeeting } = await import('./meeting.service');

describe('getOrgScopedMeeting', () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it('scopes the lookup to both the meeting id and the organization id', async () => {
    findFirst.mockResolvedValue({ id: 'meeting-1', organizationId: 'org-1' });

    await getOrgScopedMeeting('org-1', 'meeting-1');

    expect(findFirst).toHaveBeenCalledWith({ where: { id: 'meeting-1', organizationId: 'org-1' } });
  });

  it('returns null for a meeting that belongs to another organization (tenant isolation)', async () => {
    // Simulates the real Prisma behavior: findFirst with a mismatched
    // organizationId in `where` returns no row, never the other org's meeting.
    findFirst.mockResolvedValue(null);

    const result = await getOrgScopedMeeting('org-attacker', 'meeting-owned-by-org-victim');

    expect(result).toBeNull();
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'meeting-owned-by-org-victim', organizationId: 'org-attacker' }
    });
  });
});
