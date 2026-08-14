import { type UseFormReturn } from "react-hook-form";
import {
  entryViewLabels,
  type DbtEntry,
  type DbtFormValues,
} from "./core";
import { AnimatedEditingLabel } from "./shared";
import { EmptyState, PAGE, PAGE_TITLE } from "./screen-helpers";
import { FLAT_ACTIONS, STAGE, STAGES, STAGE_SPLIT, StageField, StageHead, StageProgress, StageRail } from "./staged";
import { formatEntrySummaryDate } from "./screen-format";
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
  view,
  onViewChange,
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
  view: EntryView;
  onViewChange: (next: EntryView) => void;
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

  // Every field, not any — see the note in CbtSection.
  const dbtValues = dbtForm.watch();
  const steps = dbtGroups.map((group) => ({
    title: group.title,
    done: group.fields.every((f) => !!String(dbtValues[f.key] ?? "").trim()),
  }));


  const dbtDetails: { label: string; key: keyof DbtEntry }[] = [
    { label: "Emotion", key: "emotionName" },
    { label: "Affirmation", key: "allowAffirmation" },
    { label: "Watch", key: "watchEmotion" },
    { label: "Body location", key: "bodyLocation" },
    { label: "Body feeling", key: "bodyFeeling" },
    { label: "Present moment", key: "presentMoment" },
  ];

  return (
    <section className={PAGE}>
      {view === "new" ? (
      <form onSubmit={dbtForm.handleSubmit(onSubmit)} className={STAGE_SPLIT}>
        <StageProgress steps={steps} />
        <StageRail
          steps={steps}
          heading={
            <div className="grid gap-page content-start">
              <EntryViewTabs view={view} onChange={onViewChange} labels={entryViewLabels["dbt"]!} className="inline-flex max-mobile:hidden" />
              <h1 className={PAGE_TITLE}>DBT Distress Tolerance</h1>
            </div>
          }
        >
          <FieldLine
            label="Date & time"
            type="datetime-local"
            className="w-full max-w-full cursor-pointer tabular-nums [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
            {...dbtForm.register("dateTime")}
            aria-label="Date/time"
            onClick={(e) => {
              const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
              el.showPicker?.();
            }}
          />
        </StageRail>

        <div className={STAGES}>
          {dbtGroups.map((group, index) => (
            <section key={group.title} className={STAGE}>
              <StageHead step={index + 1} title={group.title} aside={group.aside} />
              {group.callouts?.map((c) => (
                <p key={c} className={THERAPY_CALLOUT}>{c}</p>
              ))}
              {group.fields.map((f) => (
                <StageField key={f.key} label={f.label} prompt={f.hint} htmlFor={`dbt-${f.key}`}>
                  {f.multiline ? (
                    <textarea id={`dbt-${f.key}`} rows={3} className={FIELD_LINE_INPUT} {...dbtForm.register(f.key)} />
                  ) : (
                    <input id={`dbt-${f.key}`} type="text" className={FIELD_LINE_INPUT} {...dbtForm.register(f.key)} />
                  )}
                </StageField>
              ))}
            </section>
          ))}

          <p className={THERAPY_CALLOUT}>
            When the emotion comes back, that's ok. Emotions come and go — watch it again, float with the wave.
          </p>


          {/* The end of the form, at the end of the form: Save is what
              closes the thing you were filling in, not a piece of the
              navigation beside it. */}
          <div className={FLAT_ACTIONS}>
            {editingDbt ? <Button type="button" onClick={onCancelEdit}>Cancel edit</Button> : null}
            <Button type="submit" variant={dbtMutationState.isSuccess ? "success" : "primary"}>
              {dbtMutationState.isSuccess ? "✓ Saved" : editingDbt ? "Update entry" : "Save entry"}
            </Button>
          </div>
        </div>
      </form>
      ) : (
      <div className="grid gap-page content-start min-w-0">
        <div className="grid gap-page content-start">
          <EntryViewTabs view={view} onChange={onViewChange} labels={entryViewLabels["dbt"]!} className="inline-flex max-mobile:hidden" />
          <h1 className={PAGE_TITLE}>DBT Distress Tolerance</h1>
        </div>
      <PastEntries
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
        <EntryMonths
          rows={dbtEntries}
          dateOf={(entry) => entry.entryDate}
          renderRow={(entry) => (
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
                    if (editingDbt?.id === entry.id) {
                      onCancelEdit();
                      return;
                    }
                    onStartEdit(entry);
                  }}
                >
                  <AnimatedEditingLabel active={editingDbt?.id === entry.id} />
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
        )}
        />
      </PastEntries>
      </div>
      )}
    </section>
  );
}
