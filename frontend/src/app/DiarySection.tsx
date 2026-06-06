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
  useDiaryColumnCap,
} from "./shared";
import { BarMetric, EmptyState } from "./screen-helpers";
import { bandNine, diaryPreview, formatEntrySummaryDate } from "./screen-format";

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
    <section className="panel">
      <h1 className="panel-title">Diary</h1>
      <div className="panel-split panel-split--diary">
        <div className="panel-col" ref={leftColRef}>
        <h2 className="entries-heading">New entry</h2>
        <form className="dense-form-grid diary-dense-form" onSubmit={diaryForm.handleSubmit(onSubmit)}>
        <div className="core-col">
          <div className="dense-form-hidden-fields" aria-hidden="true">
            <input type="hidden" {...diaryForm.register("moodLevel", { valueAsNumber: true })} />
            <input type="hidden" {...diaryForm.register("depressionLevel", { valueAsNumber: true })} />
            <input type="hidden" {...diaryForm.register("anxietyLevel", { valueAsNumber: true })} />
          </div>
          <label className="field field-line">
            <span className="field-line-label">Date &amp; time</span>
            <input
              type="datetime-local"
              {...diaryForm.register("dateTime")}
              aria-label="Date/time"
              onClick={(e) => {
                const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                el.showPicker?.();
              }}
            />
          </label>
          <div className="field field-line metric-group-label">
            <span className="field-line-label">Values</span>
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
          <label className="field field-line">
            <span className="field-line-label">Description</span>
            <textarea
              {...diaryForm.register("description")}
              placeholder="What happened today? How did it feel?"
              rows={2}
              aria-label="Description"
            />
          </label>
          <label className="field field-line">
            <span className="field-line-label">Gratitude</span>
            <textarea
              {...diaryForm.register("gratitude")}
              placeholder="One small thing you're glad about…"
              rows={2}
              aria-label="Gratitude"
            />
          </label>
          {editingDiary ? (
            <div className="dense-form-inline-actions">
              <button type="button" onClick={onCancelEdit}>
                Cancel edit
              </button>
            </div>
          ) : null}
        </div>

        <div className="right-col">
          <div className="tags-col">
            <div className="section-head">
              <span className="section-title">Emotions</span>
            </div>
            <nav className="tag-tabs" role="tablist" aria-label="Mood categories">
              {moodTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={moodTab === tab.id}
                  className={moodTab === tab.id ? "active" : ""}
                  onClick={() => setMoodTab(tab.id)}
                >
                  {tab.label}{" "}
                  <span className="count">{tab.count}</span>
                </button>
              ))}
            </nav>
            <div className="tag-panel">
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
          <div className="save-section">
            <button type="submit" className={`btn btn-primary${diaryMutationState.isSuccess ? " is-success-pulse" : ""}`}>
              {diaryMutationState.isSuccess ? "✓ Saved" : editingDiary ? "Update entry" : "Save entry"}
            </button>
          </div>
        </div>
      </form>
        </div>
        <div className="panel-col diary-past-col" ref={pastColRef}>
          {isLoading && <p className="hint">Loading diary entries...</p>}

          <h2 className="entries-heading">Past entries</h2>
          {diaryEntries.length === 0 ? (
            <EmptyState
              title="No diary entries yet"
              description="Use the form above to log your first mood entry. Once you save it, it will appear here."
            />
          ) : (
            <div className="diary-past-entries-stack">
              <div className="diary-past-entries-body" ref={pastEntriesBodyRef}>
                {diaryEntries.map((entry) => {
                const moodBand = bandNine(entry.moodLevel ?? undefined, true);
                return (
                  <details key={entry.id} className="entry-row">
              <summary>
                <span className="date">{formatEntrySummaryDate(entry.entryDate, entry.entryTime)}</span>
                {entry.moodLevel != null ? (
                  <span className={`pain-badge sm${moodBand ? ` ${moodBand}` : ""}`}>{entry.moodLevel}</span>
                ) : (
                  <span className="pain-badge sm muted">—</span>
                )}
                <span className="preview">{diaryPreview(entry)}</span>
                <span />
                <span className="chevron" aria-hidden="true">
                  ▶
                </span>
              </summary>
              <div className="entry-expanded">
                <div className="detail-group">
                  <span className="label">Mood · Dep · Anx</span>
                  <span className="value">
                    {entry.moodLevel ?? "—"} · {entry.depressionLevel ?? "—"} · {entry.anxietyLevel ?? "—"}
                  </span>
                </div>
                <div className="detail-group">
                  <span className="label">Positive</span>
                  <span className="value">
                    {csvToList(entry.positiveMoods).length ? (
                      csvToList(entry.positiveMoods).map((t) => (
                        <span key={t} className="tag-mini">
                          {t}
                        </span>
                      ))
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="detail-group">
                  <span className="label">Negative</span>
                  <span className="value">
                    {csvToList(entry.negativeMoods).length ? (
                      csvToList(entry.negativeMoods).map((t) => (
                        <span key={t} className="tag-mini">
                          {t}
                        </span>
                      ))
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="detail-group">
                  <span className="label">General</span>
                  <span className="value">
                    {csvToList(entry.generalMoods).length ? (
                      csvToList(entry.generalMoods).map((t) => (
                        <span key={t} className="tag-mini">
                          {t}
                        </span>
                      ))
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="detail-group">
                  <span className="label">Description</span>
                  <span className="value">{entry.description || "—"}</span>
                </div>
                <div className="detail-group">
                  <span className="label">Gratitude</span>
                  <span className="value">{entry.gratitude || "—"}</span>
                </div>
                <div className="detail-actions">
                  <button
                    type="button"
                    className={editingDiary?.id === entry.id ? "active is-editing" : editingDiary ? "is-editing" : undefined}
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
                    className={confirmDeleteDiary === entry.id ? "btn-delete-confirm" : ""}
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
              </div>
              <div
                className={`save-section diary-past-footer-slot${pastEntriesOverflow ? " diary-past-more" : ""}`}
                aria-hidden={!pastEntriesOverflow}
              >
                {!isLoading && pastEntriesOverflow ? (
                  <button type="button" className="btn">
                    Show more
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
