import { useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { StageHeadSlot } from "./stage-head-slot";
import { bandNine } from "./screen-format";

/*
 * The staged entry anatomy, shared by Pain, Diary, CBT and DBT.
 *
 * The problem it solves: these screens are ordered — you walk the fields
 * in sequence — but were rendered as two balanced columns split at
 * ceil(n/2), so nothing on screen said whether to read down or across.
 * Here a stage is a surface with a numbered kicker and a title that
 * outranks a field label, and the rail names the path.
 */

export const STAGES = "grid gap-page min-w-0";

export const STAGE = "grid gap-5 content-start p-5 rounded-md bg-card-soft min-w-0";
export const STAGE_KICKER =
  "text-nano font-extrabold tracking-[0.16em] uppercase text-accent tabular-nums";
export const STAGE_TITLE =
  "m-0 [text-box:trim-both_cap_alphabetic] text-[17px] font-extrabold tracking-tight text-text";

export function StageHead({ step, title, aside }: { step: number | string; title: string; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className={STAGE_KICKER}>Stage {step}</span>
      <h2 className={STAGE_TITLE}>{title}</h2>
      {aside != null ? <span className="ml-auto text-micro text-muted-soft">{aside}</span> : null}
    </div>
  );
}

/*
 * A field inside a stage. The prompt is a line of its own, not a
 * placeholder: on these screens the prompt is the therapy content, and a
 * placeholder disappears the moment you answer it — exactly when you
 * still want to see the question you are answering.
 */
export function StageField({
  label,
  prompt,
  children,
  htmlFor,
}: {
  label: string;
  prompt?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="grid gap-2 content-start min-w-0">
      {htmlFor ? (
        <label className="text-micro font-bold tracking-[0.12em] uppercase text-muted [text-box:trim-both_cap_alphabetic]" htmlFor={htmlFor}>{label}</label>
      ) : (
        <span className="text-micro font-bold tracking-[0.12em] uppercase text-muted [text-box:trim-both_cap_alphabetic]">{label}</span>
      )}
      {prompt ? <p className="m-0 text-hint text-muted leading-normal">{prompt}</p> : null}
      {children}
    </div>
  );
}

const SCALE_SLOT =
  "h-11 max-mobile:h-10 p-0 text-base font-bold font-body rounded-sm border shadow-none cursor-pointer transition-[background,border-color,color] duration-150 ease-[ease]";
const SCALE_IDLE =
  "text-muted bg-card-strong border-[color-mix(in_srgb,var(--border)_40%,transparent)] hover:text-text hover:border-border";
const SCALE_ON: Record<"low" | "mid" | "high", string> = {
  low: "bg-success border-success text-success-fg",
  mid: "bg-warning border-warning text-warning-fg",
  high: "bg-danger border-danger text-text",
};

/*
 * The nine-step metric as nine buttons. The old bar was 10px tall with
 * unfilled segments at 4% white, so an untouched metric read as blank
 * space rather than as a control you are meant to use.
 *
 * Every slot up to the value is filled, and each slot takes the colour of
 * its own band — so the fill shows both where you landed and how far up
 * the scale that is. Clicking the current value clears it.
 */
export function StageScale({
  label,
  value,
  onChange,
  ends,
  higherIsBetter = false,
}: {
  label: string;
  value: number | null;
  onChange: (next: number | null) => void;
  /** The three words under the scale, e.g. ["mild", "moderate", "severe"]. */
  ends: [string, string, string];
  higherIsBetter?: boolean;
}) {
  const current = value != null && !Number.isNaN(Number(value)) ? Math.min(9, Math.max(1, Math.round(Number(value)))) : null;

  return (
    <div className="grid gap-1.5 min-w-0">
      <div className="grid grid-cols-9 gap-[5px]" role="group" aria-label={label}>
        {Array.from({ length: 9 }, (_, i) => {
          const slot = i + 1;
          const filled = current != null && slot <= current;
          const band = bandNine(slot, higherIsBetter) || "low";
          return (
            <button
              key={slot}
              type="button"
              className={`${SCALE_SLOT} ${filled ? SCALE_ON[band] : SCALE_IDLE}`}
              aria-label={`${label} ${slot} of 9`}
              aria-pressed={current === slot}
              onClick={() => onChange(current === slot ? null : slot)}
            >
              {slot}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between px-0.5 text-micro text-muted-soft">
        <span>{ends[0]}</span>
        <span>{ends[1]}</span>
        <span>{ends[2]}</span>
      </div>
    </div>
  );
}

const STEPPER_BTN =
  "grid place-items-center w-9 h-9 min-h-9 p-0 text-lg text-text bg-card-strong border border-border rounded-full shadow-none cursor-pointer transition-[color,border-color] duration-150 ease-[ease] hover:text-accent hover:border-accent hover:bg-card-strong";

/* A count, as a control you can see. */
export function StageStepper({
  label,
  value,
  onChange,
  max = 50,
}: {
  label: string;
  value: number | null;
  onChange: (next: number | null) => void;
  max?: number;
}) {
  const n = value != null && !Number.isNaN(Number(value)) ? Math.min(max, Math.max(0, Math.floor(Number(value)))) : 0;
  return (
    <div className="inline-flex items-center gap-3.5">
      <button type="button" className={STEPPER_BTN} aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(0, n - 1))}>−</button>
      <span className="min-w-8 text-center text-xl font-extrabold tabular-nums text-text" aria-live="polite">{n}</span>
      <button type="button" className={STEPPER_BTN} aria-label={`Increase ${label}`} onClick={() => onChange(Math.min(max, n + 1))}>+</button>
    </div>
  );
}

/*
 * The flat form: Transactions, Movements and Snapshots are three to five
 * independent fields, not a sequence, so they get the card without the
 * rail or the stages. Fields flow row by row in DOM order, which makes
 * the tab order the reading order — the old two-column split sent Tab
 * down the left column and then back up to the right.
 */
export const FLAT_FORM = "grid gap-5 content-start p-5 rounded-md bg-card-soft min-w-0";
export const FLAT_ROW = "grid gap-3 min-w-0 @2xl:grid-cols-2";
/** Amounts and dates read at their own width; stretching them to 600px was the cost of the old split. */
export const FLAT_NARROW = "max-w-[220px]";
export const FLAT_ACTIONS = "flex justify-end gap-3";

const RAIL_STEP = "flex items-center gap-2.5 py-2 px-2.5 rounded-sm text-control font-semibold text-left bg-transparent border-0 shadow-none cursor-pointer";
const RAIL_DOT = "grid place-items-center w-[22px] h-[22px] flex-none rounded-full text-micro font-extrabold";

export type RailStep = { title: string; done: boolean };

/*
 * Desktop: the path on the left, plus the date and Save. Save lives here
 * so that saving after the first stage reads as the normal thing to do
 * rather than as an escape hatch — most of these entries are one stage
 * deep. Mobile hides the rail: its sticky head carries the same dots.
 */
export function StageRail({
  steps,
  current,
  onJump,
  children,
}: {
  steps: RailStep[];
  current: number;
  onJump: (index: number) => void;
  /** Date, quick chips and the save button. */
  children: ReactNode;
}) {
  return (
    <nav className="sticky top-5 grid gap-1 content-start max-mobile:hidden" aria-label="Stages">
      {steps.map((step, index) => {
        const isCurrent = index === current;
        const tone = isCurrent
          ? "text-accent bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
          : step.done
            ? "text-text"
            : "text-muted";
        const dotTone = isCurrent
          ? "bg-accent text-accent-fg"
          : step.done
            ? "bg-success text-success-fg"
            : "bg-[color-mix(in_srgb,white_6%,var(--card))] text-muted";
        return (
          <button
            key={step.title}
            type="button"
            className={`${RAIL_STEP} ${tone}`}
            aria-current={isCurrent ? "step" : undefined}
            onClick={() => onJump(index)}
          >
            <span className={`${RAIL_DOT} ${dotTone}`} aria-hidden="true">{step.done ? "✓" : index + 1}</span>
            <span>{step.title}</span>
          </button>
        );
      })}
      <div className="grid gap-2 mt-3 pt-3 border-t border-border">{children}</div>
    </nav>
  );
}

export const STAGE_SPLIT = "grid gap-page items-start min-w-0 wide:grid-cols-[220px_minmax(0,1fr)]";

/*
 * The rail's dots, for the mobile sticky head. Mobile has no room for the
 * step names, but "how many stages, which one am I on" is exactly what
 * you lose when the rail is hidden.
 */
export function StageProgress({ steps, current }: { steps: RailStep[]; current: number }) {
  const slot = useContext(StageHeadSlot);
  if (!slot) {
    return null;
  }

  return createPortal(<StageDots steps={steps} current={current} />, slot);
}

export function StageDots({ steps, current }: { steps: RailStep[]; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {steps.map((step, index) => (
        <span
          key={step.title}
          className={`${RAIL_DOT} ${
            index === current
              ? "bg-accent text-accent-fg"
              : step.done
                ? "bg-success text-success-fg"
                : "bg-[color-mix(in_srgb,white_6%,var(--card))] text-muted"
          }`}
        >
          {step.done ? "✓" : index + 1}
        </span>
      ))}
    </div>
  );
}
