export function ViewerCountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-slate-950/85 px-3 py-1.5 text-xs font-semibold text-white">
      {count === 1 ? '1 viewer' : `${count} viewers`}
    </span>
  );
}
