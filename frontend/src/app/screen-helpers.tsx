import { bandNine, formatMetricDisplay } from "./screen-format";

const STEPPER_BTN =
  "w-6 h-6 min-h-6 p-0 text-sm text-muted bg-transparent border border-[var(--border-soft)] rounded-full shadow-none cursor-pointer transition-[color,border-color] duration-150 ease-[ease] hover:text-accent hover:bg-transparent hover:border-accent";

export function BarMetric({
  label,
  value,
  onChange,
  fractionDigits = 0,
  higherIsBetter = false,
}: {
  label: string;
  value: number | null;
  onChange: (next: number | null) => void;
  fractionDigits?: number;
  /** When true, higher scores use success styling and lower scores use warning/danger (e.g. mood). */
  higherIsBetter?: boolean;
}) {
  const n =
    value != null && !Number.isNaN(Number(value)) ? Math.min(9, Math.max(1, Math.round(Number(value)))) : null;
  const band = bandNine(n, higherIsBetter);
  const bandColor = { low: "text-success", mid: "text-warning", high: "text-danger", "": "" }[band] ?? "";
  return (
    <div className="grid grid-cols-[120px_1fr_auto] items-center gap-3 pb-[2px]">
      <span className="text-control font-medium text-text">{label}</span>
      <div className="grid grid-cols-9 gap-[2px]" role="group" aria-label={label}>
        {Array.from({ length: 9 }, (_, i) => {
          const slot = i + 1;
          const filled = n != null && slot <= n;
          const slotBand = higherIsBetter
            ? slot <= 3
              ? "high"
              : slot <= 6
                ? "mid"
                : "low"
            : slot <= 3
              ? "low"
              : slot <= 6
                ? "mid"
                : "high";
          const fill = filled
            ? { low: "bg-success", mid: "bg-warning", high: "bg-danger" }[slotBand]
            : "bg-[color-mix(in_srgb,white_4%,var(--card))] hover:bg-[color-mix(in_srgb,white_10%,var(--card))]";
          return (
            <button
              key={slot}
              type="button"
              className={`h-2.5 min-h-2.5 p-0 border-0 rounded-xs shadow-none cursor-pointer transition-[background] duration-[120ms] appearance-none ${fill}`}
              aria-label={`${label} ${slot} of 9`}
              aria-pressed={n === slot}
              onClick={() => {
                if (n != null && slot === n) onChange(null);
                else onChange(slot);
              }}
            />
          );
        })}
      </div>
      <span className={`font-bold text-sm font-mono text-text min-w-[38px] text-right tabular-nums tracking-[0.01em] ${bandColor}`}>{formatMetricDisplay(value, fractionDigits)}</span>
    </div>
  );
}

export function CoffeeStepper({ value, onChange }: { value: number | null; onChange: (next: number | null) => void }) {
  const n = value != null && !Number.isNaN(Number(value)) ? Math.min(50, Math.max(0, Math.floor(Number(value)))) : 0;
  return (
    <div className="grid grid-cols-[120px_1fr_auto] items-center gap-3 pb-[2px]">
      <span className="text-control font-medium text-text">Coffee</span>
      <span aria-hidden="true" className="h-2.5 min-h-2.5 bg-[color-mix(in_srgb,white_4%,var(--card))] rounded-xs" />
      <div className="inline-flex items-center gap-2">
        <button type="button" className={STEPPER_BTN} aria-label="Decrease coffee count" onClick={() => onChange(Math.max(0, n - 1))}>
          −
        </button>
        <span className="text-center font-bold text-sm font-mono text-text min-w-[18px] tabular-nums" aria-live="polite">
          {value != null ? n : "—"}
        </span>
        <button type="button" className={STEPPER_BTN} aria-label="Increase coffee count" onClick={() => onChange(Math.min(50, n + 1))}>
          +
        </button>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  compact = false,
}: {
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "grid gap-2 m-0" : "grid gap-2 my-3"}>
      <p className="text-control font-semibold text-text m-0">{title}</p>
      <p className="max-w-[60ch] text-control text-muted leading-normal m-0">{description}</p>
    </div>
  );
}
