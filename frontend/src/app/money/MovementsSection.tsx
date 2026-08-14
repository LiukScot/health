import { useMemo, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { FieldLine, FIELD_LINE_LABEL } from "../../components/ui/FieldLine";
import { Select } from "../../components/ui/select";
import { AnimatedEditingLabel } from "../shared";
import { EmptyState, PAGE, PAGE_TITLE } from "../screen-helpers";
import { entryViewLabels } from "../core";
import { FLAT_ACTIONS, FLAT_FORM, FLAT_ROW, FLAT_SHELL } from "../staged";
import {
  DELETE_CONFIRM,
  DETAIL_ACTIONS,
  DETAIL_ACTION_BTN,
  DetailGroup,
  ENTRY_CHEVRON,
  ENTRY_EXPANDED,
  ENTRY_PREVIEW,
  ENTRY_ROW,
  ENTRY_SUMMARY,
  PainBadge,
  PastEntries,
  EntryViewTabs,
  type EntryView,
  TAG_TAB_BTN,
} from "../entries";
import {
  amountIn,
  CADENCES,
  DIRECTIONS,
  formatCurrency,
  type Cadence,
  type Movement,
  type MovementFormValues,
} from "./core";

const DIRECTION_OPTIONS = DIRECTIONS.map((d) => ({ value: d, label: d }));
const CADENCE_OPTIONS = CADENCES.map((c) => ({ value: c, label: c }));

// The list mixes cadences, so an amount column can only be ranked once every
// row is expressed in the same period. The tabs pick which one.
const PERIOD_TABS: { id: Cadence; label: string; net: string }[] = [
  { id: "monthly", label: "Per month", net: "Monthly net" },
  { id: "annual", label: "Per year", net: "Annual net" },
];

export function MovementsSection({
  movementForm,
  movementMutationState,
  isLoading,
  editingMovement,
  movements,
  confirmDeleteMovement,
  onSubmit,
  onCancelEdit,
  onStartEdit,
  onDeleteClick,
  onDeleteBlur,
  view,
  onViewChange,
}: {
  movementForm: UseFormReturn<MovementFormValues>;
  movementMutationState: { isSuccess: boolean };
  isLoading: boolean;
  editingMovement: Movement | null;
  movements: Movement[];
  confirmDeleteMovement: string | null;
  onSubmit: (values: MovementFormValues) => void;
  onCancelEdit: () => void;
  onStartEdit: (row: Movement) => void;
  onDeleteClick: (id: string) => void;
  onDeleteBlur: () => void;
  view: EntryView;
  onViewChange: (next: EntryView) => void;
}) {
  const [period, setPeriod] = useState<Cadence>("monthly");
  // Ranking by the raw amount would put a yearly premium above a bigger
  // monthly bill, so the sort follows whichever period is on screen.
  const rows = useMemo(
    () => [...movements].sort((a, b) => amountIn(b, period) - amountIn(a, period)),
    [movements, period],
  );
  const net = rows.reduce(
    (sum, m) => sum + (m.direction === "income" ? amountIn(m, period) : -amountIn(m, period)),
    0,
  );
  const netLabel = PERIOD_TABS.find((t) => t.id === period)!.net;

  return (
    <section className={PAGE}>
      <EntryViewTabs view={view} onChange={onViewChange} labels={entryViewLabels["money-movements"]} className="inline-flex max-mobile:hidden" />
      <h1 className={PAGE_TITLE}>Movements</h1>
      {view === "new" ? (
      <form onSubmit={movementForm.handleSubmit(onSubmit)} className={FLAT_SHELL}>
        <div className={FLAT_FORM}>
        <div className={FLAT_ROW}>
          <FieldLine
            label="Name"
            type="text"
            placeholder="e.g. Rent, Salary"
            aria-label="Name"
            {...movementForm.register("name")}
          />
          <FieldLine
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0"
            aria-label="Amount"
            {...movementForm.register("amount")}
          />
        </div>

        <div className={FLAT_ROW}>
          {/* A <span>, not a <label>: the Select is a button + popover, and
              wrapping those in a label makes every click toggle it twice. */}
          <div className="grid gap-2 content-start">
            <span className={FIELD_LINE_LABEL}>Direction</span>
            <Controller
              control={movementForm.control}
              name="direction"
              render={({ field }) => (
                <Select
                  ariaLabel="Direction"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={DIRECTION_OPTIONS}
                />
              )}
            />
          </div>
          <div className="grid gap-2 content-start">
            <span className={FIELD_LINE_LABEL}>Cadence</span>
            <Controller
              control={movementForm.control}
              name="cadence"
              render={({ field }) => (
                <Select
                  ariaLabel="Cadence"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={CADENCE_OPTIONS}
                />
              )}
            />
          </div>
        </div>

        <FieldLine
          label="Note"
          multiline
          compact
          rows={2}
          placeholder="What is this recurring amount for?"
          aria-label="Note"
          {...movementForm.register("note")}
        />

        </div>

        <div className={FLAT_ACTIONS}>
          <Button type="submit" variant={movementMutationState.isSuccess ? "success" : "primary"}>
            {movementMutationState.isSuccess ? "✓ Saved" : editingMovement ? "Update movement" : "Save movement"}
          </Button>
        </div>
      </form>
      ) : (

      <PastEntries
        title="Recurring"
        isLoading={isLoading}
        loadingText="Loading movements..."
        isEmpty={movements.length === 0}
        emptyState={
          <EmptyState
            title="No movements yet"
            description="Record what comes in and goes out on a schedule — rent, salary, subscriptions, the yearly insurance. The running balance shows up here."
          />
        }
      >
        {rows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1">
            <nav className="flex flex-wrap gap-x-5 gap-y-1" role="tablist" aria-label="Show amounts">
              {PERIOD_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={period === tab.id}
                  className={`${TAG_TAB_BTN} ${period === tab.id ? "text-text border-b-accent" : "text-muted border-b-transparent hover:text-text"}`}
                  onClick={() => setPeriod(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <p className="text-control text-muted m-0">
              {netLabel}{" "}
              <span className={net >= 0 ? "text-success font-semibold" : "text-danger font-semibold"}>
                {formatCurrency(net)}
              </span>
            </p>
          </div>
        ) : null}
        {rows.map((row) => {
          const income = row.direction === "income";
          const annual = row.cadence === "annual";
          return (
            <details key={row.id} className={ENTRY_ROW}>
              {/* Five children exactly: ENTRY_SUMMARY has five grid tracks,
                  and a sixth one wraps the chevron onto its own row. */}
              <summary className={ENTRY_SUMMARY}>
                {/* Sign and wording carry the meaning; colour reinforces it. */}
                <PainBadge variant="muted" sm>{row.direction}</PainBadge>
                <PainBadge variant="muted" sm>{annual ? "annual" : "monthly"}</PainBadge>
                <span className={ENTRY_PREVIEW}>{row.name}</span>
                {/* The amount follows the tabs, so every row on screen is in
                    the same period and the ranking means something. */}
                <span className={income ? "text-success" : "text-muted"}>
                  {income ? "+" : "−"}
                  {formatCurrency(amountIn(row, period))}
                </span>
                <span className={ENTRY_CHEVRON} aria-hidden="true">▶</span>
              </summary>
              <div className={ENTRY_EXPANDED}>
                <DetailGroup label="Direction">{row.direction}</DetailGroup>
                <DetailGroup label="Cadence">{annual ? "annual" : "monthly"}</DetailGroup>
                {/* As entered, whichever period the list is showing. */}
                <DetailGroup label="Amount">{formatCurrency(row.amount)}</DetailGroup>
                <DetailGroup label="Note">{row.note || "—"}</DetailGroup>
                <div className={DETAIL_ACTIONS}>
                  <button
                    type="button"
                    className={DETAIL_ACTION_BTN}
                    onClick={() => {
                      if (editingMovement?.id === row.id) {
                        onCancelEdit();
                        return;
                      }
                      onStartEdit(row);
                      // Editing means going back to the form, which the log view is not
                      // showing: filling a form nobody can see is not an edit.
                      onViewChange("new");
                    }}
                  >
                    <AnimatedEditingLabel active={editingMovement?.id === row.id} />
                  </button>
                  <button
                    type="button"
                    className={`${DETAIL_ACTION_BTN} ${confirmDeleteMovement === row.id ? DELETE_CONFIRM : ""}`}
                    onClick={() => onDeleteClick(row.id)}
                    onBlur={onDeleteBlur}
                  >
                    {confirmDeleteMovement === row.id ? "Delete?" : "Delete"}
                  </button>
                </div>
              </div>
            </details>
          );
        })}
      </PastEntries>
      )}
    </section>
  );
}
