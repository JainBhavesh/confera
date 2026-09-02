import { ReactNode } from 'react';
import { computeGridLayout } from './gridLayout';

interface ParticipantGridProps<T> {
  items: T[];
  maxCols: number;
  getKey: (item: T) => string;
  renderTile: (item: T) => ReactNode;
}

/**
 * Pure layout: arranges up to a page's worth of items into balanced rows
 * (see gridLayout.ts) using flex rather than CSS grid, since row widths
 * vary (e.g. 5 participants is a 3-row then a 2-row, not a uniform grid).
 * Knows nothing about LiveKit or any other video SDK — renderTile decides
 * what a tile actually shows, so this same component drives both the real
 * call view and mock/test data.
 */
export function ParticipantGrid<T>({ items, maxCols, getKey, renderTile }: ParticipantGridProps<T>) {
  const { rows } = computeGridLayout(items.length, maxCols);

  let cursor = 0;
  const rowsWithItems = rows.map((rowSize) => {
    const rowItems = items.slice(cursor, cursor + rowSize);
    cursor += rowSize;
    return rowItems;
  });

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-2">
      {rowsWithItems.map((rowItems, rowIndex) => (
        <div key={rowIndex} className="flex min-h-0 flex-1 gap-2">
          {rowItems.map((item) => (
            <div key={getKey(item)} className="min-w-0 min-h-0 flex-1">
              {renderTile(item)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
