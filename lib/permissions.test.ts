import { describe, expect, it, vi, beforeEach } from 'vitest';

const { findUniqueOrThrow } = vi.hoisted(() => ({ findUniqueOrThrow: vi.fn() }));

vi.mock('@/lib/db/prisma', () => ({
  prisma: { organization: { findUniqueOrThrow } }
}));

const { resolvePermissions, getResolvedPermissions, redactMeetingNotes } = await import('./permissions');

const orgDefaults = {
  defaultCanCreateMeeting: true,
  defaultCanCreateLivestream: true,
  defaultCanGenerateNotes: false,
  defaultCanViewTranscript: true,
  defaultCanViewActionItems: true,
  defaultCanViewRecording: true
};

function user(overrides: Record<string, unknown> = {}) {
  return {
    role: 'USER',
    canCreateMeeting: null,
    canCreateLivestream: null,
    canGenerateNotes: null,
    canViewTranscript: null,
    canViewActionItems: null,
    canViewRecording: null,
    ...overrides
  } as never;
}

describe('resolvePermissions', () => {
  it('falls back to the org default when the user has no override', () => {
    const result = resolvePermissions(user(), orgDefaults);
    expect(result.canCreateMeeting).toBe(true);
    expect(result.canGenerateNotes).toBe(false);
  });

  it("a user's explicit override wins over the org default", () => {
    const result = resolvePermissions(user({ canGenerateNotes: true, canCreateMeeting: false }), orgDefaults);
    expect(result.canGenerateNotes).toBe(true);
    expect(result.canCreateMeeting).toBe(false);
  });

  it('admins always have every permission, regardless of overrides or org defaults', () => {
    const result = resolvePermissions(
      user({ role: 'ADMIN', canCreateMeeting: false, canGenerateNotes: false }),
      { ...orgDefaults, defaultCanCreateMeeting: false, defaultCanGenerateNotes: false }
    );
    expect(result).toEqual({
      canCreateMeeting: true,
      canCreateLivestream: true,
      canGenerateNotes: true,
      canViewTranscript: true,
      canViewActionItems: true,
      canViewRecording: true
    });
  });
});

describe('getResolvedPermissions', () => {
  beforeEach(() => {
    findUniqueOrThrow.mockReset();
  });

  it('fetches the org and resolves against it for a regular user', async () => {
    findUniqueOrThrow.mockResolvedValue(orgDefaults);

    const result = await getResolvedPermissions(user({ organizationId: 'org-1' }));

    expect(findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'org-1' } });
    expect(result.canGenerateNotes).toBe(false);
  });

  it('skips the org lookup entirely for admins', async () => {
    const result = await getResolvedPermissions(user({ role: 'ADMIN' }));

    expect(findUniqueOrThrow).not.toHaveBeenCalled();
    expect(result.canCreateMeeting).toBe(true);
  });
});

describe('redactMeetingNotes', () => {
  const notes = { transcript: 'full transcript', translations: { es: 'transcripción completa' }, summary: 'a summary' };

  it('passes the transcript and translations through when permitted', () => {
    const result = redactMeetingNotes(notes, { canViewTranscript: true } as never);
    expect(result.transcript).toBe('full transcript');
    expect(result.translations).toEqual(notes.translations);
  });

  it('nulls out the transcript and translations when not permitted', () => {
    const result = redactMeetingNotes(notes, { canViewTranscript: false } as never);
    expect(result.transcript).toBeNull();
    expect(result.translations).toBeNull();
    expect(result.summary).toBe('a summary');
  });
});
