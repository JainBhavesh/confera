import { API_BASE_URL } from '../../config';
import { apiFetch } from './client';
import type { PublicUser } from '../../types';

export function login(email: string, password: string): Promise<{ user: PublicUser }> {
  return apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function register(input: { name: string; email: string; password: string }): Promise<{ user: PublicUser }> {
  return apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(input) });
}

export function logout(): Promise<void> {
  return apiFetch('/api/auth/logout', { method: 'POST' });
}

// A signed-out visitor gets a 401 here, which is an expected outcome (not a
// failure) — so this bypasses apiFetch's throw-on-!ok behavior and always
// resolves with `{ user: null }` in that case instead of throwing.
export async function getCurrentUser(): Promise<{ user: PublicUser | null }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' });
  const data = await response.json().catch(() => ({ user: null }));
  return { user: data?.user ?? null };
}
