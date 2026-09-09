import { API_BASE_URL } from '../../config';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Thin fetch wrapper for the Next.js API. `credentials: 'include'` matters
 * here: the web app's session is an httpOnly cookie (see lib/auth/session.ts
 * in the web project), and React Native's fetch — unlike browser fetch — is
 * backed by the platform's native networking stack, which persists cookies
 * across requests. That lets mobile reuse the exact same session mechanism
 * as web with no token-based rework.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // A FormData body (multipart/form-data, e.g. register()) must NOT get a
  // forced Content-Type here — fetch needs to set its own header carrying
  // the multipart boundary, which we can't compute ourselves.
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.error ?? 'Request failed.', response.status);
  }

  return data as T;
}
