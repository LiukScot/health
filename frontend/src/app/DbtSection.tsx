import { type UseFormReturn } from "react-hook-form";
import {
  type DbtEntry,
  type DbtFormValues,
} from "./core";
import { AnimatedEditingLabel, SectionHead } from "./shared";
import { EmptyState } from "./screen-helpers";
import { formatEntrySummaryDate } from "./screen-format";
import { Button } from "../components/ui/Button";
import { FieldLine } from "../components/ui/FieldLine";
import {
  DELETE_CONFIRM,
  DATETIME_FIELD,
  DETAIL_ACTIONS,
  DETAIL_ACTION_BTN,
  DetailGroup,
  EntriesHeading,
  FORM_FULL,
  FORM_GRID,
  ENTRY_CHEVRON,
  ENTRY_DATE,
  ENTRY_EXPANDED,
  ENTRY_PREVIEW,
  ENTRY_ROW,
  ENTRY_SUMMARY,
  PainBadge,
  PastEntries,
} from "./entries";
const THERAPY_CALLOUT =
  "m-0 px-3 py-2 bg-card-soft border-l-2 border-[color-mix(in_srgb,var(--accent)_50%,transparent)] rounded-sm text-muted text-hint leading-normal";

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


  const dbtDetails: { label: string; key: keyof DbtEntry }[] = [
    { label: "Emotion", key: "emotionName" },
    { label: "Affirmation", key: "allowAffirmation" },
    { label: "Watch", key: "watchEmotion" },
    { label: "Body location", key: "bodyLocation" },
    { label: "Body feeling", key: "bodyFeeling" },
    { label: "Present moment", key: "presentMoment" },
  ];

  return (
    <section className="@container p-2">
      <h1 className="m-0 mb-3 text-title font-bold tracking-tight text-text">DBT Distress Tolerance</h1>
      <div className="grid gap-8">
        <div className="min-w-0 border-b border-border">
          <EntriesHeading className="mt-0">New entry</EntriesHeading>
          <form className="mb-2" onSubmit={dbtForm.handleSubmit(onSubmit)}>
            <div className={FORM_GRID}>
              <FieldLine
                label="Date & time"
                type="datetime-local"
                className={DATETIME_FIELD}
                {...dbtForm.register("dateTime")}
                aria-label="Date/time"
                onClick={(e) => {
                  const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                  el.showPicker?.();
                }}
              />
              {dbtGroups.map((g) => (
                <div key={g.title} className="flex flex-col gap-3">
                  <SectionHead title={g.title} variant="ds" />
                  {g.callouts?.map((c) => (
                    <p key={c} className={THERAPY_CALLOUT}>{c}</p>
                  ))}
                  {g.fields.map((f) => (
                    <FieldLine
                      key={f.key}
                      label={f.label}
                      multiline={f.multiline}
                      compact={f.multiline}
                      rows={f.multiline ? 2 : undefined}
                      type={f.multiline ? undefined : "text"}
                      placeholder={f.hint}
                      aria-label={f.label}
                      {...dbtForm.register(f.key)}
                    />
                  ))}
                </div>
              ))}
              <p className={`${THERAPY_CALLOUT} mt-3`}>
                When the emotion comes back, that's ok. Emotions come and go — watch it again, float with the wave.
              </p>
              {editingDbt ? (
                <div className={`flex gap-2 flex-wrap ${FORM_FULL}`}>
                  <Button type="button" onClick={onCancelEdit}>
                    Cancel edit
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" variant={dbtMutationState.isSuccess ? "success" : "primary"} className="mb-5">
                {dbtMutationState.isSuccess ? "✓ Saved" : editingDbt ? "Update entry" : "Save entry"}
              </Button>
            </div>
          </form>
        </div>
        <PastEntries
          title="Past entries"
          isLoading={isLoading}
          loadingText="Loading DBT entries..."
          isEmpty={dbtEntries.length === 0}
          emptyState={
            <EmptyState
              title="No DBT entries yet"
              description="Work through the steps above to log your first distress-tolerance practice. Saved entries will appear here."
            />
          }
        >
          {dbtEntries.map((entry) => (
            <details key={entry.id} className={ENTRY_ROW}>
              <summary className={ENTRY_SUMMARY}>
                <span className={ENTRY_DATE}>{formatEntrySummaryDate(entry.entryDate, entry.entryTime)}</span>
                <PainBadge variant="muted" sm>DBT</PainBadge>
                <span className={ENTRY_PREVIEW}>{entry.emotionName || entry.presentMoment || "—"}</span>
                <span />
                <span className={ENTRY_CHEVRON} aria-hidden="true">▶</span>
              </summary>
              <div className={ENTRY_EXPANDED}>
                {dbtDetails.map((d) => (
                  <DetailGroup key={d.key} label={d.label}>{(entry[d.key] as string) || "—"}</DetailGroup>
                ))}
                <div className={DETAIL_ACTIONS}>
                  <button
                    type="button"
                    className={DETAIL_ACTION_BTN}
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
                    className={`${DETAIL_ACTION_BTN} ${confirmDeleteDbt === entry.id ? DELETE_CONFIRM : ""}`}
                    onClick={() => onDeleteClick(entry.id)}
                    onBlur={onDeleteBlur}
                  >
                    {confirmDeleteDbt === entry.id ? "Delete?" : "Delete"}
                  </button>
                </div>
              </div>
            </details>
          ))}
        </PastEntries>
      </div>
    </section>
  );
}
