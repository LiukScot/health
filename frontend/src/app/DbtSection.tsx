import { type ReactNode } from "react";
import { type UseFormReturn } from "react-hook-form";
import {
  entryViewLabels,
  type DbtEntry,
  type DbtFormValues,
} from "./core";
import { AnimatedEditingLabel } from "./shared";
import { EmptyState, PAGE, PAGE_TITLE } from "./screen-helpers";
import { FLAT_ACTIONS, STAGE, STAGES, STAGE_SPLIT, StageField, StageHead, StageProgress, StageRail, StageScale } from "./staged";
import { bandNine, formatEntrySummaryDate } from "./screen-format";
import { Button } from "../components/ui/Button";
import { DATE_TIME_INPUT } from "../components/ui/DateInput";
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

/* Guidance about the exercise. */
const THERAPY_CALLOUT =
  "m-0 px-3 py-2 bg-card-soft border-l-2 border-[color-mix(in_srgb,var(--accent)_50%,transparent)] rounded-sm text-muted text-hint leading-normal";
/* The script itself — the words you say, with the fields sitting where the
   sentence stops and waits for you. */
const SCRIPT_LINE = "m-0 text-hint text-text leading-normal";

const MOODS_LIST_URL =
  "https://www.hhs.texas.gov/sites/default/files/documents/doing-business-with-hhs/provider-portal/behavioral-health-provider/cognitive-behavioral-therapy-resources/list-of-moods.pdf";
const SOURCE_URL = "https://youtu.be/puoddnGTAJk";
const LINK = "text-accent underline underline-offset-2 hover:no-underline";

/*
 * The exercise is a script you read to yourself, and the inputs are the
 * gaps in it — the worksheet writes "I do not need to be afraid of it
 * because I'm not going to ___" and you finish the sentence. Compressing
 * it into labelled boxes with a one-line summary above them loses the
 * thing that makes it work, so the blocks below are the script in full,
 * in its order, with each field where its blank is.
 */
type DbtField = { key: keyof DbtFormValues; label: string; hint?: string; multiline?: boolean };
type DbtBlock =
  | { kind: "note"; text: ReactNode }
  | { kind: "say"; text: string }
  | { kind: "intensity" }
  | ({ kind: "field" } & DbtField);
type DbtGroup = { title: string; aside?: string; blocks: DbtBlock[] };

const dbtGroups: DbtGroup[] = [
  {
    title: "Recognize and allow the emotion",
    aside: "Name and allow",
    blocks: [
      {
        kind: "note",
        text: "Try to think of a more intense form of your emotion. Examples: instead of sad, maybe you are distraught or crushed. Instead of mad, you are disgusted or appalled, instead of afraid you are worried, terrified or crazed.",
      },
      {
        kind: "note",
        text: (
          <>
            Other examples can be found in{" "}
            <a className={LINK} href={MOODS_LIST_URL} target="_blank" rel="noreferrer">this list of moods</a>{" "}
            to get started.
          </>
        ),
      },
      { kind: "field", key: "emotionName", label: "Emotion", hint: "What emotion are you feeling?" },
      { kind: "intensity" },
      {
        kind: "say",
        text: "Then say: “I am feeling this emotion, it's ok, I can allow myself to feel this. I'm not bad because I have this feeling and I can allow myself to have it. I'm going to make space for it. I do not need to be afraid of it because I'm not going to…”",
      },
      {
        kind: "field",
        key: "allowAffirmation",
        label: "I'm not going to…",
        hint: "Finish the sentence.",
        multiline: true,
      },
      { kind: "say", text: "“I can control myself. So I don't need to get rid of this feeling.”" },
    ],
  },
  {
    title: "Watch the emotion",
    aside: "Observe without grabbing",
    blocks: [
      { kind: "say", text: "“Let me watch this emotion and see what it does. While I'm watching it, I'm going to call it what it is:”" },
      { kind: "field", key: "watchEmotion", label: "Call it what it is", hint: "Name the emotion plainly." },
      { kind: "say", text: "“I don't have to get caught up in it. Where do I notice the emotion in my body? I notice it in:”" },
      { kind: "field", key: "bodyLocation", label: "Where in the body", hint: "Where do you notice it?" },
      { kind: "say", text: "“I feel:”" },
      { kind: "field", key: "bodyFeeling", label: "I feel", hint: "What does it feel like physically?", multiline: true },
      {
        kind: "say",
        text: "“But it's just an emotion, nothing more and nothing less. I am not my emotions. I simply watch my emotions. My emotion is like an ocean wave. I'm not going to struggle and fight the wave. I'm going to go with it and float with it. I may even ride the wave to shore.”",
      },
    ],
  },
  {
    title: "Be present",
    aside: "Five senses",
    blocks: [
      {
        kind: "say",
        text: "“I'm going to turn my attention back to what I am doing now. First I'm going to notice what's going on with all five senses. What can I feel or touch, what do I hear? What do I see in front of me? What do I smell? What do I taste?”",
      },
      { kind: "say", text: "or" },
      {
        kind: "say",
        text: "“I'm going to turn my attention to my breaths. My breath is my anchor for the present moment. I take note of how I inhale and then how I exhale.”",
      },
      { kind: "field", key: "presentMoment", label: "Right now", hint: "What did you notice? Optional.", multiline: true },
    ],
  },
  {
    title: "When the emotion comes back",
    aside: "It will",
    blocks: [
      {
        kind: "say",
        text: "“When the emotion returns, I say, that's ok. That's what emotions do, they come and they go. I'm going to watch it again. I will let it sit in the room with me. Or I may float up and down with it again like the ocean wave.”",
      },
      { kind: "field", key: "emotionReturns", label: "When it came back", hint: "Worth remembering for next time? Optional.", multiline: true },
    ],
  },
];

