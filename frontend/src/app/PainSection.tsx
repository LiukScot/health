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
} from "./shared";
import { EmptyState, PAGE, PAGE_TITLE } from "./screen-helpers";
import { STAGE, STAGES, STAGE_SPLIT, StageField, StageHead, StageProgress, StageRail, StageScale, StageStepper } from "./staged";
import { bandNine, painPreview, formatEntrySummaryDate } from "./screen-format";
import { Button } from "../components/ui/Button";
import { FieldLine, FIELD_LINE_INPUT } from "../components/ui/FieldLine";
import {
  DELETE_CONFIRM,
  DETAIL_ACTIONS,
  DETAIL_ACTION_BTN,
  DetailGroup,
  ENTRY_CHEVRON,
  ENTRY_DATE,
  ENTRY_EXPANDED,
  ENTRY_PREVIEW,
  ENTRY_ROW,
  ENTRY_SUMMARY,
  PainBadge,
  PastEntries,
  EntryMonths,
  EntryViewTabs,
  type EntryView,
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
  view,
  onViewChange,
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
  view: EntryView;
  onViewChange: (next: EntryView) => void;
}) {
  const [painTab, setPainTab] = useState<PainFieldKey>("area");
  // Which stage the rail highlights. Clicking a step scrolls to it; the
  // stages all stay rendered, so this only drives the highlight.
  const [stage, setStage] = useState(-1);

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


  /*
   * Touched, not filled. Medicines arrive preselected from Settings, so a
   * value-based check marked stage 2 done before the reader had done
   * anything — a tick that says "handled" about a default.
   */
  const touched = painForm.formState.dirtyFields;
  const steps = [
    { title: "How bad", done: !!(touched.painLevel || touched.fatigueLevel || touched.coffeeCount) },
    { title: "Where & what", done: PAIN_TABS.some((t) => touched[t.id]) },
    { title: "Details", done: !!touched.note },
  ];

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
      {view === "new" ? (
      <form onSubmit={painForm.handleSubmit(onSubmit)} className={STAGE_SPLIT}>
        <div className="sr-only" aria-hidden="true">
          <input type="hidden" {...painForm.register("painLevel", { valueAsNumber: true })} />
          <input type="hidden" {...painForm.register("fatigueLevel", { valueAsNumber: true })} />
          <input type="hidden" {...painForm.register("coffeeCount", { valueAsNumber: true })} />
        </div>

        <StageProgress steps={steps} current={stage} />
        <StageRail
          steps={steps}
          current={stage}
          onJump={setStage}
          heading={
            <div className="grid gap-5 content-start">
              <EntryViewTabs view={view} onChange={onViewChange} className="inline-flex max-mobile:hidden" />
              <h1 className={PAGE_TITLE}>Pain</h1>
            </div>
          }
        >
          <FieldLine
            label="Date & time"
            type="datetime-local"
            className="w-full max-w-full cursor-pointer tabular-nums [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
            {...painForm.register("dateTime")}
            aria-label="Date/time"
            onClick={(e) => {
              const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
              el.showPicker?.();
            }}
          />
          <Button type="submit" variant={painMutationState.isSuccess ? "success" : "primary"}>
            {painMutationState.isSuccess ? "✓ Saved" : editingPain ? "Update entry" : "Save entry"}
          </Button>
          {editingPain ? (
            <Button type="button" onClick={onCancelEdit}>Cancel edit</Button>
          ) : null}
        </StageRail>

        <div className={STAGES}>
          <section className={STAGE}>
            <StageHead step={1} title="How bad is it?" />
            <StageField label="Pain level">
              <StageScale
                label="Pain level"
                value={painLevel ?? null}
                onChange={(next) => painForm.setValue("painLevel", next, { shouldDirty: true })}
                ends={["mild", "moderate", "severe"]}
              />
            </StageField>
            <StageField label="Fatigue">
              <StageScale
                label="Fatigue"
                value={fatigueLevel ?? null}
                onChange={(next) => painForm.setValue("fatigueLevel", next, { shouldDirty: true })}
                ends={["fresh", "tired", "drained"]}
              />
            </StageField>
            <StageField label="Coffee today">
              <StageStepper label="coffee" value={coffeeCount ?? null} onChange={(next) => painForm.setValue("coffeeCount", next, { shouldDirty: true })} />
            </StageField>
          </section>

          <section className={STAGE}>
            <StageHead step={2} title="Where & what" aside="optional" />
            <TagTabs
              tabs={PAIN_TABS.map((t) => ({ id: t.id, label: t.label, count: painTabCounts[t.id] }))}
              active={painTab}
              onSelect={setPainTab}
              ariaLabel="Pain categories"
            />
            <MultiSelectField
              hideLabel
              label={tabLabel}
              fieldKey={painTab}
              value={watchedValues[painTab]}
              options={painOptionsForTab(painTab)}
              onChange={(next) => painForm.setValue(painTab, next, { shouldDirty: true })}
            />
          </section>

          <section className={STAGE}>
            <StageHead step={3} title="Details" aside="optional" />
            <StageField label="Note" prompt="Anything worth remembering about this flare." htmlFor="pain-note">
              <textarea
                id="pain-note"
                rows={3}
                className={FIELD_LINE_INPUT}
                {...painForm.register("note")}
              />
            </StageField>
          </section>

        </div>
      </form>
      ) : (
      <div className="grid gap-page content-start min-w-0">
        <div className="grid gap-5 content-start">
          <EntryViewTabs view={view} onChange={onViewChange} className="inline-flex max-mobile:hidden" />
          <h1 className={PAGE_TITLE}>Pain</h1>
        </div>
      <PastEntries
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
        <EntryMonths
          rows={painEntries}
          dateOf={(entry) => entry.entryDate}
          renderRow={(entry) => {
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
                <DetailGroup
                  label="Pain · Fatigue · Coffee"
                  empty={entry.painLevel == null && entry.fatigueLevel == null && entry.coffeeCount == null}
                >
                  {entry.painLevel ?? "—"} · {entry.fatigueLevel ?? "—"} · {entry.coffeeCount ?? "—"}
                </DetailGroup>
                {painDetails.map((d) => (
                  <DetailGroup key={d.key} label={d.label} empty={csvToList(entry[d.key]).length === 0}>
                    <TagList items={csvToList(entry[d.key])} />
                  </DetailGroup>
                ))}
                <DetailGroup label="Note">{entry.note}</DetailGroup>
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
        }}
        />
      </PastEntries>
      </div>
      )}
    </section>
  );
}
