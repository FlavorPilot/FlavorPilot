export function ScoreGauge({
  score,
  label,
  size = "large"
}: {
  score: number;
  label: string;
  size?: "small" | "large";
}) {
  const safeScore = Math.max(0, Math.min(100, score));
  const dimensions = size === "large" ? "h-36 w-36" : "h-20 w-20";
  const inner = size === "large" ? "inset-[10px]" : "inset-[7px]";
  const number = size === "large" ? "text-4xl" : "text-xl";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative grid ${dimensions} place-items-center rounded-full`}
        style={{
          background: `conic-gradient(#b8f36b ${safeScore * 3.6}deg, rgba(255,255,255,.075) 0deg)`
        }}
        aria-label={`${label}: ${score}`}
      >
        <div className={`absolute ${inner} rounded-full bg-[#121713]`} />
        <div className="relative text-center">
          <strong className={`${number} font-black tracking-tight text-white`}>{score}</strong>
          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">/ 100</span>
        </div>
      </div>
      <span className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-white/52">
        {label}
      </span>
    </div>
  );
}
