import { useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import {
  csvToList,
  type PainEntry,
  type PainFieldKey,
  type PainFormValues,
} from "./core";
import {
  AnimatedEditingLabel,
  MultiSelectField,
  SectionHead,
} from "./shared";
import { BarMetric, CoffeeStepper, EmptyState, PAGE, PAGE_TITLE } from "./screen-helpers";
import { bandNine, painPreview, formatEntrySummaryDate } from "./screen-format";
import { Button } from "../components/ui/Button";
import { FieldLine, FIELD_LINE_LABEL } from "../components/ui/FieldLine";
import {
  DELETE_CONFIRM,
  DATETIME_FIELD,
  DETAIL_ACTIONS,
  DETAIL_ACTION_BTN,
  DetailGroup,
  EntriesHeading,
  FORM_COL,
  FORM_SPLIT,
  ENTRY_CHEVRON,
  ENTRY_DATE,
  ENTRY_EXPANDED,
  ENTRY_PREVIEW,
  ENTRY_ROW,
  ENTRY_SUMMARY,
  PainBadge,
  PastEntries,
  TagList,
  TagTabs,
} from "./entries";

const PAIN_TABS: { id: PainFieldKey; label: string }[] = [
  { id: "area", label: "Area" },
  { id: "symptoms", label: "Symptoms" },
  { id: "activities", label: "Activities" },
  { id: "medicines", label: "Medicines" },
  { id: "habits", label: "Habits" },
  { id: "other", label: "Other" },
];

export function PainSection({
  painForm,
  painMutationState,
  isLoading,
  editingPain,
  painFieldOptions,
  watchedValues,
  painEntries,
  confirmDeletePain,
  onSubmit,
  onCancelEdit,
  onStartEdit,
  onDeleteClick,
  onDeleteBlur,
}: {
  painForm: UseFormReturn<PainFormValues>;
  painMutationState: { isSuccess: boolean };
  isLoading: boolean;
  editingPain: PainEntry | null;
  painFieldOptions: { area: string[]; symptoms: string[]; activities: string[]; medicines: string[]; habits: string[]; other: string[] };
  watchedValues: { area: string; symptoms: string; activities: string; medicines: string; habits: string; other: string };
  painEntries: PainEntry[];
  confirmDeletePain: number | null;
  onSubmit: (values: PainFormValues) => void;
  onCancelEdit: () => void;
  onStartEdit: (entry: PainEntry) => void;
  onDeleteClick: (id: number) => void;
  onDeleteBlur: () => void;
}) {
  const [painTab, setPainTab] = useState<PainFieldKey>("area");
  const [painLevel, fatigueLevel, coffeeCount] = painForm.watch(["painLevel", "fatigueLevel", "coffeeCount"]);

  const painTabCounts: Record<PainFieldKey, number> = {
    area: csvToList(watchedValues.area).length,
    symptoms: csvToList(watchedValues.symptoms).length,
    activities: csvToList(watchedValues.activities).length,
    medicines: csvToList(watchedValues.medicines).length,
    habits: csvToList(watchedValues.habits).length,
    other: csvToList(watchedValues.other).length,
  };

  const painOptionsForTab = (id: PainFieldKey) => painFieldOptions[id];


  const tabLabel = PAIN_TABS.find((t) => t.id === painTab)?.label ?? "";
  const painDetails: { label: string; key: PainFieldKey }[] = [
    { label: "Area", key: "area" },
    { label: "Symptoms", key: "symptoms" },
    { label: "Activities", key: "activities" },
    { label: "Medicines", key: "medicines" },
    { label: "Habits", key: "habits" },
    { label: "Other", key: "other" },
  ];

  return (
    <section className={PAGE}>
      <h1 className={PAGE_TITLE}>Pain</h1>
      <div className="min-w-0 border-b border-border">
        <EntriesHeading className="mt-0">New entry</EntriesHeading>
        <form onSubmit={painForm.handleSubmit(onSubmit)}>
          <div className={FORM_SPLIT}>
            <div className="sr-only" aria-hidden="true">
              <input type="hidden" {...painForm.register("painLevel", { valueAsNumber: true })} />
              <input type="hidden" {...painForm.register("fatigueLevel", { valueAsNumber: true })} />
              <input type="hidden" {...painForm.register("coffeeCount", { valueAsNumber: true })} />
            </div>
            {/* Wide column: the metrics and the tag strip, whose six tabs
                need the room to stay on one line. */}
            <div className={FORM_COL}>
            <div className="grid gap-2 content-start">
              <span className={FIELD_LINE_LABEL}>Values</span>
              <BarMetric
                label="Pain level"
                value={painLevel ?? null}
                onChange={(next) => painForm.setValue("painLevel", next, { shouldDirty: true })}
              />
              <BarMetric
                label="Fatigue"
                value={fatigueLevel ?? null}
                onChange={(next) => painForm.setValue("fatigueLevel", next, { shouldDirty: true })}
              />
              <CoffeeStepper value={coffeeCount ?? null} onChange={(next) => painForm.setValue("coffeeCount", next, { shouldDirty: true })} />
            </div>
            <div className="grid gap-3 content-start min-w-0">
              <SectionHead title="Factors" variant="tags" />
              <TagTabs
                tabs={PAIN_TABS.map((t) => ({ id: t.id, label: t.label, count: painTabCounts[t.id] }))}
                active={painTab}
                onSelect={setPainTab}
                ariaLabel="Pain categories"
              />
              <div className="grid gap-3">
                <MultiSelectField
                  hideLabel
                  label={tabLabel}
                  fieldKey={painTab}
                  value={watchedValues[painTab]}
                  options={painOptionsForTab(painTab)}
                  onChange={(next) => painForm.setValue(painTab, next, { shouldDirty: true })}
                />
              </div>
            </div>
            </div>

            {/* Narrow column: a date and free text both read fine narrow. */}
            <div className={FORM_COL}>
            <FieldLine
              label="Date & time"
              type="datetime-local"
              className={DATETIME_FIELD}
              {...painForm.register("dateTime")}
              aria-label="Date/time"
              onClick={(e) => {
                const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                el.showPicker?.();
              }}
            />
            <FieldLine
              label="Note"
              multiline
              rows={2}
              {...painForm.register("note")}
              placeholder="Anything worth remembering about this flare…"
              aria-label="Note"
            />
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-2">
            {editingPain ? (
              <Button type="button" onClick={onCancelEdit}>
                Cancel edit
              </Button>
            ) : null}
            <Button type="submit" variant={painMutationState.isSuccess ? "success" : "primary"} >
              {painMutationState.isSuccess ? "✓ Saved" : editingPain ? "Update entry" : "Save entry"}
            </Button>
          </div>
        </form>
      </div>
      <PastEntries
        title="Past entries"
        isLoading={isLoading}
        loadingText="Loading pain entries..."
        isEmpty={painEntries.length === 0}
        emptyState={
          <EmptyState
            title="No pain entries yet"
            description="Track your first session with the form above. Your pain history will show up here once you save it."
          />
        }
      >
        {painEntries.map((entry) => {
          const painBand = bandNine(entry.painLevel ?? undefined);
          return (
            <details key={entry.id} className={ENTRY_ROW}>
              <summary className={ENTRY_SUMMARY}>
                <span className={ENTRY_DATE}>{formatEntrySummaryDate(entry.entryDate, entry.entryTime)}</span>
                {entry.painLevel != null ? (
                  <PainBadge variant={painBand || "muted"} sm>{entry.painLevel}</PainBadge>
                ) : (
                  <PainBadge variant="muted" sm>—</PainBadge>
                )}
                <span className={ENTRY_PREVIEW}>{painPreview(entry)}</span>
                <span />
                <span className={ENTRY_CHEVRON} aria-hidden="true">▶</span>
              </summary>
              <div className={ENTRY_EXPANDED}>
                <DetailGroup label="Pain · Fatigue · Coffee">
                  {entry.painLevel ?? "—"} · {entry.fatigueLevel ?? "—"} · {entry.coffeeCount ?? "—"}
                </DetailGroup>
                {painDetails.map((d) => (
                  <DetailGroup key={d.key} label={d.label}>
                    <TagList items={csvToList(entry[d.key])} />
                  </DetailGroup>
                ))}
                <DetailGroup label="Note">{entry.note || "—"}</DetailGroup>
                <div className={DETAIL_ACTIONS}>
                  <button
                    type="button"
                    className={DETAIL_ACTION_BTN}
                    onClick={() => {
                      if (editingPain?.id === entry.id) {
                        onCancelEdit();
                        return;
                      }
                      onStartEdit(entry);
                    }}
                  >
                    <AnimatedEditingLabel active={editingPain?.id === entry.id} />
                  </button>
                  <button
                    type="button"
                    className={`${DETAIL_ACTION_BTN} ${confirmDeletePain === entry.id ? DELETE_CONFIRM : ""}`}
                    onClick={() => onDeleteClick(entry.id)}
                    onBlur={onDeleteBlur}
                  >
                    {confirmDeletePain === entry.id ? "Delete?" : "Delete"}
                  </button>
                </div>
              </div>
            </details>
          );
        })}
      </PastEntries>
    </section>
  );
}
