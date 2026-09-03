export function ViewerCountBadge({ count }: { count: number }) {
  return (
    <span className="bg-[#141312]/85 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur">
      {count === 1 ? '1 viewer' : `${count} viewers`}
    </span>
  );
}
