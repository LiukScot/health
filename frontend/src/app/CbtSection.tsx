import { type UseFormReturn } from "react-hook-form";
import {
  type CbtEntry,
  type CbtFormValues,
} from "./core";
import { AnimatedEditingLabel, SectionHead, useDiaryColumnCap } from "./shared";
import { EmptyState } from "./screen-helpers";
import { formatEntrySummaryDate } from "./screen-format";
import { Button } from "../components/ui/Button";
import { FieldLine } from "../components/ui/FieldLine";
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
} from "./entries";

const DATETIME_FIELD =
  "!w-auto max-w-full justify-self-start cursor-pointer tabular-nums [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100";

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
    <section className="@container p-2">
      <h1 className="m-0 mb-3 text-[22px] font-bold tracking-tight text-text">CBT Thought Response</h1>
      <div className="grid gap-8 min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[1100px]:gap-12 min-[1100px]:items-start">
        <div className="min-w-0 max-[1099px]:border-b max-[1099px]:border-[var(--border-soft)]" ref={leftColRef}>
          <EntriesHeading className="min-[1100px]:mt-0">New entry</EntriesHeading>
          <form className="mb-2" onSubmit={cbtForm.handleSubmit(onSubmit)}>
            <div className="grid gap-3 content-start min-w-0">
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
              <SectionHead title="Thought record" />
              {cbtFields.map((f) => (
                <FieldLine
                  key={f.key}
                  label={f.label}
                  multiline={f.multiline}
                  compact={f.multiline}
                  rows={f.multiline ? 2 : undefined}
                  type={f.multiline ? undefined : "text"}
                  placeholder={f.hint}
                  aria-label={f.label}
                  {...cbtForm.register(f.key)}
                />
              ))}
              {editingCbt ? (
                <div className="flex gap-2 flex-wrap">
                  <Button type="button" onClick={onCancelEdit}>
                    Cancel edit
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" variant={cbtMutationState.isSuccess ? "success" : "primary"} className="mb-5">
                {cbtMutationState.isSuccess ? "✓ Saved" : editingCbt ? "Update entry" : "Save entry"}
              </Button>
            </div>
          </form>
        </div>
        <PastEntriesColumn
          title="Past entries"
          isLoading={isLoading}
          loadingText="Loading CBT entries..."
          isEmpty={cbtEntries.length === 0}
          emptyState={
            <EmptyState
              title="No CBT entries yet"
              description="Use the prompts above to record your first thought response. Completed reflections will appear here."
            />
          }
          overflow={pastEntriesOverflow}
          colRef={pastColRef}
          bodyRef={pastEntriesBodyRef}
        >
          {cbtEntries.map((entry) => (
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
                    className={`${DETAIL_ACTION_BTN} ${confirmDeleteCbt === entry.id ? DELETE_CONFIRM : ""}`}
                    onClick={() => onDeleteClick(entry.id)}
                    onBlur={onDeleteBlur}
                  >
                    {confirmDeleteCbt === entry.id ? "Delete?" : "Delete"}
                  </button>
                </div>
              </div>
            </details>
          ))}
        </PastEntriesColumn>
      </div>
    </section>
  );
}
