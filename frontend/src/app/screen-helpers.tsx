import { bandNine, formatMetricDisplay } from "./screen-format";

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
  return (
    <div className="bar-metric">
      <span className="name">{label}</span>
      <div className="bars" role="group" aria-label={label}>
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
          return (
            <button
              key={slot}
              type="button"
              className={["bar", filled ? "filled" : "", filled ? slotBand : ""].filter(Boolean).join(" ")}
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
      <span className={["val", band].filter(Boolean).join(" ")}>{formatMetricDisplay(value, fractionDigits)}</span>
    </div>
  );
}

export function CoffeeStepper({ value, onChange }: { value: number | null; onChange: (next: number | null) => void }) {
  const n = value != null && !Number.isNaN(Number(value)) ? Math.min(50, Math.max(0, Math.floor(Number(value)))) : 0;
  return (
    <div className="bar-metric bar-metric-stepper">
      <span className="name">Coffee</span>
      <span aria-hidden="true" className="bar-metric-spacer" />
      <div className="stepper-group">
        <button type="button" aria-label="Decrease coffee count" onClick={() => onChange(Math.max(0, n - 1))}>
          −
        </button>
        <span className="val" aria-live="polite">
          {value != null ? n : "—"}
        </span>
        <button type="button" aria-label="Increase coffee count" onClick={() => onChange(Math.min(50, n + 1))}>
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
    <div className={compact ? "empty-state empty-state-compact" : "empty-state"}>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-copy">{description}</p>
    </div>
  );
}
