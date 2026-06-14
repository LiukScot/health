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
import { FIELD_LINE_LABEL } from "../components/ui/FieldLine";
import { DateInput } from "../components/ui/DateInput";

const WellbeingChart = lazy(() => import("./WellbeingChart"));

const DASH_CARD =
  "grid grid-rows-[auto_auto_22px] gap-inline content-start w-full max-w-[200px] justify-self-start rounded-md p-stack bg-card-soft";
const CARD_H3 =
  "m-0 text-nano font-bold tracking-[0.12em] uppercase text-muted leading-tight whitespace-nowrap overflow-hidden text-ellipsis translate-y-[2px]";
const CARD_VALUE = "text-lg font-bold text-text translate-y-[2px]";
const DELTA_SLOT = "min-h-[22px] flex items-end translate-y-[2px]";
const DELTA_BASE = "inline-flex items-center rounded-full px-inline py-[2px] text-micro font-bold self-end";
const QUICK_RANGE_BASE =
  "px-stack py-tight text-xs font-semibold font-body border-0 rounded-full cursor-pointer transition-[color,background] duration-150 ease-[ease] shadow-none";
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
    <section className="@container p-inline">
      <h1 className="m-0 mb-stack text-[22px] font-bold tracking-tight text-text">Dashboard</h1>

      <div className="flex flex-wrap gap-stack items-end mb-block">
        <label className="flex flex-col gap-inline">
          <span className={FIELD_LINE_LABEL}>From</span>
          <DateInput value={dashboardFrom} onChange={(v) => onDateChange("from", v)} ariaLabel="From date" />
        </label>
        <label className="flex flex-col gap-inline">
          <span className={FIELD_LINE_LABEL}>To</span>
          <DateInput value={dashboardTo} onChange={(v) => onDateChange("to", v)} ariaLabel="To date" />
        </label>
        <div className="flex gap-inline flex-wrap">
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
              <div className="grid grid-cols-[repeat(auto-fit,minmax(128px,1fr))] gap-stack">
                {anniversaryCards.map((card) => (
                  <article key={`${card.source}-${card.id}-${card.date}`} className={DASH_CARD}>
                    <h3 className={CARD_H3}>
                      <span className="mr-[4px]" aria-hidden="true">
                        {card.emoji || "✨"}
                      </span>
                      {card.title}
                    </h3>
                    <strong className={CARD_VALUE}>{card.occurrenceLabel}</strong>
                    {!card.locked && (
                      <span className={`${DELTA_SLOT} text-muted`}>{card.repeatMode}</span>
                    )}
                  </article>
                ))}
              </div>
            </>
          ) : null}

          <SectionHead title="Averages" variant="dashboard" />
          <div data-testid="averages" className="grid grid-cols-[repeat(auto-fit,minmax(128px,1fr))] gap-stack">
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
                  <strong className={CARD_VALUE}>{card.formattedValue}</strong>
                  <span className={`${DELTA_SLOT} justify-start`} aria-hidden={delta ? undefined : true}>
                    {delta ? (
                      <span className={DELTA_BASE} style={deltaStyle}>
                        {delta.text}
                      </span>
                    ) : null}
                  </span>
                </article>
              );
            })}
          </div>

          <SectionHead title="Metrics over time" variant="dashboard" />
          <div className="grid gap-stack p-stack rounded-md bg-card-soft mt-stack">
            <div className="flex justify-between items-start gap-inline flex-wrap">
              <div className="flex flex-wrap gap-inline">
                {wellbeingSeries.map((series) => {
                  const checked = graphSelection[series.key] ?? true;
                  const hasData = series.points.length > 0;
                  return (
                    <label
                      key={series.key}
                      data-testid="series-toggle"
                      className={`inline-flex items-center gap-inline border-0 rounded-full px-stack py-tight bg-card-soft text-micro font-semibold leading-none shadow-none${hasData ? "" : " opacity-50"}`}
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

          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-block items-start @max-[720px]:grid-cols-1">
            <section className="grid gap-stack">
              <SectionHead title="At a glance" variant="dashboard" />
              <div data-testid="insights" className="grid gap-stack">
                {dashboardInsights.map((insight) => (
                  <div key={insight.title} className="grid gap-tight">
                    <strong className="text-muted text-nano font-bold tracking-[0.16em] uppercase">{insight.title}</strong>
                    <p className="m-0 text-text text-control leading-normal">{insight.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-stack">
              <SectionHead title="Patterns" variant="dashboard" />
              {dashboardConnections.length > 0 ? (
                <div className="grid gap-stack">
                  {dashboardConnections.map((connection) => (
                    <article key={connection.title} className="grid gap-inline rounded-md p-stack bg-card-soft">
                      <span className="text-nano font-bold tracking-[0.16em] uppercase text-muted">{connection.title}</span>
                      <strong className="m-0 text-text text-control font-semibold">{connection.summary}</strong>
                      <p className="m-0 text-muted text-control leading-normal">{connection.detail}</p>
                      <span className={`justify-self-start rounded-full px-inline py-[2px] text-micro font-bold ${CONFIDENCE_TONE[connection.confidence] ?? CONFIDENCE_TONE.weak}`}>{connection.confidence} confidence</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid gap-inline m-0">
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
