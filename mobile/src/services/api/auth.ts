import { API_BASE_URL } from '../../config';
import { apiFetch } from './client';
import type { PublicUser } from '../../types';

export function login(email: string, password: string): Promise<{ user: PublicUser }> {
  return apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

// The server expects multipart/form-data (it reads request.formData(), also
// how it accepts an optional avatar upload) — not JSON. It doesn't start a
// session either: registering only sends an email OTP and returns the
// email, so the caller must follow up with verifyEmail() to actually log in.
export function register(input: { name: string; email: string; password: string }): Promise<{ email: string }> {
  const form = new FormData();
  form.append('name', input.name);
  form.append('email', input.email);
  form.append('password', input.password);
  return apiFetch('/api/auth/register', { method: 'POST', body: form });
}

export function verifyEmail(email: string, code: string): Promise<{ user: PublicUser }> {
  return apiFetch('/api/auth/otp/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) });
}

export function requestOtp(
  email: string,
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
): Promise<{ ok: boolean; alreadyVerified?: boolean; cooldownSeconds?: number }> {
  return apiFetch('/api/auth/otp/request', { method: 'POST', body: JSON.stringify({ email, purpose }) });
}

export function resetPassword(email: string, code: string, newPassword: string): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/otp/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword })
  });
}

export function logout(): Promise<void> {
  return apiFetch('/api/auth/logout', { method: 'POST' });
}

export function changePassword(input: { currentPassword: string; newPassword: string }): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/password', { method: 'PATCH', body: JSON.stringify(input) });
}

// A signed-out visitor gets a 401 here, which is an expected outcome (not a
// failure) — so this bypasses apiFetch's throw-on-!ok behavior and always
// resolves with `{ user: null }` in that case instead of throwing.
export async function getCurrentUser(): Promise<{ user: PublicUser | null }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' });
  const data = await response.json().catch(() => ({ user: null }));
  return { user: data?.user ?? null };
}
