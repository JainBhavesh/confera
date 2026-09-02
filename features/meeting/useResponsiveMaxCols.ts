import { useEffect, useState } from 'react';

// Mirrors the app's own sm(640)/lg(1024) breakpoints. Desktop keeps the
// spec's 4-column ceiling; tablet and mobile step down so tiles stay usable
// rather than shrinking to fit a column count that only makes sense on a
// wide screen.
function resolveMaxCols(width: number): number {
  if (width < 640) return 2;
  if (width < 1024) return 3;
  return 4;
}

export function useResponsiveMaxCols(): number {
  const [maxCols, setMaxCols] = useState(() => (typeof window === 'undefined' ? 4 : resolveMaxCols(window.innerWidth)));

  useEffect(() => {
    const handleResize = () => setMaxCols(resolveMaxCols(window.innerWidth));
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return maxCols;
}
