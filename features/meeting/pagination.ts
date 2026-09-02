export const PARTICIPANTS_PER_PAGE = 12;

export function getTotalPages(count: number, pageSize = PARTICIPANTS_PER_PAGE): number {
  return Math.max(1, Math.ceil(count / pageSize));
}

/** Keeps `page` on the current page when still valid, otherwise pulls it back to the nearest valid page. */
export function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

export function getPageSlice<T>(items: T[], page: number, pageSize = PARTICIPANTS_PER_PAGE): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
