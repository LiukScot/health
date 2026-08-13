import { type UseFormReturn } from "react-hook-form";
import {
  type CbtEntry,
  type CbtFormValues,
} from "./core";
import { AnimatedEditingLabel } from "./shared";
import { EmptyState, PAGE, PAGE_TITLE } from "./screen-helpers";
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
  FORM_COL,
  FORM_SPLIT,
  ENTRY_CHEVRON,
  ENTRY_DATE,
  ENTRY_EXPANDED,
  ENTRY_PREVIEW,
  ENTRY_ROW,
  ENTRY_SUMMARY,
  PainBadge,
  PastEntries,
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


  return (
    <section className={PAGE}>
      <h1 className={PAGE_TITLE}>CBT Thought Response</h1>
      <div className="min-w-0 border-b border-border">
        <EntriesHeading className="mt-0">New entry</EntriesHeading>
        <form onSubmit={cbtForm.handleSubmit(onSubmit)}>
          <div className={FORM_SPLIT}>
            {/* Left: the date and the first half of the worksheet; the
                order matters, so it reads down one column then the other. */}
            <div className={FORM_COL}>
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
            {cbtFields.slice(0, Math.ceil(cbtFields.length / 2)).map((f) => (
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
            </div>

            <div className={FORM_COL}>
            {cbtFields.slice(Math.ceil(cbtFields.length / 2)).map((f) => (
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
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-2">
            {editingCbt ? (
              <Button type="button" onClick={onCancelEdit}>
                Cancel edit
              </Button>
            ) : null}
            <Button type="submit" variant={cbtMutationState.isSuccess ? "success" : "primary"} >
              {cbtMutationState.isSuccess ? "✓ Saved" : editingCbt ? "Update entry" : "Save entry"}
            </Button>
          </div>
        </form>
      </div>
      <PastEntries
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
        ))}
      </PastEntries>
    </section>
  );
}
