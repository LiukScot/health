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
import { DateField } from "./DateField";

const WellbeingChart = lazy(() => import("./WellbeingChart"));

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
    <section className="panel panel--dashboard">
      <h1 className="panel-title">Dashboard</h1>

      <div className="dashboard-filters">
        <label className="field field-line">
          <span className="field-line-label">From</span>
          <DateField value={dashboardFrom} onChange={(value) => onDateChange("from", value)} ariaLabel="From date" />
        </label>
        <label className="field field-line">
          <span className="field-line-label">To</span>
          <DateField value={dashboardTo} onChange={(value) => onDateChange("to", value)} ariaLabel="To date" />
        </label>
        <div className="dashboard-quick-ranges">
          {dashboardQuickRanges.map((range) => (
            <button
              type="button"
              key={range.value}
              className={activeQuickRange === range.value ? "active" : ""}
              onClick={() => onQuickRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="hint">Loading dashboard data...</p>
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
              <SectionHead title="Anniversaries today" />
              <div className="stats-grid stats-grid-dashboard stats-grid-memorable">
                {anniversaryCards.map((card) => (
                  <article key={`${card.source}-${card.id}-${card.date}`}>
                    <h3>
                      <span className="card-emoji" aria-hidden="true">
                        {card.emoji || "✨"}
                      </span>
                      {card.title}
                    </h3>
                    <strong>{card.occurrenceLabel}</strong>
                    {!card.locked && (
                      <span className="delta-slot memorable-lock-slot">{card.repeatMode}</span>
                    )}
                  </article>
                ))}
              </div>
            </>
          ) : null}

          <SectionHead title="Averages" />
          <div className="stats-grid stats-grid-dashboard">
            {dashboardCards.map((card) => {
              const deltaPct = calcDeltaPercent(card.value, card.previous);
              const delta = deltaPct === null ? null : formatDelta(deltaPct, Boolean(card.invertDelta));
              const absPct = deltaPct !== null ? Math.abs(deltaPct) : 0;
              const deltaStyle = delta ? getDeltaStyle(delta.className, absPct) : undefined;
              return (
                <article key={card.label}>
                  <h3>
                    <span className="card-emoji" aria-hidden="true">
                      {card.emoji}
                    </span>
                    {card.label}
                  </h3>
                  <strong>{card.formattedValue}</strong>
                  <span className="delta-slot" aria-hidden={delta ? undefined : true}>
                    {delta ? (
                      <span className={`delta ${delta.className}`} style={deltaStyle}>
                        {delta.text}
                      </span>
                    ) : null}
                  </span>
                </article>
              );
            })}
          </div>

          <SectionHead title="Metrics over time" />
          <div className="chart-wrap chart-wrap-wide">
            <div className="graph-header">
              <div className="graph-toggle-list">
                {wellbeingSeries.map((series) => {
                  const checked = graphSelection[series.key] ?? true;
                  const hasData = series.points.length > 0;
                  return (
                    <label
                      key={series.key}
                      className={hasData ? "series-toggle" : "series-toggle is-disabled"}
                      style={{ "--series-color": series.color } as CSSProperties}
                    >
                      <input
                        type="checkbox"
                        checked={checked && hasData}
                        disabled={!hasData}
                        onChange={(event) => onGraphToggle(series.key, event.target.checked)}
                      />
                      <span>{series.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {wellbeingChart.hasVisibleData ? (
              <div className="chart-canvas chart-canvas-wide">
                <Suspense fallback={<p className="hint">Loading chart…</p>}>
                  <WellbeingChart data={wellbeingChart.data} options={wellbeingChart.options} />
                </Suspense>
              </div>
            ) : (
              <p className="hint">
                {wellbeingChart.hasAnyData ? "Toggle on a metric to see it." : hasEntriesOverall ? "No chart data in this date range." : "No chart data yet. Add a diary or pain entry to get started."}
              </p>
            )}
          </div>

          <div className="dashboard-pattern-grid">
            <section className="dashboard-pattern-block">
              <SectionHead title="At a glance" />
              <div className="dashboard-insight-list">
                {dashboardInsights.map((insight) => (
                  <div key={insight.title} className="dashboard-insight-row">
                    <strong>{insight.title}</strong>
                    <p>{insight.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-pattern-block">
              <SectionHead title="Patterns" />
              {dashboardConnections.length > 0 ? (
                <div className="dashboard-connection-stack">
                  {dashboardConnections.map((connection) => (
                    <article key={connection.title} className="dashboard-connection-card">
                      <span className="dashboard-connection-label">{connection.title}</span>
                      <strong>{connection.summary}</strong>
                      <p>{connection.detail}</p>
                      <span className={`dashboard-confidence dashboard-confidence-${connection.confidence}`}>{connection.confidence} confidence</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state empty-state-compact">
                  <p className="empty-state-title">No connection signals yet</p>
                  <p className="empty-state-copy">Log more overlapping diary and pain entries to unlock pattern cards here.</p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
