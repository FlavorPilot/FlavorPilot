export function ProfileBar({ label, value }: { label: string; value: number }) {
  const percent = Math.max(0, Math.min(100, value * 10));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-white/64">{label}</span>
        <span className="tabular-nums text-white/40">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.055]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#6ea63b] to-[#b8f36b] transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
