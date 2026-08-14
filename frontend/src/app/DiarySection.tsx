import { useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import {
  entryViewLabels,
  csvToList,
  type DiaryEntry,
  type DiaryFormValues,
} from "./core";
import {
  AnimatedEditingLabel,
  MultiSelectField,
} from "./shared";
import { EmptyState, PAGE, PAGE_TITLE } from "./screen-helpers";
import { FLAT_ACTIONS, STAGE, STAGES, STAGE_SPLIT, StageField, StageHead, StageProgress, StageRail, StageScale } from "./staged";
import { bandNine, diaryPreview, formatEntrySummaryDate } from "./screen-format";
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

export function DiarySection({
  diaryForm,
  diaryMutationState,
  isLoading,
  editingDiary,
  moodFieldOptions,
  diaryEntries,
  confirmDeleteDiary,
  onSubmit,
  onCancelEdit,
  onStartEdit,
  onDeleteClick,
  onDeleteBlur,
  view,
  onViewChange,
}: {
  diaryForm: UseFormReturn<DiaryFormValues>;
  diaryMutationState: { isSuccess: boolean };
  isLoading: boolean;
  editingDiary: DiaryEntry | null;
  moodFieldOptions: { positive_moods: string[]; negative_moods: string[]; general_moods: string[] };
  diaryEntries: DiaryEntry[];
  confirmDeleteDiary: number | null;
  onSubmit: (values: DiaryFormValues) => void;
  onCancelEdit: () => void;
  onStartEdit: (entry: DiaryEntry) => void;
  onDeleteClick: (id: number) => void;
  onDeleteBlur: () => void;
  view: EntryView;
  onViewChange: (next: EntryView) => void;
}) {
  const [moodTab, setMoodTab] = useState<"positive" | "negative" | "general">("positive");

  const moodLevels = diaryForm.watch(["moodLevel", "depressionLevel", "anxietyLevel"]);
  const [moodLevel, depressionLevel, anxietyLevel] = moodLevels;
  const positiveMoods = diaryForm.watch("positiveMoods");
  const negativeMoods = diaryForm.watch("negativeMoods");
  const generalMoods = diaryForm.watch("generalMoods");

  // Touched, not filled: a default the reader never chose is not progress.
  const touched = diaryForm.formState.dirtyFields;
  const steps = [
    { title: "How you feel", done: !!(touched.moodLevel || touched.depressionLevel || touched.anxietyLevel) },
    { title: "Emotions", done: !!(touched.positiveMoods || touched.negativeMoods || touched.generalMoods) },
    { title: "In your words", done: !!(touched.description || touched.gratitude) },
  ];

  const moodTabs = [
    { id: "positive" as const, label: "Positive", count: csvToList(positiveMoods).length },
    { id: "negative" as const, label: "Negative", count: csvToList(negativeMoods).length },
    { id: "general" as const, label: "General", count: csvToList(generalMoods).length },
  ];


  return (
    <section className={PAGE}>
      {view === "new" ? (
      <form onSubmit={diaryForm.handleSubmit(onSubmit)} className={STAGE_SPLIT}>
        <div className="sr-only" aria-hidden="true">
          <input type="hidden" {...diaryForm.register("moodLevel", { valueAsNumber: true })} />
          <input type="hidden" {...diaryForm.register("depressionLevel", { valueAsNumber: true })} />
          <input type="hidden" {...diaryForm.register("anxietyLevel", { valueAsNumber: true })} />
        </div>

        <StageProgress steps={steps} />
        <StageRail
          steps={steps}
          heading={
            <div className="grid gap-page content-start">
              <EntryViewTabs view={view} onChange={onViewChange} labels={entryViewLabels["diary"]} className="inline-flex max-mobile:hidden" />
              <h1 className={PAGE_TITLE}>Diary</h1>
            </div>
          }
        >
          <FieldLine
            label="Date & time"
            id="diary-datetime"
            type="datetime-local"
            className="w-full max-w-full cursor-pointer tabular-nums [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
            {...diaryForm.register("dateTime")}
            aria-label="Date/time"
            onClick={(e) => {
              const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
              el.showPicker?.();
            }}
          />
        </StageRail>

        <div className={STAGES}>
          <section className={STAGE}>
            <StageHead step={1} title="How you feel" />
            <StageField label="Mood">
              <StageScale
                label="Mood"
                value={moodLevel ?? null}
                higherIsBetter
                onChange={(next) => diaryForm.setValue("moodLevel", next, { shouldDirty: true })}
                ends={["heavy", "okay", "great"]}
              />
            </StageField>
            <StageField label="Depression">
              <StageScale
                label="Depression"
                value={depressionLevel ?? null}
                onChange={(next) => diaryForm.setValue("depressionLevel", next, { shouldDirty: true })}
                ends={["none", "present", "crushing"]}
              />
            </StageField>
            <StageField label="Anxiety">
              <StageScale
                label="Anxiety"
                value={anxietyLevel ?? null}
                onChange={(next) => diaryForm.setValue("anxietyLevel", next, { shouldDirty: true })}
                ends={["calm", "tense", "panicked"]}
              />
            </StageField>
          </section>

          <section className={STAGE}>
            <StageHead step={2} title="Emotions" aside="optional" />
            <TagTabs tabs={moodTabs} active={moodTab} onSelect={setMoodTab} ariaLabel="Mood categories" />
            {moodTab === "positive" ? (
              <MultiSelectField
                hideLabel
                label="Positive"
                fieldKey="positive_moods"
                value={positiveMoods}
                options={moodFieldOptions.positive_moods}
                onChange={(next) => diaryForm.setValue("positiveMoods", next, { shouldDirty: true })}
                domain="mood"
              />
            ) : null}
            {moodTab === "negative" ? (
              <MultiSelectField
                hideLabel
                label="Negative"
                fieldKey="negative_moods"
                value={negativeMoods}
                options={moodFieldOptions.negative_moods}
                onChange={(next) => diaryForm.setValue("negativeMoods", next, { shouldDirty: true })}
                domain="mood"
              />
            ) : null}
            {moodTab === "general" ? (
              <MultiSelectField
                hideLabel
                label="General"
                fieldKey="general_moods"
                value={generalMoods}
                options={moodFieldOptions.general_moods}
                onChange={(next) => diaryForm.setValue("generalMoods", next, { shouldDirty: true })}
                domain="mood"
              />
            ) : null}
          </section>

          <section className={STAGE}>
            <StageHead step={3} title="In your words" aside="optional" />
            <StageField label="Description" prompt="What happened today? How did it feel?" htmlFor="diary-description">
              <textarea id="diary-description" rows={4} className={FIELD_LINE_INPUT} {...diaryForm.register("description")} />
            </StageField>
            <StageField label="Gratitude" prompt="One small thing you're glad about." htmlFor="diary-gratitude">
              <textarea id="diary-gratitude" rows={2} className={FIELD_LINE_INPUT} {...diaryForm.register("gratitude")} />
            </StageField>
          </section>


          {/* The end of the form, at the end of the form: Save is what
              closes the thing you were filling in, not a piece of the
              navigation beside it. */}
          <div className={FLAT_ACTIONS}>
            {editingDiary ? <Button type="button" onClick={onCancelEdit}>Cancel edit</Button> : null}
            <Button type="submit" variant={diaryMutationState.isSuccess ? "success" : "primary"}>
              {diaryMutationState.isSuccess ? "✓ Saved" : editingDiary ? "Update entry" : "Save entry"}
            </Button>
          </div>
        </div>
      </form>
      ) : (
      <div className="grid gap-page content-start min-w-0">
        <div className="grid gap-page content-start">
          <EntryViewTabs view={view} onChange={onViewChange} labels={entryViewLabels["diary"]} className="inline-flex max-mobile:hidden" />
          <h1 className={PAGE_TITLE}>Diary</h1>
        </div>
      <PastEntries
        isLoading={isLoading}
        loadingText="Loading diary entries..."
        isEmpty={diaryEntries.length === 0}
        emptyState={
          <EmptyState
            title="No diary entries yet"
            description="Nothing saved yet. Open New entry to log how today felt; saved entries land here."
          />
        }
      >
        <EntryMonths
          rows={diaryEntries}
          dateOf={(entry) => entry.entryDate}
          renderRow={(entry) => {
          const moodBand = bandNine(entry.moodLevel ?? undefined, true);
          return (
            <details key={entry.id} className={ENTRY_ROW}>
              <summary className={ENTRY_SUMMARY}>
                <span className={ENTRY_DATE}>{formatEntrySummaryDate(entry.entryDate, entry.entryTime)}</span>
                {entry.moodLevel != null ? (
                  <PainBadge variant={moodBand || "muted"} sm>{entry.moodLevel}</PainBadge>
                ) : (
                  <PainBadge variant="muted" sm>—</PainBadge>
                )}
                <span className={ENTRY_PREVIEW}>{diaryPreview(entry)}</span>
                <span />
                <span className={ENTRY_CHEVRON} aria-hidden="true">▶</span>
              </summary>
              <div className={ENTRY_EXPANDED}>
                <DetailGroup label="Mood · Dep · Anx">
                  {entry.moodLevel ?? "—"} · {entry.depressionLevel ?? "—"} · {entry.anxietyLevel ?? "—"}
                </DetailGroup>
                <DetailGroup label="Positive"><TagList items={csvToList(entry.positiveMoods)} /></DetailGroup>
                <DetailGroup label="Negative"><TagList items={csvToList(entry.negativeMoods)} /></DetailGroup>
                <DetailGroup label="General"><TagList items={csvToList(entry.generalMoods)} /></DetailGroup>
                <DetailGroup label="Description">{entry.description || "—"}</DetailGroup>
                <DetailGroup label="Gratitude">{entry.gratitude || "—"}</DetailGroup>
                <div className={DETAIL_ACTIONS}>
                  <button
                    type="button"
                    className={DETAIL_ACTION_BTN}
                    onClick={() => {
                      if (editingDiary?.id === entry.id) {
                        onCancelEdit();
                        return;
                      }
                      onStartEdit(entry);
                      // Editing means going back to the form, which the log view is not
                      // showing: filling a form nobody can see is not an edit.
                      onViewChange("new");
                    }}
                  >
                    <AnimatedEditingLabel active={editingDiary?.id === entry.id} />
                  </button>
                  <button
                    type="button"
                    className={`${DETAIL_ACTION_BTN} ${confirmDeleteDiary === entry.id ? DELETE_CONFIRM : ""}`}
                    onClick={() => onDeleteClick(entry.id)}
                    onBlur={onDeleteBlur}
                  >
                    {confirmDeleteDiary === entry.id ? "Delete?" : "Delete"}
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
