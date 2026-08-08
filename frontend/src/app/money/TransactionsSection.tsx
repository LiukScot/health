import { useId } from "react";
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
  ENTRY_CHEVRON,
  ENTRY_DATE,
  ENTRY_EXPANDED,
  ENTRY_PREVIEW,
  ENTRY_ROW,
  ENTRY_SUMMARY,
  PainBadge,
  PastEntries,
} from "../entries";
import {
  formatCurrency,
  formatTxDate,
  TIPO_OPTIONS,
  tipoShowsBuyValue,
  type Transaction,
  type TxFormValues,
} from "./core";

const TIPO_SELECT_OPTIONS = TIPO_OPTIONS.map((tipo) => ({ value: tipo, label: tipo }));

export function TransactionsSection({
  txForm,
  txMutationState,
  isLoading,
  editingTx,
  transactions,
  assetOptions,
  confirmDeleteTx,
  onSubmit,
  onCancelEdit,
  onStartEdit,
  onDeleteClick,
  onDeleteBlur,
}: {
  txForm: UseFormReturn<TxFormValues>;
  txMutationState: { isSuccess: boolean };
  isLoading: boolean;
  editingTx: Transaction | null;
  transactions: Transaction[];
  assetOptions: string[];
  confirmDeleteTx: string | null;
  onSubmit: (values: TxFormValues) => void;
  onCancelEdit: () => void;
  onStartEdit: (row: Transaction) => void;
  onDeleteClick: (id: string) => void;
  onDeleteBlur: () => void;
}) {
  const assetListId = useId();
  const watchedTipo = txForm.watch("tipo");
  const showBuyValue = tipoShowsBuyValue(watchedTipo);


  return (
    <section className="@container p-2">
      <h1 className="m-0 mb-3 text-title font-bold tracking-tight text-text">Transactions</h1>
      <div className="grid gap-8 max-w-[80ch]">
        <div className="min-w-0 border-b border-border">
          <EntriesHeading className="mt-0">New transaction</EntriesHeading>
          <form className="mb-2" onSubmit={txForm.handleSubmit(onSubmit)}>
            <div className="grid gap-3 content-start min-w-0">
              <FieldLine
                label="Date"
                type="date"
                aria-label="Date"
                {...txForm.register("txDate")}
                onClick={(e) => {
                  const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                  el.showPicker?.();
                }}
              />

              {/* Native datalist: type a new asset or pick one already used.
                  No combobox library needed, and it stays keyboard-native. */}
              <FieldLine
                label="Asset"
                type="text"
                list={assetListId}
                autoComplete="off"
                placeholder={assetOptions.length > 0 ? "Type or pick one" : "e.g. revolut"}
                aria-label="Asset"
                {...txForm.register("asset")}
              />
              <datalist id={assetListId}>
                {assetOptions.map((asset) => (
                  <option key={asset} value={asset} />
                ))}
              </datalist>

              {/* A <span>, not a <label>: the Select is a button + popover, and
                  wrapping those in a label makes every click toggle it twice. */}
              <div className="grid gap-2 content-start">
                <span className={FIELD_LINE_LABEL}>Tipo</span>
                <Controller
                  control={txForm.control}
                  name="tipo"
                  render={({ field }) => (
                    <Select
                      ariaLabel="Tipo"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={TIPO_SELECT_OPTIONS}
                    />
                  )}
                />
              </div>

              {showBuyValue ? (
                <FieldLine
                  label="Buy value"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  aria-label="Buy value"
                  {...txForm.register("buyValue")}
                />
              ) : (
                <FieldLine
                  label="PnL"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  aria-label="PnL"
                  {...txForm.register("pnl")}
                />
              )}

              <FieldLine
                label="Note"
                multiline
                compact
                rows={2}
                placeholder="Anything worth remembering about this move."
                aria-label="Note"
                {...txForm.register("note")}
              />

              {editingTx ? (
                <div className="flex gap-2 flex-wrap">
                  <Button type="button" onClick={onCancelEdit}>
                    Cancel edit
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" variant={txMutationState.isSuccess ? "success" : "primary"} className="mb-5">
                {txMutationState.isSuccess ? "✓ Saved" : editingTx ? "Update transaction" : "Save transaction"}
              </Button>
            </div>
          </form>
        </div>

        <PastEntries
          title="History"
          isLoading={isLoading}
          loadingText="Loading transactions..."
          isEmpty={transactions.length === 0}
          emptyState={
            <EmptyState
              title="No transactions yet"
              description="Record a purchase, a coupon or a revaluation with the form. Everything you log shows up here, newest first."
            />
          }
        >
          {transactions.map((row) => {
            const gain = row.pnl > 0;
            const loss = row.pnl < 0;
            return (
              <details key={row.id} className={ENTRY_ROW}>
                <summary className={ENTRY_SUMMARY}>
                  <span className={ENTRY_DATE}>{formatTxDate(row.txDate)}</span>
                  <PainBadge variant="muted" sm>{row.tipo}</PainBadge>
                  <span className={ENTRY_PREVIEW}>{row.asset || "—"}</span>
                  {/* Sign and value carry the meaning; colour only reinforces it. */}
                  <span className={gain ? "text-success" : loss ? "text-danger" : "text-muted"}>
                    {formatCurrency(row.currentValue)}
                  </span>
                  <span className={ENTRY_CHEVRON} aria-hidden="true">▶</span>
                </summary>
                <div className={ENTRY_EXPANDED}>
                  <DetailGroup label="Buy value">{formatCurrency(row.buyValue)}</DetailGroup>
                  <DetailGroup label="PnL">{formatCurrency(row.pnl)}</DetailGroup>
                  <DetailGroup label="Current value">{formatCurrency(row.currentValue)}</DetailGroup>
                  <DetailGroup label="Type">{row.derivedType || "—"}</DetailGroup>
                  <DetailGroup label="Note">{row.note || "—"}</DetailGroup>
                  <div className={DETAIL_ACTIONS}>
                    <button
                      type="button"
                      className={DETAIL_ACTION_BTN}
                      onClick={() => {
                        if (editingTx) {
                          onCancelEdit();
                          return;
                        }
                        onStartEdit(row);
                      }}
                    >
                      <AnimatedEditingLabel active={Boolean(editingTx)} />
                    </button>
                    <button
                      type="button"
                      className={`${DETAIL_ACTION_BTN} ${confirmDeleteTx === row.id ? DELETE_CONFIRM : ""}`}
                      onClick={() => onDeleteClick(row.id)}
                      onBlur={onDeleteBlur}
                    >
                      {confirmDeleteTx === row.id ? "Delete?" : "Delete"}
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
