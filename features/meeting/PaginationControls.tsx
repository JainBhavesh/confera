'use client';

import { useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons/MeetingIcons';
import { Tooltip } from '@/components/ui/Tooltip';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function PaginationControls({ page, totalPages, onPrev, onNext }: PaginationControlsProps) {
  // ArrowLeft/ArrowRight navigate pages, but never while the user is typing
  // somewhere else on the page (e.g. the chat input) — the pagination isn't
  // focused, so a global listener has to actively avoid stealing those keys.
  useEffect(() => {
    if (totalPages <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isTyping) return;

      if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, onPrev, onNext]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex shrink-0 items-center justify-center gap-3">
      <Tooltip label="Previous page">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center bg-[#2d2b2b] text-white transition hover:bg-[#3d3a3a] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      </Tooltip>
      <span className="bg-[#2d2b2b] px-3 py-1.5 text-sm font-medium text-white">
        {page} / {totalPages}
      </span>
      <Tooltip label="Next page">
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center bg-[#2d2b2b] text-white transition hover:bg-[#3d3a3a] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>
  );
}
