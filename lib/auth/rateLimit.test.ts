import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit } from './rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows attempts up to the limit', () => {
    const key = 'test:allow';
    for (let i = 0; i < 3; i += 1) {
      expect(checkRateLimit(key, { limit: 3, windowMs: 1000 })).toBe(true);
    }
  });

  it('blocks once the limit is exceeded within the window', () => {
    const key = 'test:block';
    for (let i = 0; i < 3; i += 1) {
      checkRateLimit(key, { limit: 3, windowMs: 1000 });
    }
    expect(checkRateLimit(key, { limit: 3, windowMs: 1000 })).toBe(false);
  });

  it('resets once the window elapses', () => {
    const key = 'test:reset';
    for (let i = 0; i < 3; i += 1) {
      checkRateLimit(key, { limit: 3, windowMs: 1000 });
    }
    expect(checkRateLimit(key, { limit: 3, windowMs: 1000 })).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(checkRateLimit(key, { limit: 3, windowMs: 1000 })).toBe(true);
  });

  it('tracks separate keys independently', () => {
    for (let i = 0; i < 3; i += 1) {
      checkRateLimit('test:a', { limit: 3, windowMs: 1000 });
    }
    expect(checkRateLimit('test:a', { limit: 3, windowMs: 1000 })).toBe(false);
    expect(checkRateLimit('test:b', { limit: 3, windowMs: 1000 })).toBe(true);
  });
});
