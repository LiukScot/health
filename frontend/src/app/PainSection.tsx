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
  useDiaryColumnCap,
} from "./shared";
import { BarMetric, CoffeeStepper, EmptyState, bandNine, painPreview, formatEntrySummaryDate } from "./screen-helpers";

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

  const {
    leftColRef,
    pastColRef,
    pastEntriesBodyRef,
    overflow: pastEntriesOverflow,
  } = useDiaryColumnCap(painEntries, isLoading);

  return (
    <section className="panel">
      <h1 className="panel-title">Pain</h1>
      <div className="panel-split panel-split--diary">
        <div className="panel-col" ref={leftColRef}>
        <h2 className="entries-heading">New entry</h2>
        <form className="dense-form-grid pain-dense-form" onSubmit={painForm.handleSubmit(onSubmit)}>
        <div className="core-col">
          <div className="dense-form-hidden-fields" aria-hidden="true">
            <input type="hidden" {...painForm.register("painLevel", { valueAsNumber: true })} />
            <input type="hidden" {...painForm.register("fatigueLevel", { valueAsNumber: true })} />
            <input type="hidden" {...painForm.register("coffeeCount", { valueAsNumber: true })} />
          </div>
          <label className="field field-line">
            <span className="field-line-label">Date &amp; time</span>
            <input
              type="datetime-local"
              {...painForm.register("dateTime")}
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
          <label className="field field-line">
            <span className="field-line-label">Note</span>
            <textarea
              {...painForm.register("note")}
              placeholder="Anything worth remembering about this flare…"
              rows={2}
              aria-label="Note"
            />
          </label>
          {editingPain ? (
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
              <span className="section-title">Factors</span>
            </div>
            <nav className="tag-tabs" role="tablist" aria-label="Pain categories">
              {PAIN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={painTab === tab.id}
                  className={painTab === tab.id ? "active" : ""}
                  onClick={() => setPainTab(tab.id)}
                >
                  {tab.label}{" "}
                  <span className="count">{painTabCounts[tab.id]}</span>
                </button>
              ))}
            </nav>
            <div className="tag-panel">
              {painTab === "area" ? (
                <MultiSelectField
                  hideLabel
                  label="Area"
                  fieldKey="area"
                  value={watchedValues.area}
                  options={painOptionsForTab("area")}
                  onChange={(next) => painForm.setValue("area", next, { shouldDirty: true })}
                />
              ) : null}
              {painTab === "symptoms" ? (
                <MultiSelectField
                  hideLabel
                  label="Symptoms"
                  fieldKey="symptoms"
                  value={watchedValues.symptoms}
                  options={painOptionsForTab("symptoms")}
                  onChange={(next) => painForm.setValue("symptoms", next, { shouldDirty: true })}
                />
              ) : null}
              {painTab === "activities" ? (
                <MultiSelectField
                  hideLabel
                  label="Activities"
                  fieldKey="activities"
                  value={watchedValues.activities}
                  options={painOptionsForTab("activities")}
                  onChange={(next) => painForm.setValue("activities", next, { shouldDirty: true })}
                />
              ) : null}
              {painTab === "medicines" ? (
                <MultiSelectField
                  hideLabel
                  label="Medicines"
                  fieldKey="medicines"
                  value={watchedValues.medicines}
                  options={painOptionsForTab("medicines")}
                  onChange={(next) => painForm.setValue("medicines", next, { shouldDirty: true })}
                />
              ) : null}
              {painTab === "habits" ? (
                <MultiSelectField
                  hideLabel
                  label="Habits"
                  fieldKey="habits"
                  value={watchedValues.habits}
                  options={painOptionsForTab("habits")}
                  onChange={(next) => painForm.setValue("habits", next, { shouldDirty: true })}
                />
              ) : null}
              {painTab === "other" ? (
                <MultiSelectField
                  hideLabel
                  label="Other"
                  fieldKey="other"
                  value={watchedValues.other}
                  options={painOptionsForTab("other")}
                  onChange={(next) => painForm.setValue("other", next, { shouldDirty: true })}
                />
              ) : null}
            </div>
          </div>
          <div className="save-section">
            <button type="submit" className={`btn btn-primary${painMutationState.isSuccess ? " is-success-pulse" : ""}`}>
              {painMutationState.isSuccess ? "✓ Saved" : editingPain ? "Update entry" : "Save entry"}
            </button>
          </div>
        </div>
      </form>
        </div>
        <div className="panel-col diary-past-col" ref={pastColRef}>
      {isLoading && <p className="hint">Loading pain entries...</p>}

      <h2 className="entries-heading">Past entries</h2>
      {painEntries.length === 0 ? (
        <EmptyState
          title="No pain entries yet"
          description="Track your first session with the form above. Your pain history will show up here once you save it."
        />
      ) : (
        <div className="diary-past-entries-stack">
          <div className="diary-past-entries-body" ref={pastEntriesBodyRef}>
            {painEntries.map((entry) => {
          const painBand = bandNine(entry.painLevel ?? undefined);
          return (
            <details key={entry.id} className="entry-row">
              <summary>
                <span className="date">{formatEntrySummaryDate(entry.entryDate, entry.entryTime)}</span>
                {entry.painLevel != null ? (
                  <span className={`pain-badge sm${painBand ? ` ${painBand}` : ""}`}>{entry.painLevel}</span>
                ) : (
                  <span className="pain-badge sm muted">—</span>
                )}
                <span className="preview">{painPreview(entry)}</span>
                <span />
                <span className="chevron" aria-hidden="true">
                  ▶
                </span>
              </summary>
              <div className="entry-expanded">
                <div className="detail-group">
                  <span className="label">Pain · Fatigue · Coffee</span>
                  <span className="value">
                    {entry.painLevel ?? "—"} · {entry.fatigueLevel ?? "—"} · {entry.coffeeCount ?? "—"}
                  </span>
                </div>
                <div className="detail-group">
                  <span className="label">Area</span>
                  <span className="value">
                    {csvToList(entry.area).length ? (
                      csvToList(entry.area).map((t) => (
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
                  <span className="label">Symptoms</span>
                  <span className="value">
                    {csvToList(entry.symptoms).length ? (
                      csvToList(entry.symptoms).map((t) => (
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
                  <span className="label">Activities</span>
                  <span className="value">
                    {csvToList(entry.activities).length ? (
                      csvToList(entry.activities).map((t) => (
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
                  <span className="label">Medicines</span>
                  <span className="value">
                    {csvToList(entry.medicines).length ? (
                      csvToList(entry.medicines).map((t) => (
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
                  <span className="label">Habits</span>
                  <span className="value">
                    {csvToList(entry.habits).length ? (
                      csvToList(entry.habits).map((t) => (
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
                  <span className="label">Other</span>
                  <span className="value">
                    {csvToList(entry.other).length ? (
                      csvToList(entry.other).map((t) => (
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
                  <span className="label">Note</span>
                  <span className="value">{entry.note || "—"}</span>
                </div>
                <div className="detail-actions">
                  <button
                    type="button"
                    className={editingPain?.id === entry.id ? "active is-editing" : editingPain ? "is-editing" : undefined}
                    onClick={() => {
                      if (editingPain) {
                        onCancelEdit();
                        return;
                      }
                      onStartEdit(entry);
                    }}
                  >
                    <AnimatedEditingLabel active={Boolean(editingPain)} />
                  </button>
                  <button
                    type="button"
                    className={confirmDeletePain === entry.id ? "btn-delete-confirm" : ""}
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
