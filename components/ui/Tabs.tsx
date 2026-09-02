'use client';

import type { ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
}

export function Tabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            active === tab.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ id, active, children }: { id: string; active: string; children: ReactNode }) {
  if (id !== active) return null;
  return <div className="pt-4">{children}</div>;
}
