import { type UseFormReturn } from "react-hook-form";
import {
  type CbtEntry,
  type CbtFormValues,
} from "./core";
import { AnimatedEditingLabel, SectionHead, useDiaryColumnCap } from "./shared";
import { EmptyState } from "./screen-helpers";
import { formatEntrySummaryDate } from "./screen-format";

export function CbtSection({
  cbtForm,
  cbtMutationState,
  isLoading,
  editingCbt,
  cbtEntries,
  confirmDeleteCbt,
  onSubmit,
  onCancelEdit,
  onStartEdit,
  onDeleteClick,
  onDeleteBlur,
}: {
  cbtForm: UseFormReturn<CbtFormValues>;
  cbtMutationState: { isSuccess: boolean };
  isLoading: boolean;
  editingCbt: CbtEntry | null;
  cbtEntries: CbtEntry[];
  confirmDeleteCbt: number | null;
  onSubmit: (values: CbtFormValues) => void;
  onCancelEdit: () => void;
  onStartEdit: (entry: CbtEntry) => void;
  onDeleteClick: (id: number) => void;
  onDeleteBlur: () => void;
}) {
  const cbtFields: { key: keyof CbtFormValues; label: string; hint?: string; multiline?: boolean }[] = [
    { key: "situation", label: "Situation", hint: "What's the situation?" },
    {
      key: "thoughts",
      label: "Thoughts",
      hint: "What thoughts are running through your mind? How much do you believe each one?",
      multiline: true,
    },
    {
      key: "helpfulReasoning",
      label: "Helpful reasoning",
      hint: "Any helpful reasoning to counter this thought pattern?",
      multiline: true,
    },
    {
      key: "mainUnhelpfulThought",
      label: "Main unhelpful thought",
      hint: "The single thought you want to work on.",
    },
    {
      key: "effectOfBelieving",
      label: "Effect of believing it",
      hint: "What would change if you didn't believe it?",
      multiline: true,
    },
    {
      key: "evidenceForAgainst",
      label: "Evidence for / against",
      hint: "What supports or rejects this thought?",
      multiline: true,
    },
    {
      key: "alternativeExplanation",
      label: "Alternative explanation",
      hint: "Could there be another way to read the situation?",
      multiline: true,
    },
    {
      key: "worstBestScenario",
      label: "Worst / best scenario",
      hint: "What's the worst? Would you survive it? What's the best?",
      multiline: true,
    },
    {
      key: "friendAdvice",
      label: "Advice to a friend",
      hint: "What would you tell a friend in this situation?",
      multiline: true,
    },
    {
      key: "productiveResponse",
      label: "Productive response",
      hint: "Take a breath. What are your next steps?",
      multiline: true,
    },
  ];

  const {
    leftColRef,
    pastColRef,
    pastEntriesBodyRef,
    overflow: pastEntriesOverflow,
  } = useDiaryColumnCap(cbtEntries, isLoading);

  return (
    <section className="panel">
      <h1 className="panel-title">CBT Thought Response</h1>
      <div className="panel-split panel-split--diary">
        <div className="panel-col" ref={leftColRef}>
          <h2 className="entries-heading">New entry</h2>
          <form className="dense-form-grid therapy-form" onSubmit={cbtForm.handleSubmit(onSubmit)}>
            <div className="core-col">
              <label className="field field-line">
                <span className="field-line-label">Date &amp; time</span>
                <input
                  type="datetime-local"
                  {...cbtForm.register("dateTime")}
                  aria-label="Date/time"
                  onClick={(e) => {
                    const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                    el.showPicker?.();
                  }}
                />
              </label>
              <SectionHead title="Thought record" />
              {cbtFields.map((f) => (
                <label key={f.key} className="field field-line">
                  <span className="field-line-label">{f.label}</span>
                  {f.multiline ? (
                    <textarea rows={2} placeholder={f.hint} aria-label={f.label} {...cbtForm.register(f.key)} />
                  ) : (
                    <input type="text" placeholder={f.hint} aria-label={f.label} {...cbtForm.register(f.key)} />
                  )}
                </label>
              ))}
              {editingCbt ? (
                <div className="dense-form-inline-actions">
                  <button type="button" onClick={onCancelEdit}>
                    Cancel edit
                  </button>
                </div>
              ) : null}
            </div>
            <div className="save-section">
              <button type="submit" className={`btn btn-primary${cbtMutationState.isSuccess ? " is-success-pulse" : ""}`}>
                {cbtMutationState.isSuccess ? "✓ Saved" : editingCbt ? "Update entry" : "Save entry"}
              </button>
            </div>
          </form>
        </div>
        <div className="panel-col diary-past-col" ref={pastColRef}>
          {isLoading && <p className="hint">Loading CBT entries...</p>}

          <h2 className="entries-heading">Past entries</h2>
          {cbtEntries.length === 0 ? (
            <EmptyState
              title="No CBT entries yet"
              description="Use the prompts above to record your first thought response. Completed reflections will appear here."
            />
          ) : (
            <div className="diary-past-entries-stack">
              <div className="diary-past-entries-body" ref={pastEntriesBodyRef}>
            {cbtEntries.map((entry) => (
          <details key={entry.id} className="entry-row">
            <summary>
              <span className="date">{formatEntrySummaryDate(entry.entryDate, entry.entryTime)}</span>
              <span className="pain-badge sm muted">CBT</span>
              <span className="preview">{entry.situation || entry.mainUnhelpfulThought || entry.productiveResponse || "—"}</span>
              <span />
              <span className="chevron" aria-hidden="true">▶</span>
            </summary>
            <div className="entry-expanded">
              {cbtFields.map((f) => {
                const v = entry[f.key as keyof CbtEntry] as unknown as string | null | undefined;
                return (
                  <div key={f.key} className="detail-group">
                    <span className="label">{f.label}</span>
                    <span className="value">{v || "—"}</span>
                  </div>
                );
              })}
              <div className="detail-actions">
                <button
                  type="button"
                  className={editingCbt?.id === entry.id ? "active is-editing" : editingCbt ? "is-editing" : undefined}
                  onClick={() => {
                    if (editingCbt) {
                      onCancelEdit();
                      return;
                    }
                    onStartEdit(entry);
                  }}
                >
                  <AnimatedEditingLabel active={Boolean(editingCbt)} />
                </button>
                <button
                  type="button"
                  className={confirmDeleteCbt === entry.id ? "btn-delete-confirm" : ""}
                  onClick={() => onDeleteClick(entry.id)}
                  onBlur={onDeleteBlur}
                >
                  {confirmDeleteCbt === entry.id ? "Delete?" : "Delete"}
                </button>
              </div>
            </div>
          </details>
        ))}
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
