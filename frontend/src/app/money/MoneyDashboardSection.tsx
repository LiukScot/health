import { lazy, Suspense } from "react";
import { SectionHead } from "../shared";
import { EmptyState } from "../screen-helpers";
import { CARD_GRID, DASH_CARD, CARD_H3, CARD_VALUE } from "../cards";
import { formatCurrency, formatTxDate, type AssetStats, type DashboardKpis } from "./core";

const AssetCharts = lazy(() => import("./AssetCharts"));

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  const valueTone = tone === "positive" ? "text-success" : tone === "negative" ? "text-danger" : "text-text";
  return (
    <article className={DASH_CARD}>
      <h3 className={CARD_H3}>{label}</h3>
      <strong className={`${CARD_VALUE} ${valueTone}`}>{value}</strong>
    </article>
  );
}

// Sign and label carry the meaning; the colour only reinforces it.
const toneOf = (n: number) => (n > 0 ? "positive" : n < 0 ? "negative" : undefined);

export function MoneyDashboardSection({
  kpis,
  visibleAssets,
  hiddenAssetCount,
  showZeroAssets,
  onToggleShowZeroAssets,
  isLoading,
}: {
  kpis: DashboardKpis;
  visibleAssets: AssetStats[];
  hiddenAssetCount: number;
  showZeroAssets: boolean;
  onToggleShowZeroAssets: (next: boolean) => void;
  isLoading: boolean;
}) {
  const hasAssets = visibleAssets.length > 0;

  return (
    <section className="@container">
      <h1 className="m-0 mb-10 [text-box:trim-both_cap_alphabetic] text-title font-bold tracking-tight text-text">Dashboard</h1>

      {isLoading ? <p className="text-muted text-control">Loading portfolio…</p> : null}

      <SectionHead title="Portfolio" variant="dashboard" />
      <div className={CARD_GRID}>
        <Kpi label="Current value" value={formatCurrency(kpis.totalCurrent)} />
        <Kpi label="Total PnL" value={formatCurrency(kpis.totalPnl)} tone={toneOf(kpis.totalPnl)} />
        <Kpi label="Assets" value={String(kpis.assetsCount)} />
        <Kpi label="Transactions" value={String(kpis.txCount)} />
        <Kpi label="Last transaction" value={kpis.lastTxDate ? formatTxDate(kpis.lastTxDate) : "—"} />
      </div>

      <SectionHead title="Every month" variant="dashboard" />
      <div className={CARD_GRID}>
        <Kpi label="Income" value={formatCurrency(kpis.monthlyIncome)} />
        <Kpi label="Expense" value={formatCurrency(kpis.monthlyExpense)} />
        <Kpi label="Net" value={formatCurrency(kpis.monthlyNet)} tone={toneOf(kpis.monthlyNet)} />
      </div>

      <SectionHead title="By asset" variant="dashboard" />
      {hasAssets ? (
        <>
          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]">
            {visibleAssets.map((stat) => (
              <article key={stat.asset} className="grid gap-2 content-start p-3 rounded-md bg-card-soft">
                <header className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-[4px] border border-border flex-shrink-0"
                    style={{ background: stat.color }}
                    aria-hidden="true"
                  />
                  <h3 className="m-0 text-sm font-bold text-text truncate">{stat.asset}</h3>
                  <span className="ml-auto text-micro text-muted uppercase tracking-wider flex-shrink-0">
                    {stat.riskLevel ?? "no risk"}
                  </span>
                </header>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 m-0">
                  <div className="grid gap-1">
                    <dt className="text-micro text-muted uppercase tracking-wider">Current</dt>
                    <dd className="m-0 text-control text-text">{formatCurrency(stat.current)}</dd>
                  </div>
                  <div className="grid gap-1">
                    <dt className="text-micro text-muted uppercase tracking-wider">Allocation</dt>
                    <dd className="m-0 text-control text-text">{stat.allocationPct.toFixed(1)}%</dd>
                  </div>
                  <div className="grid gap-1">
                    <dt className="text-micro text-muted uppercase tracking-wider">PnL</dt>
                    <dd className={`m-0 text-control ${stat.pnl >= 0 ? "text-success" : "text-danger"}`}>
                      {formatCurrency(stat.pnl)}
                    </dd>
                  </div>
                  <div className="grid gap-1">
                    <dt className="text-micro text-muted uppercase tracking-wider">PnL %</dt>
                    <dd className={`m-0 text-control ${stat.pnl >= 0 ? "text-success" : "text-danger"}`}>
                      {stat.pnlPct.toFixed(2)}%
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="mt-5">
            <Suspense fallback={<p className="text-muted text-control">Loading charts…</p>}>
              <AssetCharts visibleAssets={visibleAssets} />
            </Suspense>
          </div>
        </>
      ) : (
        <EmptyState
          title={hiddenAssetCount > 0 ? "Every asset is at zero" : "No assets yet"}
          description={
            hiddenAssetCount > 0
              ? "Everything you hold has been sold off. Turn on the toggle below to keep those assets visible."
              : "Record a transaction and this fills with per-asset value, allocation and PnL. Risk levels are set in Settings."
          }
        />
      )}

      <div className="flex items-center gap-2 mt-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="showZeroAssets"
            className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
            checked={showZeroAssets}
            onChange={(e) => onToggleShowZeroAssets(e.target.checked)}
          />
          <span className="text-control text-muted">
            Show zero-value assets
            {hiddenAssetCount > 0 && !showZeroAssets ? ` (${hiddenAssetCount} hidden)` : ""}
          </span>
        </label>
      </div>
    </section>
  );
}
