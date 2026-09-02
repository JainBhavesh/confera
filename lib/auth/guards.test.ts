import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { User } from '@prisma/client';

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock('@/lib/auth/session', () => ({ getCurrentUser }));

const { requireUser, requireAdmin, AuthError, toErrorResponse } = await import('./guards');

function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    organizationId: 'org-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed',
    role: 'USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as User;
}

describe('requireUser', () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
  });

  it('returns the user when authenticated', async () => {
    getCurrentUser.mockResolvedValue(fakeUser());
    const user = await requireUser();
    expect(user.id).toBe('user-1');
  });

  it('throws a 401 AuthError when there is no session', async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(requireUser()).rejects.toMatchObject({ status: 401 });
  });
});

describe('requireAdmin', () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
  });

  it('returns the user when they are an admin', async () => {
    getCurrentUser.mockResolvedValue(fakeUser({ role: 'ADMIN' }));
    const user = await requireAdmin();
    expect(user.role).toBe('ADMIN');
  });

  it('throws a 403 AuthError for a non-admin user', async () => {
    getCurrentUser.mockResolvedValue(fakeUser({ role: 'USER' }));
    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
  });

  it('throws a 401 AuthError when there is no session at all', async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
  });
});

describe('toErrorResponse', () => {
  it('maps AuthError to its status and message', async () => {
    const response = toErrorResponse(new AuthError('Forbidden', 403));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Forbidden');
  });

  it('maps unknown errors to a 500 without leaking details', async () => {
    const response = toErrorResponse(new Error('some internal detail'));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Internal server error');
  });
});
