import { Controller, type UseFormReturn } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { FieldLine, FIELD_LINE_LABEL } from "../../components/ui/FieldLine";
import { Select } from "../../components/ui/select";
import { AnimatedEditingLabel } from "../shared";
import { EmptyState } from "../screen-helpers";
import {
  DELETE_CONFIRM,
  DETAIL_ACTIONS,
  DETAIL_ACTION_BTN,
  DetailGroup,
  EntriesHeading,
  FORM_FULL,
  FORM_GRID,
  ENTRY_CHEVRON,
  ENTRY_DATE,
  ENTRY_EXPANDED,
  ENTRY_PREVIEW,
  ENTRY_ROW,
  ENTRY_SUMMARY,
  PainBadge,
  PastEntries,
} from "../entries";
import { DIRECTIONS, formatCurrency, type Movement, type MovementFormValues } from "./core";

const DIRECTION_OPTIONS = DIRECTIONS.map((d) => ({ value: d, label: d }));

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
}) {
  const monthlyNet = movements.reduce((sum, m) => sum + (m.direction === "income" ? m.amount : -m.amount), 0);

  return (
    <section className="@container p-2">
      <h1 className="m-0 mb-3 text-title font-bold tracking-tight text-text">Movements</h1>
      <div className="grid gap-8">
        <div className="min-w-0 border-b border-border">
          <EntriesHeading className="mt-0">New movement</EntriesHeading>
          <form className="mb-2" onSubmit={movementForm.handleSubmit(onSubmit)}>
            <div className={FORM_GRID}>
              <FieldLine
                label="Name"
                type="text"
                placeholder="e.g. Rent, Salary"
                aria-label="Name"
                {...movementForm.register("name")}
              />

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

              <FieldLine
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                aria-label="Amount"
                {...movementForm.register("amount")}
              />

              <FieldLine
                label="Note"
                multiline
                compact
                rows={2}
                placeholder="What is this recurring amount for?"
                aria-label="Note"
                {...movementForm.register("note")}
              />

              {editingMovement ? (
                <div className={`flex gap-2 flex-wrap ${FORM_FULL}`}>
                  <Button type="button" onClick={onCancelEdit}>
                    Cancel edit
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant={movementMutationState.isSuccess ? "success" : "primary"}
                className="mb-5"
              >
                {movementMutationState.isSuccess ? "✓ Saved" : editingMovement ? "Update movement" : "Save movement"}
              </Button>
            </div>
          </form>
        </div>

        <PastEntries
          title="Recurring"
          isLoading={isLoading}
          loadingText="Loading movements..."
          isEmpty={movements.length === 0}
          emptyState={
            <EmptyState
              title="No movements yet"
              description="Record what comes in and goes out every month — rent, salary, subscriptions. The running balance shows up here."
            />
          }
        >
          {movements.length > 0 ? (
            <p className="text-control text-muted m-0 mb-3">
              Monthly net{" "}
              <span className={monthlyNet >= 0 ? "text-success font-semibold" : "text-danger font-semibold"}>
                {formatCurrency(monthlyNet)}
              </span>
            </p>
          ) : null}
          {movements.map((row) => {
            const income = row.direction === "income";
            return (
              <details key={row.id} className={ENTRY_ROW}>
                <summary className={ENTRY_SUMMARY}>
                  {/* Sign and wording carry the meaning; colour reinforces it. */}
                  <span className={ENTRY_DATE}>{income ? "in" : "out"}</span>
                  <PainBadge variant="muted" sm>{row.direction}</PainBadge>
                  <span className={ENTRY_PREVIEW}>{row.name}</span>
                  <span className={income ? "text-success" : "text-muted"}>
                    {income ? "+" : "−"}
                    {formatCurrency(row.amount)}
                  </span>
                  <span className={ENTRY_CHEVRON} aria-hidden="true">▶</span>
                </summary>
                <div className={ENTRY_EXPANDED}>
                  <DetailGroup label="Direction">{row.direction}</DetailGroup>
                  <DetailGroup label="Amount">{formatCurrency(row.amount)}</DetailGroup>
                  <DetailGroup label="Note">{row.note || "—"}</DetailGroup>
                  <div className={DETAIL_ACTIONS}>
                    <button
                      type="button"
                      className={DETAIL_ACTION_BTN}
                      onClick={() => {
                        if (editingMovement) {
                          onCancelEdit();
                          return;
                        }
                        onStartEdit(row);
                      }}
                    >
                      <AnimatedEditingLabel active={Boolean(editingMovement)} />
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
      </div>
    </section>
  );
}
