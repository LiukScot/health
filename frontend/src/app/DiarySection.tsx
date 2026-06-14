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
  useDiaryColumnCap,
} from "./shared";
import { BarMetric, EmptyState } from "./screen-helpers";
import { bandNine, diaryPreview, formatEntrySummaryDate } from "./screen-format";
import { Button } from "../components/ui/Button";
import { FieldLine, FIELD_LINE_LABEL } from "../components/ui/FieldLine";
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
  PastEntriesColumn,
  TagList,
  TagTabs,
} from "./entries";

const DATETIME_FIELD =
  "!w-auto max-w-full justify-self-start cursor-pointer tabular-nums [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-inline [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100";

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

  const {
    leftColRef,
    pastColRef,
    pastEntriesBodyRef,
    overflow: pastEntriesOverflow,
  } = useDiaryColumnCap(diaryEntries, isLoading);

  return (
    <section className="@container p-inline">
      <h1 className="m-0 mb-stack text-[22px] font-bold tracking-[-0.02em] text-text">Diary</h1>
      <div className="grid gap-page min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[1100px]:gap-split min-[1100px]:items-start">
        <div className="min-w-0 max-[1099px]:border-b max-[1099px]:border-[var(--border-soft)]" ref={leftColRef}>
          <EntriesHeading className="min-[1100px]:mt-0">New entry</EntriesHeading>
          <form className="mb-inline" onSubmit={diaryForm.handleSubmit(onSubmit)}>
            <div className="grid gap-stack content-start min-w-0">
              <div className="sr-only" aria-hidden="true">
                <input type="hidden" {...diaryForm.register("moodLevel", { valueAsNumber: true })} />
                <input type="hidden" {...diaryForm.register("depressionLevel", { valueAsNumber: true })} />
                <input type="hidden" {...diaryForm.register("anxietyLevel", { valueAsNumber: true })} />
              </div>
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
              <div className="grid gap-inline content-start">
                <span className={FIELD_LINE_LABEL}>Values</span>
              </div>
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
              {editingDiary ? (
                <div className="flex gap-inline flex-wrap">
                  <button type="button" onClick={onCancelEdit}>
                    Cancel edit
                  </button>
                </div>
              ) : null}
            </div>

            <div className="grid gap-block min-w-0 pt-block">
              <div className="grid gap-stack">
                <SectionHead title="Emotions" variant="tags" />
                <TagTabs tabs={moodTabs} active={moodTab} onSelect={setMoodTab} ariaLabel="Mood categories" />
                <div className="grid gap-stack">
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
              <div className="flex justify-end pt-inline">
                <Button type="submit" variant={diaryMutationState.isSuccess ? "success" : "primary"} className="mb-block">
                  {diaryMutationState.isSuccess ? "✓ Saved" : editingDiary ? "Update entry" : "Save entry"}
                </Button>
              </div>
            </div>
          </form>
        </div>
        <PastEntriesColumn
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
          overflow={pastEntriesOverflow}
          colRef={pastColRef}
          bodyRef={pastEntriesBodyRef}
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
                        if (editingDiary) {
                          onCancelEdit();
                          return;
                        }
                        onStartEdit(entry);
                      }}
                    >
                      <AnimatedEditingLabel active={Boolean(editingDiary)} />
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
        </PastEntriesColumn>
      </div>
    </section>
  );
}
