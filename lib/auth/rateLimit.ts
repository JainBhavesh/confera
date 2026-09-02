import type { NextRequest } from 'next/server';

// In-memory fixed-window rate limiter. Single-instance only: state resets on
// process restart and isn't shared across horizontally scaled instances. Good
// enough for local/MVP; swap for a shared store (e.g. Redis) before scaling out.

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Max attempts allowed within the window. */
  limit: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

/** Returns true if the request under `key` is allowed, false if it should be rejected. */
export function checkRateLimit(key: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= options.windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (bucket.count >= options.limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function getRequestIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
