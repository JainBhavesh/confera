export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
        C
      </div>
      <div className="leading-tight">
        <p className="text-base font-semibold text-foreground">Confera</p>
        <p className="text-xs text-muted-foreground">Video meetings</p>
      </div>
    </div>
  );
}
