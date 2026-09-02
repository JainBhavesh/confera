import { describe, expect, it } from 'vitest';
import { clampPage, getPageSlice, getTotalPages, PARTICIPANTS_PER_PAGE } from './pagination';

describe('getTotalPages', () => {
  it('fits exactly 12 on one page', () => {
    expect(getTotalPages(1)).toBe(1);
    expect(getTotalPages(12)).toBe(1);
  });

  it('spills to a second page at 13', () => {
    expect(getTotalPages(13)).toBe(2);
    expect(getTotalPages(24)).toBe(2);
  });

  it('spills to a third page at 25', () => {
    expect(getTotalPages(25)).toBe(3);
  });

  it('handles large meetings', () => {
    expect(getTotalPages(100)).toBe(9);
    expect(getTotalPages(2000)).toBe(167);
  });
});

describe('getPageSlice', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it('returns participants 1-12 on page 1', () => {
    expect(getPageSlice(items, 1)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it('returns participants 13-24 on page 2', () => {
    expect(getPageSlice(items, 2)).toEqual(Array.from({ length: 12 }, (_, i) => i + 13));
  });

  it('returns just participant 25 on the adaptive last page', () => {
    expect(getPageSlice(items, 3)).toEqual([25]);
  });

  it('never returns more than PARTICIPANTS_PER_PAGE items', () => {
    const massive = Array.from({ length: 2000 }, (_, i) => i);
    expect(getPageSlice(massive, 1).length).toBe(PARTICIPANTS_PER_PAGE);
  });
});

describe('clampPage', () => {
  it('preserves the current page when it is still valid', () => {
    expect(clampPage(1, 5)).toBe(1);
    expect(clampPage(3, 5)).toBe(3);
  });

  it('pulls back to the last valid page when a trailing page disappears (scenario E)', () => {
    expect(clampPage(3, 2)).toBe(2);
  });

  it('pulls back to page 1 when only one page remains (scenario D)', () => {
    expect(clampPage(2, 1)).toBe(1);
  });

  it('never returns less than page 1', () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(-3, 5)).toBe(1);
  });
});
