import { useCallback, useEffect, useState } from 'react';
import { clampPage, getPageSlice, getTotalPages, PARTICIPANTS_PER_PAGE } from './pagination';

export function useParticipantPagination<T>(items: T[], pageSize = PARTICIPANTS_PER_PAGE) {
  const [page, setPage] = useState(1);
  const totalPages = getTotalPages(items.length, pageSize);

  // Re-clamps whenever the participant count changes the number of pages —
  // e.g. the current page's last participant leaves (scenario E) or the
  // meeting drops back under one page's worth (scenario D). A page that's
  // still valid is left untouched (scenario: "preserve the current page").
  useEffect(() => {
    setPage((prev) => clampPage(prev, totalPages));
  }, [totalPages]);

  const clampedPage = clampPage(page, totalPages);
  const pageItems = getPageSlice(items, clampedPage, pageSize);

  const goToPage = useCallback((next: number) => setPage(clampPage(next, getTotalPages(items.length, pageSize))), [items.length, pageSize]);
  const nextPage = useCallback(() => setPage((prev) => clampPage(prev + 1, getTotalPages(items.length, pageSize))), [items.length, pageSize]);
  const prevPage = useCallback(() => setPage((prev) => clampPage(prev - 1, getTotalPages(items.length, pageSize))), [items.length, pageSize]);

  return { page: clampedPage, totalPages, pageItems, goToPage, nextPage, prevPage };
}
