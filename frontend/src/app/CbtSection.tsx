import { useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import {
  type CbtEntry,
  type CbtFormValues,
} from "./core";
import { AnimatedEditingLabel } from "./shared";
import { EmptyState, PAGE, PAGE_TITLE } from "./screen-helpers";
import { STAGE, STAGES, STAGE_SPLIT, StageField, StageHead, StageProgress, StageRail } from "./staged";
import { formatEntrySummaryDate } from "./screen-format";
import { Button } from "../components/ui/Button";
import { FieldLine, FIELD_LINE_INPUT } from "../components/ui/FieldLine";
import {
  DELETE_CONFIRM,
  DATETIME_FIELD,
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
  view,
  onViewChange,
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
  view: EntryView;
  onViewChange: (next: EntryView) => void;
}) {
  /*
   * The ten prompts are a path: name what happened, examine the thought,
   * look for another reading, decide what to do. They used to be cut in
   * half by ceil(n/2) and poured into two columns, so the order existed
   * only in this file. The groups below are that order, on screen.
   */
  const cbtStages: { title: string; fields: { key: keyof CbtFormValues; label: string; prompt: string; multiline?: boolean }[] }[] = [
    {
      title: "What happened",
      fields: [
        { key: "situation", label: "Situation", prompt: "What's the situation?" },
        { key: "thoughts", label: "Thoughts", prompt: "What thoughts are running through your mind? How much do you believe each one?", multiline: true },
      ],
    },
    {
      title: "Examine the thought",
      fields: [
        { key: "helpfulReasoning", label: "Helpful reasoning", prompt: "Any helpful reasoning to counter this thought pattern?", multiline: true },
        { key: "mainUnhelpfulThought", label: "Main unhelpful thought", prompt: "The single thought you want to work on." },
        { key: "effectOfBelieving", label: "Effect of believing it", prompt: "What would change if you didn't believe it?", multiline: true },
        { key: "evidenceForAgainst", label: "Evidence for / against", prompt: "What supports or rejects this thought?", multiline: true },
      ],
    },
    {
      title: "Another angle",
      fields: [
        { key: "alternativeExplanation", label: "Alternative explanation", prompt: "Could there be another way to read the situation?", multiline: true },
        { key: "worstBestScenario", label: "Worst / best scenario", prompt: "What's the worst? Would you survive it? What's the best?", multiline: true },
        { key: "friendAdvice", label: "Advice to a friend", prompt: "What would you tell a friend in this situation?", multiline: true },
      ],
    },
    {
      title: "What now",
      fields: [
        { key: "productiveResponse", label: "Productive response", prompt: "Take a breath. What are your next steps?", multiline: true },
      ],
    },
  ];
  // The expanded entry still lists every field, in the same order.
  const cbtFields = cbtStages.flatMap((stageGroup) => stageGroup.fields);
  const [stage, setStage] = useState(-1);
  const touched = cbtForm.formState.dirtyFields;
  const steps = cbtStages.map((stageGroup) => ({
    title: stageGroup.title,
    done: stageGroup.fields.some((f) => !!touched[f.key]),
  }));


  return (
    <section className={PAGE}>
      <EntryViewTabs view={view} onChange={onViewChange} className="inline-flex max-mobile:hidden" />
      <h1 className={PAGE_TITLE}>CBT Thought Response</h1>
      {view === "new" ? (
      <form onSubmit={cbtForm.handleSubmit(onSubmit)} className={STAGE_SPLIT}>
        <StageProgress steps={steps} current={stage} />
        <StageRail
          steps={steps}
          current={stage}
          onJump={setStage}
        >
          <FieldLine
            label="Date & time"
            type="datetime-local"
            className={DATETIME_FIELD}
            {...cbtForm.register("dateTime")}
            aria-label="Date/time"
            onClick={(e) => {
              const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
              el.showPicker?.();
            }}
          />
          <Button type="submit" variant={cbtMutationState.isSuccess ? "success" : "primary"}>
            {cbtMutationState.isSuccess ? "✓ Saved" : editingCbt ? "Update entry" : "Save entry"}
          </Button>
          {editingCbt ? <Button type="button" onClick={onCancelEdit}>Cancel edit</Button> : null}
        </StageRail>

        <div className={STAGES}>
          {cbtStages.map((stageGroup, index) => (
            <section key={stageGroup.title} className={STAGE}>
              <StageHead step={index + 1} title={stageGroup.title} />
              {stageGroup.fields.map((f) => (
                <StageField key={f.key} label={f.label} prompt={f.prompt} htmlFor={`cbt-${f.key}`}>
                  {f.multiline ? (
                    <textarea id={`cbt-${f.key}`} rows={3} className={FIELD_LINE_INPUT} {...cbtForm.register(f.key)} />
                  ) : (
                    <input id={`cbt-${f.key}`} type="text" className={FIELD_LINE_INPUT} {...cbtForm.register(f.key)} />
                  )}
                </StageField>
              ))}
            </section>
          ))}

        </div>
      </form>
      ) : (
      <PastEntries
        isLoading={isLoading}
        loadingText="Loading CBT entries..."
        isEmpty={cbtEntries.length === 0}
        emptyState={
          <EmptyState
            title="No CBT entries yet"
            description="Use the prompts above to record your first thought response. Completed reflections will appear here."
          />
        }
      >
        <EntryMonths
          rows={cbtEntries}
          dateOf={(entry) => entry.entryDate}
          renderRow={(entry) => (
          <details key={entry.id} className={ENTRY_ROW}>
            <summary className={ENTRY_SUMMARY}>
              <span className={ENTRY_DATE}>{formatEntrySummaryDate(entry.entryDate, entry.entryTime)}</span>
              <PainBadge variant="muted" sm>CBT</PainBadge>
              <span className={ENTRY_PREVIEW}>{entry.situation || entry.mainUnhelpfulThought || entry.productiveResponse || "—"}</span>
              <span />
              <span className={ENTRY_CHEVRON} aria-hidden="true">▶</span>
            </summary>
            <div className={ENTRY_EXPANDED}>
              {cbtFields.map((f) => {
                const v = entry[f.key as keyof CbtEntry] as unknown as string | null | undefined;
                return <DetailGroup key={f.key} label={f.label}>{v || "—"}</DetailGroup>;
              })}
              <div className={DETAIL_ACTIONS}>
                <button
                  type="button"
                  className={DETAIL_ACTION_BTN}
                  onClick={() => {
                    if (editingCbt?.id === entry.id) {
                      onCancelEdit();
                      return;
                    }
                    onStartEdit(entry);
                  }}
                >
                  <AnimatedEditingLabel active={editingCbt?.id === entry.id} />
                </button>
                <button
                  type="button"
                  className={`${DETAIL_ACTION_BTN} ${confirmDeleteCbt === entry.id ? DELETE_CONFIRM : ""}`}
                  onClick={() => onDeleteClick(entry.id)}
                  onBlur={onDeleteBlur}
                >
                  {confirmDeleteCbt === entry.id ? "Delete?" : "Delete"}
                </button>
              </div>
            </div>
          </details>
        )}
        />
      </PastEntries>
      )}
    </section>
  );
}