const dbtFields = (group: DbtGroup): DbtField[] =>
  group.blocks.filter((b): b is { kind: "field" } & DbtField => b.kind === "field");

const dbtDetails: { label: string; key: keyof DbtEntry }[] = dbtGroups
  .flatMap(dbtFields)
  .map((f) => ({ label: f.label, key: f.key as keyof DbtEntry }));

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
  // Every field, not any — see the note in CbtSection.
  const dbtValues = dbtForm.watch();
  const intensity = dbtValues.intensity ?? null;
  const steps = dbtGroups.map((group) => ({
    title: group.title,
    done: dbtFields(group).every((f) => !!String(dbtValues[f.key] ?? "").trim()),
  }));

  return (
    <section className={PAGE}>
      {view === "new" ? (
      <form onSubmit={dbtForm.handleSubmit(onSubmit)} className={STAGE_SPLIT}>
        <StageProgress steps={steps} />
        <StageRail
          steps={steps}
          heading={
            <div className="grid gap-page content-start">
              <EntryViewTabs view={view} onChange={onViewChange} labels={entryViewLabels["dbt"]} className="inline-flex max-mobile:hidden" />
              <h1 className={PAGE_TITLE}>DBT Distress Tolerance</h1>
            </div>
          }
        >
          <FieldLine
            label="Date & time"
            id="dbt-datetime"
            type="datetime-local"
            className={DATE_TIME_INPUT}
            {...dbtForm.register("dateTime")}
            aria-label="Date/time"
            onClick={(e) => {
              const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
              el.showPicker?.();
            }}
          />
          <p className="m-0 text-micro text-muted-soft">
            Source: <a className={LINK} href={SOURCE_URL} target="_blank" rel="noreferrer">the walkthrough this worksheet follows</a>.
          </p>
        </StageRail>

        <div className={STAGES}>
          {dbtGroups.map((group, index) => (
            <section key={group.title} className={STAGE}>
              <StageHead step={index + 1} title={group.title} aside={group.aside} />
              {group.blocks.map((block, blockIndex) => {
                if (block.kind === "note") {
                  return <p key={blockIndex} className={THERAPY_CALLOUT}>{block.text}</p>;
                }
                if (block.kind === "say") {
                  return <p key={blockIndex} className={SCRIPT_LINE}>{block.text}</p>;
                }
                if (block.kind === "intensity") {
                  return (
                    <StageField key={blockIndex} label="Intensity" prompt="How strong is it, right now?">
                      <StageScale
                        label="Intensity"
                        value={intensity}
                        onChange={(next) => dbtForm.setValue("intensity", next, { shouldDirty: true })}
                        ends={["mild", "strong", "overwhelming"]}
                      />
                    </StageField>
                  );
                }
                return (
                  <StageField key={block.key} label={block.label} prompt={block.hint} htmlFor={`dbt-${block.key}`}>
                    {block.multiline ? (
                      <textarea id={`dbt-${block.key}`} rows={3} className={FIELD_LINE_INPUT} {...dbtForm.register(block.key)} />
                    ) : (
                      <input id={`dbt-${block.key}`} type="text" className={FIELD_LINE_INPUT} {...dbtForm.register(block.key)} />
                    )}
                  </StageField>
                );
              })}
            </section>
          ))}

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
          <EntryViewTabs view={view} onChange={onViewChange} labels={entryViewLabels["dbt"]} className="inline-flex max-mobile:hidden" />
          <h1 className={PAGE_TITLE}>DBT Distress Tolerance</h1>
        </div>
      <PastEntries
        isLoading={isLoading}
        loadingText="Loading DBT entries..."
        isEmpty={dbtEntries.length === 0}
        emptyState={
          <EmptyState
            title="No DBT entries yet"
            description="Nothing saved yet. Open New entry to work through the steps; saved practices land here."
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
              {entry.intensity != null ? (
                <PainBadge variant={bandNine(entry.intensity) || "muted"} sm>{entry.intensity}</PainBadge>
              ) : (
                <PainBadge variant="muted" sm>DBT</PainBadge>
              )}
              <span className={ENTRY_PREVIEW}>{entry.emotionName || entry.presentMoment || "—"}</span>
              <span />
              <span className={ENTRY_CHEVRON} aria-hidden="true">▶</span>
            </summary>
            <div className={ENTRY_EXPANDED}>
              <DetailGroup label="Intensity">{entry.intensity != null ? `${entry.intensity} / 9` : "—"}</DetailGroup>
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
                    // Editing means going back to the form, which the log view is not
                    // showing: filling a form nobody can see is not an edit.
                    onViewChange("new");
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
