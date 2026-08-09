import { type CSSProperties, lazy, Suspense } from "react";
import type { WellbeingChartView } from "./WellbeingChart";
import {
  type DashboardConnection,
  type DashboardInsight,
  type MemorableDay,
  type DashboardQuickRange,
  type WellbeingSeries,
  type WellbeingSeriesKey,
  calcDeltaPercent,
  dashboardQuickRanges,
  formatDelta,
  getDeltaStyle,
} from "./core";
import { SectionHead } from "./shared";
import { EmptyState } from "./screen-helpers";
import { CARD_GRID, DASH_CARD, CARD_H3, CARD_VALUE } from "./cards";
import { FIELD_LINE_LABEL } from "../components/ui/FieldLine";
import { DateInput } from "../components/ui/DateInput";

const WellbeingChart = lazy(() => import("./WellbeingChart"));

const DELTA_SLOT = "min-h-6 flex items-end translate-y-0.5";
const DELTA_BASE = "inline-flex items-center rounded-full px-2 py-0.5 text-micro font-bold self-end";
const QUICK_RANGE_BASE =
  "px-3 py-1 text-xs font-semibold font-body border-0 rounded-full cursor-pointer transition-[color,background] duration-150 ease-[ease] shadow-none";
const QUICK_RANGE_IDLE =
  "text-muted bg-[color-mix(in_srgb,var(--text)_5%,transparent)] hover:text-text hover:bg-[color-mix(in_srgb,var(--text)_10%,transparent)] [[data-theme=oled]_&]:bg-card-soft [[data-theme=oled]_&]:hover:bg-[color-mix(in_srgb,white_8%,var(--card-soft))]";
const QUICK_RANGE_ACTIVE = "text-accent bg-[color-mix(in_srgb,var(--accent)_15%,transparent)]";
const CONFIDENCE_TONE: Record<string, string> = {
  strong: "text-success bg-[color-mix(in_srgb,var(--success)_14%,transparent)]",
  medium: "text-warning bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]",
  weak: "text-muted bg-[color-mix(in_srgb,var(--muted)_14%,transparent)]",
};

