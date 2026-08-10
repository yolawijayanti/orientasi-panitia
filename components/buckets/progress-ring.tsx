/**
 * Donut progress: lingkaran SVG dengan stroke-dasharray sebagai "isian".
 * Dibuat manual (bukan library chart) karena project ini tidak punya
 * dependency chart apapun -- pola yang sama seperti Gantt di Fase 3.
 */
export function ProgressRing({
  percent,
  size = 132,
  strokeWidth = 12,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          className="stroke-blue-600 transition-[stroke-dasharray]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{clamped}%</span>
      </div>
    </div>
  );
}
