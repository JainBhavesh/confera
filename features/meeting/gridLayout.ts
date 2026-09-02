export interface GridLayout {
  /** Columns in the widest row — CSS should size every tile as 1/cols of the row it's in. */
  cols: number;
  /** Tile count per row, top to bottom. Sums to the participant count passed in. */
  rows: number[];
}

/**
 * Balanced gallery-grid layout for up to `maxCols` columns. Picks the fewest
 * rows possible within maxCols, then the fewest columns that still achieves
 * that row count — which is what keeps rows even (3+3 instead of 4+2, 4+3
 * instead of 3+3+1) and avoids ever stranding a single tile in its own row
 * unless there's truly only one participant.
 */
export function computeGridLayout(count: number, maxCols = 4): GridLayout {
  if (count <= 0) return { cols: 0, rows: [] };

  const clampedMaxCols = Math.max(1, maxCols);
  const minRows = Math.ceil(count / clampedMaxCols);
  const cols = Math.ceil(count / minRows);

  const rows: number[] = [];
  let remaining = count;
  for (let i = 0; i < minRows; i++) {
    const inRow = Math.min(cols, remaining);
    rows.push(inRow);
    remaining -= inRow;
  }

  return { cols, rows };
}
