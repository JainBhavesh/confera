import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}

export function Card({ children, className = '', interactive = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card text-card-foreground shadow-card transition dark:shadow-card-dark ${
        interactive ? 'hover:border-primary/40 hover:shadow-popover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
