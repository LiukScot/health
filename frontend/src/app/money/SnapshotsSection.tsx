import { lazy, Suspense } from "react";
import { type UseFormReturn } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { FieldLine } from "../../components/ui/FieldLine";
import { EmptyState } from "../screen-helpers";
import {
  DELETE_CONFIRM,
  DETAIL_ACTIONS,
  DETAIL_ACTION_BTN,
  DetailGroup,
  EntriesHeading,
  FORM_GRID,
  ENTRY_CHEVRON,
  ENTRY_DATE,
  ENTRY_EXPANDED,
  ENTRY_PREVIEW,
  ENTRY_ROW,
  ENTRY_SUMMARY,
  PastEntries,
} from "../entries";
import { formatCurrency, formatTxDate, type Snapshot, type SnapshotFormValues } from "./core";

// chart.js is the heaviest thing on this screen and only matters once there
// is something to plot, so it stays out of the panel's own chunk.
const MonthlyRiskChart = lazy(() => import("./MonthlyRiskChart"));

export function SnapshotsSection({
  snapshotForm,
  snapshotMutationState,
  isLoading,
  canSave,
  snapshots,
  confirmDeleteSnapshot,
  onSubmit,
  onDeleteClick,
  onDeleteBlur,
}: {
  snapshotForm: UseFormReturn<SnapshotFormValues>;
  snapshotMutationState: { isSuccess: boolean };
  isLoading: boolean;
  canSave: boolean;
  snapshots: Snapshot[];
  confirmDeleteSnapshot: string | null;
  onSubmit: (values: SnapshotFormValues) => void;
  onDeleteClick: (id: string) => void;
  onDeleteBlur: () => void;
}) {
  return (
    <section className="@container p-2">
      <h1 className="m-0 mb-3 text-title font-bold tracking-tight text-text">Snapshots</h1>
      <div className="grid gap-8">
        <div className="min-w-0 border-b border-border">
          <EntriesHeading className="mt-0">New snapshot</EntriesHeading>
          <p className="text-control text-muted m-0 mb-3 max-w-[60ch]">
            The three risk totals are worked out from your transactions and the risk level set on
            each asset. You only record the date and whatever is sitting liquid.
          </p>
          <form className="mb-2" onSubmit={snapshotForm.handleSubmit(onSubmit)}>
            <div className={FORM_GRID}>
              <FieldLine
                label="Date"
                type="date"
                aria-label="Date"
                {...snapshotForm.register("snapshotDate")}
                onClick={(e) => {
                  const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                  el.showPicker?.();
                }}
              />
              <FieldLine
                label="Liquid"
                type="number"
                step="0.01"
                placeholder="0"
                aria-label="Liquid"
                {...snapshotForm.register("liquid")}
              />
            </div>
            <div className="flex justify-end items-center gap-3 pt-2">
              {!canSave ? (
                <span className="text-control text-muted">Loading transactions and asset styles…</span>
              ) : null}
              <Button
                type="submit"
                disabled={!canSave}
                variant={snapshotMutationState.isSuccess ? "success" : "primary"}
                className="mb-5"
              >
                {snapshotMutationState.isSuccess ? "✓ Saved" : "Take snapshot"}
              </Button>
            </div>
          </form>
        </div>

        <PastEntries
          title="History"
          isLoading={isLoading}
          loadingText="Loading snapshots..."
          isEmpty={snapshots.length === 0}
          emptyState={
            <EmptyState
              title="No snapshots yet"
              description="A snapshot freezes what your portfolio looks like on a given day. Take a few and the chart will show how the mix shifts over time."
            />
          }
        >
          <Suspense fallback={<p className="text-muted text-control">Loading chart…</p>}>
            <MonthlyRiskChart snapshots={snapshots} />
          </Suspense>
          {snapshots.map((row) => {
            const total = row.lowRisk + row.mediumRisk + row.highRisk + row.liquid;
            return (
              <details key={row.id} className={ENTRY_ROW}>
                <summary className={ENTRY_SUMMARY}>
                  <span className={ENTRY_DATE}>{formatTxDate(row.snapshotDate)}</span>
                  <span />
                  <span className={ENTRY_PREVIEW}>Total</span>
                  <span className="text-text">{formatCurrency(total)}</span>
                  <span className={ENTRY_CHEVRON} aria-hidden="true">▶</span>
                </summary>
                <div className={ENTRY_EXPANDED}>
                  <DetailGroup label="Low risk">{formatCurrency(row.lowRisk)}</DetailGroup>
                  <DetailGroup label="Medium risk">{formatCurrency(row.mediumRisk)}</DetailGroup>
                  <DetailGroup label="High risk">{formatCurrency(row.highRisk)}</DetailGroup>
                  <DetailGroup label="Liquid">{formatCurrency(row.liquid)}</DetailGroup>
                  <div className={DETAIL_ACTIONS}>
                    <button
                      type="button"
                      className={`${DETAIL_ACTION_BTN} ${confirmDeleteSnapshot === row.id ? DELETE_CONFIRM : ""}`}
                      onClick={() => onDeleteClick(row.id)}
                      onBlur={onDeleteBlur}
                    >
                      {confirmDeleteSnapshot === row.id ? "Delete?" : "Delete"}
                    </button>
                  </div>
                </div>
              </details>
            );
          })}
        </PastEntries>
      </div>
    </section>
  );
}
