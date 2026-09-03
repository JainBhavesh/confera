'use client';

import { ReactNode, useEffect } from 'react';

export function Dialog({
  open,
  onClose,
  title,
  children
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#2d2b2b]/50 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-[440px] flex-col gap-4 border border-border bg-card p-6 shadow-popover"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-extrabold text-foreground">{title}</h3>
        {children}
      </div>
    </div>
  );
}
