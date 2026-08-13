import { useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import {
  csvToList,
  type DiaryEntry,
  type DiaryFormValues,
} from "./core";
import {
  AnimatedEditingLabel,
  MultiSelectField,
  SectionHead,
} from "./shared";
import { BarMetric, EmptyState, PAGE, PAGE_TITLE } from "./screen-helpers";
import { bandNine, diaryPreview, formatEntrySummaryDate } from "./screen-format";
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
}) {
  const [moodTab, setMoodTab] = useState<"positive" | "negative" | "general">("positive");
  const moodLevels = diaryForm.watch(["moodLevel", "depressionLevel", "anxietyLevel"]);
  const [moodLevel, depressionLevel, anxietyLevel] = moodLevels;
  const positiveMoods = diaryForm.watch("positiveMoods");
  const negativeMoods = diaryForm.watch("negativeMoods");
  const generalMoods = diaryForm.watch("generalMoods");

  const moodTabs = [
    { id: "positive" as const, label: "Positive", count: csvToList(positiveMoods).length },
    { id: "negative" as const, label: "Negative", count: csvToList(negativeMoods).length },
    { id: "general" as const, label: "General", count: csvToList(generalMoods).length },
  ];


  return (
    <section className={PAGE}>
      <h1 className={PAGE_TITLE}>Diary</h1>
      <div className="min-w-0 border-b border-border">
        <EntriesHeading className="mt-0">New entry</EntriesHeading>
        <form onSubmit={diaryForm.handleSubmit(onSubmit)}>
          <div className={FORM_SPLIT}>
            <div className="sr-only" aria-hidden="true">
              <input type="hidden" {...diaryForm.register("moodLevel", { valueAsNumber: true })} />
              <input type="hidden" {...diaryForm.register("depressionLevel", { valueAsNumber: true })} />
              <input type="hidden" {...diaryForm.register("anxietyLevel", { valueAsNumber: true })} />
            </div>
            {/* Wide column: what you fill on every entry. */}
            <div className={FORM_COL}>
            <div className="grid gap-2 content-start">
              <span className={FIELD_LINE_LABEL}>Values</span>
              <BarMetric
                label="Mood"
                value={moodLevel ?? null}
                fractionDigits={1}
                higherIsBetter
                onChange={(next) => diaryForm.setValue("moodLevel", next, { shouldDirty: true })}
              />
              <BarMetric
                label="Depression"
                value={depressionLevel ?? null}
                onChange={(next) => diaryForm.setValue("depressionLevel", next, { shouldDirty: true })}
              />
              <BarMetric
                label="Anxiety"
                value={anxietyLevel ?? null}
                onChange={(next) => diaryForm.setValue("anxietyLevel", next, { shouldDirty: true })}
              />
            </div>
            <FieldLine
              label="Description"
              multiline
              rows={2}
              {...diaryForm.register("description")}
              placeholder="What happened today? How did it feel?"
              aria-label="Description"
            />
            <FieldLine
              label="Gratitude"
              multiline
              rows={2}
              {...diaryForm.register("gratitude")}
              placeholder="One small thing you're glad about…"
              aria-label="Gratitude"
            />
            </div>

            {/* Narrow column: the date is usually already right, and the
                emotion picker is where you go when something changed. */}
            <div className={FORM_COL}>
            <FieldLine
              label="Date & time"
              type="datetime-local"
              className={DATETIME_FIELD}
              {...diaryForm.register("dateTime")}
              aria-label="Date/time"
              onClick={(e) => {
                const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                el.showPicker?.();
              }}
            />
            <div className="grid gap-3">
              <SectionHead title="Emotions" variant="tags" />
              <TagTabs tabs={moodTabs} active={moodTab} onSelect={setMoodTab} ariaLabel="Mood categories" />
              <div className="grid gap-3">
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
              </div>
            </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-2">
            {editingDiary ? (
              <Button type="button" onClick={onCancelEdit}>
                Cancel edit
              </Button>
            ) : null}
            <Button type="submit" variant={diaryMutationState.isSuccess ? "success" : "primary"} >
              {diaryMutationState.isSuccess ? "✓ Saved" : editingDiary ? "Update entry" : "Save entry"}
            </Button>
          </div>
        </form>
      </div>
      <PastEntries
        title="Past entries"
        isLoading={isLoading}
        loadingText="Loading diary entries..."
        isEmpty={diaryEntries.length === 0}
        emptyState={
          <EmptyState
            title="No diary entries yet"
            description="Use the form above to log your first mood entry. Once you save it, it will appear here."
          />
        }
      >
        {diaryEntries.map((entry) => {
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
        })}
      </PastEntries>
    </section>
  );
}
