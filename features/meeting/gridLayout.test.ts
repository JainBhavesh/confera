import { describe, expect, it } from 'vitest';
import { computeGridLayout } from './gridLayout';

describe('computeGridLayout', () => {
  const table: Array<[count: number, cols: number, rows: number[]]> = [
    [1, 1, [1]],
    [2, 2, [2]],
    [3, 3, [3]],
    [4, 4, [4]],
    [5, 3, [3, 2]],
    [6, 3, [3, 3]],
    [7, 4, [4, 3]],
    [8, 4, [4, 4]],
    [9, 3, [3, 3, 3]],
    [10, 4, [4, 4, 2]],
    [11, 4, [4, 4, 3]],
    [12, 4, [4, 4, 4]]
  ];

  it.each(table)('lays out %i participants as cols=%i rows=%j', (count, expectedCols, expectedRows) => {
    const layout = computeGridLayout(count, 4);
    expect(layout.cols).toBe(expectedCols);
    expect(layout.rows).toEqual(expectedRows);
  });

  it('row counts always sum back to the participant count', () => {
    for (let n = 1; n <= 12; n++) {
      const { rows } = computeGridLayout(n, 4);
      expect(rows.reduce((a, b) => a + b, 0)).toBe(n);
    }
  });

  it('never puts more tiles in a row than the computed column count', () => {
    for (let n = 1; n <= 12; n++) {
      const { cols, rows } = computeGridLayout(n, 4);
      rows.forEach((count) => expect(count).toBeLessThanOrEqual(cols));
    }
  });

  it('never strands a single tile in its own row unless there is exactly one participant', () => {
    for (let n = 2; n <= 12; n++) {
      const { rows } = computeGridLayout(n, 4);
      rows.forEach((count) => expect(count).toBeGreaterThan(1));
    }
  });

  it('respects a smaller maxCols for compact viewports', () => {
    expect(computeGridLayout(1, 2)).toEqual({ cols: 1, rows: [1] });
    expect(computeGridLayout(2, 2)).toEqual({ cols: 2, rows: [2] });
    expect(computeGridLayout(3, 2)).toEqual({ cols: 2, rows: [2, 1] });
    expect(computeGridLayout(4, 2)).toEqual({ cols: 2, rows: [2, 2] });
  });

  it('returns an empty layout for zero participants', () => {
    expect(computeGridLayout(0, 4)).toEqual({ cols: 0, rows: [] });
  });
});
