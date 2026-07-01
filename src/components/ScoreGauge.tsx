interface ScoreGaugeProps {
  label: string;
  value: number; // 0 - 100
  colorClass?: string;
}

/**
 * Petite jauge circulaire pour afficher un score ou un niveau de confiance.
 */
export default function ScoreGauge({ label, value, colorClass = "text-accent-soft" }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border-subtle bg-surface p-5">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} strokeWidth="8" className="fill-none stroke-border-subtle" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            strokeWidth="8"
            strokeLinecap="round"
            className={`fill-none ${colorClass} transition-[stroke-dashoffset] duration-700 ease-out`}
            style={{
              stroke: "currentColor",
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
          {clamped}
        </div>
      </div>
      <span className="text-sm font-medium text-muted">{label}</span>
    </div>
  );
}
