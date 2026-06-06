import { type UseFormReturn } from "react-hook-form";
import {
  type DbtEntry,
  type DbtFormValues,
} from "./core";
import { AnimatedEditingLabel, SectionHead, useDiaryColumnCap } from "./shared";
import { EmptyState, formatEntrySummaryDate } from "./screen-helpers";

export function DbtSection({
  dbtForm,
  dbtMutationState,
  isLoading,
  editingDbt,
  dbtEntries,
  confirmDeleteDbt,
  onSubmit,
  onCancelEdit,
  onStartEdit,
  onDeleteClick,
  onDeleteBlur,
}: {
  dbtForm: UseFormReturn<DbtFormValues>;
  dbtMutationState: { isSuccess: boolean };
  isLoading: boolean;
  editingDbt: DbtEntry | null;
  dbtEntries: DbtEntry[];
  confirmDeleteDbt: number | null;
  onSubmit: (values: DbtFormValues) => void;
  onCancelEdit: () => void;
  onStartEdit: (entry: DbtEntry) => void;
  onDeleteClick: (id: number) => void;
  onDeleteBlur: () => void;
}) {
  type DbtGroup = {
    title: string;
    aside?: string;
    callouts?: string[];
    fields: { key: keyof DbtFormValues; label: string; hint?: string; multiline?: boolean }[];
  };

  const dbtGroups: DbtGroup[] = [
    {
      title: "Recognize the emotion",
      aside: "Name and allow",
      callouts: [
        "Try naming a more intense form of your emotion — not just sad, maybe distraught; not just mad, maybe appalled.",
      ],
      fields: [
        { key: "emotionName", label: "Emotion", hint: "What emotion are you feeling?" },
        {
          key: "allowAffirmation",
          label: "Affirmation",
          hint: "I can allow myself to feel this. I'm not bad because of it…",
          multiline: true,
        },
      ],
    },
    {
      title: "Watch the emotion",
      aside: "Observe without grabbing",
      callouts: [
        "Watch the emotion and see what it does. It's a wave — float with it instead of getting caught.",
      ],
      fields: [
        { key: "watchEmotion", label: "Call it what it is", hint: "Name the emotion plainly." },
        { key: "bodyLocation", label: "Where in the body", hint: "Where do you notice it?" },
        { key: "bodyFeeling", label: "Body sensation", hint: "What does it feel like physically?" },
      ],
    },
    {
      title: "Be present",
      aside: "Five senses",
      callouts: [
        "Turn attention back to now. Use your five senses, or your breath, as the anchor.",
      ],
      fields: [
        {
          key: "presentMoment",
          label: "Right now",
          hint: "What can you feel, hear, see, smell, or taste?",
          multiline: true,
        },
      ],
    },
  ];

  const {
    leftColRef,
    pastColRef,
    pastEntriesBodyRef,
    overflow: pastEntriesOverflow,
  } = useDiaryColumnCap(dbtEntries, isLoading);

  return (
    <section className="panel">
      <h1 className="panel-title">DBT Distress Tolerance</h1>
      <div className="panel-split panel-split--diary">
        <div className="panel-col" ref={leftColRef}>
          <h2 className="entries-heading">New entry</h2>
      <form className="dense-form-grid therapy-form" onSubmit={dbtForm.handleSubmit(onSubmit)}>
        <div className="core-col">
          <label className="field field-line">
            <span className="field-line-label">Date &amp; time</span>
            <input
              type="datetime-local"
              {...dbtForm.register("dateTime")}
              aria-label="Date/time"
              onClick={(e) => {
                const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                el.showPicker?.();
              }}
            />
          </label>
          {dbtGroups.map((g) => (
            <div key={g.title} className="ds-section">
              <SectionHead title={g.title} />
              {g.callouts?.map((c) => (
                <p key={c} className="hint therapy-callout">{c}</p>
              ))}
              {g.fields.map((f) => (
                <label key={f.key} className="field field-line">
                  <span className="field-line-label">{f.label}</span>
                  {f.multiline ? (
                    <textarea rows={2} placeholder={f.hint} aria-label={f.label} {...dbtForm.register(f.key)} />
                  ) : (
                    <input type="text" placeholder={f.hint} aria-label={f.label} {...dbtForm.register(f.key)} />
                  )}
                </label>
              ))}
            </div>
          ))}
          <p className="hint therapy-callout">
            When the emotion comes back, that's ok. Emotions come and go — watch it again, float with the wave.
          </p>
          {editingDbt ? (
            <div className="dense-form-inline-actions">
              <button type="button" onClick={onCancelEdit}>
                Cancel edit
              </button>
            </div>
          ) : null}
        </div>
        <div className="save-section">
          <button type="submit" className={`btn btn-primary${dbtMutationState.isSuccess ? " is-success-pulse" : ""}`}>
            {dbtMutationState.isSuccess ? "✓ Saved" : editingDbt ? "Update entry" : "Save entry"}
          </button>
        </div>
      </form>
        </div>
        <div className="panel-col diary-past-col" ref={pastColRef}>

      {isLoading && <p className="hint">Loading DBT entries...</p>}

      <h2 className="entries-heading">Past entries</h2>
      {dbtEntries.length === 0 ? (
        <EmptyState
          title="No DBT entries yet"
          description="Work through the steps above to log your first distress-tolerance practice. Saved entries will appear here."
        />
      ) : (
        <div className="diary-past-entries-stack">
          <div className="diary-past-entries-body" ref={pastEntriesBodyRef}>
        {dbtEntries.map((entry) => (
          <details key={entry.id} className="entry-row">
            <summary>
              <span className="date">{formatEntrySummaryDate(entry.entryDate, entry.entryTime)}</span>
              <span className="pain-badge sm muted">DBT</span>
              <span className="preview">{entry.emotionName || entry.presentMoment || "—"}</span>
              <span />
              <span className="chevron" aria-hidden="true">▶</span>
            </summary>
            <div className="entry-expanded">
              <div className="detail-group">
                <span className="label">Emotion</span>
                <span className="value">{entry.emotionName || "—"}</span>
              </div>
              <div className="detail-group">
                <span className="label">Affirmation</span>
                <span className="value">{entry.allowAffirmation || "—"}</span>
              </div>
              <div className="detail-group">
                <span className="label">Watch</span>
                <span className="value">{entry.watchEmotion || "—"}</span>
              </div>
              <div className="detail-group">
                <span className="label">Body location</span>
                <span className="value">{entry.bodyLocation || "—"}</span>
              </div>
              <div className="detail-group">
                <span className="label">Body feeling</span>
                <span className="value">{entry.bodyFeeling || "—"}</span>
              </div>
              <div className="detail-group">
                <span className="label">Present moment</span>
                <span className="value">{entry.presentMoment || "—"}</span>
              </div>
              <div className="detail-actions">
                <button
                  type="button"
                  className={editingDbt?.id === entry.id ? "active is-editing" : editingDbt ? "is-editing" : undefined}
                  onClick={() => {
                    if (editingDbt) {
                      onCancelEdit();
                      return;
                    }
                    onStartEdit(entry);
                  }}
                >
                  <AnimatedEditingLabel active={Boolean(editingDbt)} />
                </button>
                <button
                  type="button"
                  className={confirmDeleteDbt === entry.id ? "btn-delete-confirm" : ""}
                  onClick={() => onDeleteClick(entry.id)}
                  onBlur={onDeleteBlur}
                >
                  {confirmDeleteDbt === entry.id ? "Delete?" : "Delete"}
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