export function DashboardSection({
  dashboardFrom,
  dashboardTo,
  activeQuickRange,
  isLoading,
  hasEntriesInRange,
  hasEntriesOverall,
  onDateChange,
  onQuickRange,
  dashboardCards,
  dashboardInsights,
  dashboardConnections,
  wellbeingSeries,
  graphSelection,
  onGraphToggle,
  wellbeingChart,
  anniversaryCards,
}: {
  dashboardFrom: string;
  dashboardTo: string;
  activeQuickRange: DashboardQuickRange;
  isLoading: boolean;
  hasEntriesInRange: boolean;
  hasEntriesOverall: boolean;
  onDateChange: (field: "from" | "to", value: string) => void;
  onQuickRange: (range: DashboardQuickRange) => void;
  dashboardCards: Array<{ label: string; emoji: string; value: number | null; formattedValue: string; previous: number | null; invertDelta?: boolean }>;
  dashboardInsights: DashboardInsight[];
  dashboardConnections: DashboardConnection[];
  wellbeingSeries: WellbeingSeries[];
  graphSelection: Record<WellbeingSeriesKey, boolean>;
  onGraphToggle: (key: WellbeingSeriesKey, checked: boolean) => void;
  wellbeingChart: WellbeingChartView;
  anniversaryCards: MemorableDay[];
}) {
  return (
    <section className="@container p-2">
      <h1 className="m-0 mb-3 text-title font-bold tracking-tight text-text">Dashboard</h1>

      <div className="flex flex-wrap gap-3 items-end mb-5">
        <label className="flex flex-col gap-2">
          <span className={FIELD_LINE_LABEL}>From</span>
          <DateInput value={dashboardFrom} onChange={(v) => onDateChange("from", v)} ariaLabel="From date" />
        </label>
        <label className="flex flex-col gap-2">
          <span className={FIELD_LINE_LABEL}>To</span>
          <DateInput value={dashboardTo} onChange={(v) => onDateChange("to", v)} ariaLabel="To date" />
        </label>
        <div className="flex gap-2 flex-wrap">
          {dashboardQuickRanges.map((range) => (
            <button
              type="button"
              key={range.value}
              aria-pressed={activeQuickRange === range.value}
              className={`${QUICK_RANGE_BASE} ${activeQuickRange === range.value ? QUICK_RANGE_ACTIVE : QUICK_RANGE_IDLE}`}
              onClick={() => onQuickRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted text-control">Loading dashboard data...</p>
      ) : (
        <>
          {!hasEntriesInRange ? (
            <EmptyState
              title={hasEntriesOverall ? "No entries in this date range" : "No health entries yet"}
              description={hasEntriesOverall
                ? "Try widening the dates, or add a new diary or pain entry to start filling this range."
                : "Your averages will appear here after you log your first diary or pain entry."}
            />
          ) : null}

          {anniversaryCards.length > 0 ? (
            <>
              <SectionHead title="Anniversaries today" variant="dashboard" />
              <div className={CARD_GRID}>
                {anniversaryCards.map((card) => (
                  <article key={`${card.source}-${card.id}-${card.date}`} className={DASH_CARD}>
                    <h3 className={CARD_H3}>
                      <span className="mr-[4px]" aria-hidden="true">
                        {card.emoji || "✨"}
                      </span>
                      {card.title}
                    </h3>
                    <strong className={`${CARD_VALUE} text-text`}>{card.occurrenceLabel}</strong>
                    {!card.locked && (
                      <span className={`${DELTA_SLOT} text-muted`}>{card.repeatMode}</span>
                    )}
                  </article>
                ))}
              </div>
            </>
          ) : null}

          <SectionHead title="Averages" variant="dashboard" />
          <div data-testid="averages" className={CARD_GRID}>
            {dashboardCards.map((card) => {
              const deltaPct = calcDeltaPercent(card.value, card.previous);
              const delta = deltaPct === null ? null : formatDelta(deltaPct, Boolean(card.invertDelta));
              const absPct = deltaPct !== null ? Math.abs(deltaPct) : 0;
              const deltaStyle = delta ? getDeltaStyle(delta.className, absPct) : undefined;
              return (
                <article key={card.label} className={DASH_CARD}>
                  <h3 className={CARD_H3}>
                    <span className="mr-[4px]" aria-hidden="true">
                      {card.emoji}
                    </span>
                    {card.label}
                  </h3>
                  <strong className={`${CARD_VALUE} text-text`}>{card.formattedValue}</strong>
                  {delta ? (
                    <span className={`${DELTA_SLOT} justify-start`}>
                      <span className={DELTA_BASE} style={deltaStyle}>
                        {delta.text}
                      </span>
                    </span>
                  ) : null}
                </article>
              );
            })}
          </div>

          <SectionHead title="Metrics over time" variant="dashboard" />
          <div className="grid gap-3 p-3 rounded-md bg-card-soft mt-3">
            <div className="flex justify-between items-start gap-2 flex-wrap">
              <div className="flex flex-wrap gap-2">
                {wellbeingSeries.map((series) => {
                  const checked = graphSelection[series.key] ?? true;
                  const hasData = series.points.length > 0;
                  return (
                    <label
                      key={series.key}
                      data-testid="series-toggle"
                      className={`inline-flex items-center gap-2 border-0 rounded-full px-3 py-1 bg-card-soft text-micro font-semibold leading-none shadow-none${hasData ? "" : " opacity-50"}`}
                      style={{ "--series-color": series.color } as CSSProperties}
                    >
                      <input
                        type="checkbox"
                        className="w-auto accent-[var(--series-color,var(--accent))]"
                        checked={checked && hasData}
                        disabled={!hasData}
                        onChange={(event) => onGraphToggle(series.key, event.target.checked)}
                      />
                      <span className="text-text">{series.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {wellbeingChart.hasVisibleData ? (
              <div className="relative w-full min-h-[320px] h-[360px]">
                <Suspense fallback={<p className="text-muted text-control">Loading chart…</p>}>
                  <WellbeingChart data={wellbeingChart.data} options={wellbeingChart.options} />
                </Suspense>
              </div>
            ) : (
              <p className="text-muted text-control">
                {wellbeingChart.hasAnyData ? "Toggle on a metric to see it." : hasEntriesOverall ? "No chart data in this date range." : "No chart data yet. Add a diary or pain entry to get started."}
              </p>
            )}
          </div>

          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-5 items-start @max-[720px]:grid-cols-1">
            <section className="grid gap-3">
              <SectionHead title="At a glance" variant="dashboard" />
              <div data-testid="insights" className="grid gap-3">
                {dashboardInsights.map((insight) => (
                  <div key={insight.title} className="grid gap-1">
                    <strong className="text-muted text-nano font-bold tracking-[0.16em] uppercase">{insight.title}</strong>
                    <p className="m-0 text-text text-control leading-normal">{insight.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-3">
              <SectionHead title="Patterns" variant="dashboard" />
              {dashboardConnections.length > 0 ? (
                <div className="grid gap-3">
                  {dashboardConnections.map((connection) => (
                    <article key={connection.title} className="grid gap-2 rounded-md p-3 bg-card-soft">
                      <span className="text-nano font-bold tracking-[0.16em] uppercase text-muted">{connection.title}</span>
                      <strong className="m-0 text-text text-control font-semibold">{connection.summary}</strong>
                      <p className="m-0 text-muted text-control leading-normal">{connection.detail}</p>
                      <span className={`justify-self-start rounded-full px-2 py-0.5 text-micro font-bold ${CONFIDENCE_TONE[connection.confidence] ?? CONFIDENCE_TONE.weak}`}>{connection.confidence} confidence</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid gap-2 m-0">
                  <p className="text-control font-semibold text-text m-0">No connection signals yet</p>
                  <p className="max-w-[60ch] text-control text-muted leading-normal m-0">Log more overlapping diary and pain entries to unlock pattern cards here.</p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
