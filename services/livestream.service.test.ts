import { describe, expect, it, vi, beforeEach } from 'vitest';

const { findFirst, findUnique, sessionFindFirst, sessionCreate } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  sessionFindFirst: vi.fn(),
  sessionCreate: vi.fn()
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: { livestream: { findFirst, findUnique }, livestreamViewerSession: { findFirst: sessionFindFirst, create: sessionCreate } }
}));

const { getOrgScopedLivestream, getLivestreamForGuestAccess, joinLivestreamAsViewer } = await import('./livestream.service');

describe('getOrgScopedLivestream', () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it('scopes the lookup to both the livestream id and the organization id', async () => {
    findFirst.mockResolvedValue({ id: 'live-1', organizationId: 'org-1' });

    await getOrgScopedLivestream('org-1', 'live-1');

    expect(findFirst).toHaveBeenCalledWith({ where: { id: 'live-1', organizationId: 'org-1' } });
  });

  it('returns null for a livestream that belongs to another organization (tenant isolation)', async () => {
    findFirst.mockResolvedValue(null);

    const result = await getOrgScopedLivestream('org-attacker', 'live-owned-by-org-victim');

    expect(result).toBeNull();
    expect(findFirst).toHaveBeenCalledWith({ where: { id: 'live-owned-by-org-victim', organizationId: 'org-attacker' } });
  });
});

describe('getLivestreamForGuestAccess', () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it('looks the livestream up by id alone, leaving the visibility check to the caller', async () => {
    findUnique.mockResolvedValue({ id: 'live-1', visibility: 'PUBLIC' });

    const result = await getLivestreamForGuestAccess('live-1');

    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'live-1' } });
    expect(result?.visibility).toBe('PUBLIC');
  });

  it('returns whatever the row is, including a PRIVATE one — the join/messages/recording routes are what reject non-public access', async () => {
    findUnique.mockResolvedValue({ id: 'live-2', visibility: 'PRIVATE' });

    const result = await getLivestreamForGuestAccess('live-2');

    expect(result?.visibility).toBe('PRIVATE');
  });
});

describe('joinLivestreamAsViewer', () => {
  beforeEach(() => {
    sessionFindFirst.mockReset();
    sessionCreate.mockReset();
  });

  it('reuses an already-open session for a member instead of creating a duplicate', async () => {
    const existing = { id: 'session-1', livestreamId: 'live-1', userId: 'user-1', leftAt: null };
    sessionFindFirst.mockResolvedValue(existing);

    const result = await joinLivestreamAsViewer('live-1', { type: 'user', user: { id: 'user-1' } as never });

    expect(sessionFindFirst).toHaveBeenCalledWith({ where: { livestreamId: 'live-1', userId: 'user-1', leftAt: null } });
    expect(sessionCreate).not.toHaveBeenCalled();
    expect(result).toBe(existing);
  });

  it('creates a new session for a member with no open session', async () => {
    sessionFindFirst.mockResolvedValue(null);
    sessionCreate.mockResolvedValue({ id: 'session-2', livestreamId: 'live-1', userId: 'user-1' });

    await joinLivestreamAsViewer('live-1', { type: 'user', user: { id: 'user-1' } as never });

    expect(sessionCreate).toHaveBeenCalledWith({ data: { livestreamId: 'live-1', userId: 'user-1' } });
  });

  it('always creates a fresh session for a guest — no server-known identity to dedupe by', async () => {
    sessionCreate.mockResolvedValue({ id: 'session-3', livestreamId: 'live-1', userId: null, guestName: 'Jordan' });

    await joinLivestreamAsViewer('live-1', { type: 'guest', identity: 'guest-abc', name: 'Jordan' });

    expect(sessionFindFirst).not.toHaveBeenCalled();
    expect(sessionCreate).toHaveBeenCalledWith({ data: { livestreamId: 'live-1', userId: null, guestName: 'Jordan' } });
  });
});
