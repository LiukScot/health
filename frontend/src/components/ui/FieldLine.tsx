import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

// Underline-only field (former .field.field-line): uppercase micro-label above
// a borderless tinted input/textarea. Renders the control itself so the input
// styling lives in one place; spread rhf register() props straight onto it.
export const FIELD_LINE_LABEL =
  "[text-box:trim-both_cap_alphabetic] pt-3 pb-2 text-xs font-bold tracking-[0.16em] uppercase text-muted";
// min-w-0: date/time inputs carry an intrinsic min-content width (wider on
// mobile browsers than on desktop), and as grid items the default
// min-width:auto lets that width inflate the whole track and push the page
// sideways. Zeroing it lets max-w-full/w-full do the sizing instead.
export const FIELD_LINE_INPUT =
  "w-full min-w-0 bg-[var(--control)] border-0 rounded-sm px-3 py-2 text-text text-control font-medium font-body shadow-none outline-none transition-[background,box-shadow] duration-150 ease-[ease] hover:bg-[var(--control-hover)] focus:bg-[var(--control-hover)] focus:shadow-[inset_0_0_0_1px_var(--accent)] placeholder:text-muted-soft";

type FieldLineProps = InputHTMLAttributes<HTMLInputElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: ReactNode;
    multiline?: boolean;
    /** Therapy worksheets use shorter textareas (54px) than diary/pain (64px). */
    compact?: boolean;
  };

export function FieldLine({ label, multiline = false, compact = false, className = "", ...rest }: FieldLineProps) {
  const minH = compact ? "min-h-[54px]" : "min-h-[64px]";
  // The wrapping label associates implicitly; htmlFor is added when the
  // caller gives the control an id, so the pair is explicit as well.
  return (
    <label className="grid gap-2 content-start" htmlFor={rest.id}>
      <span className={FIELD_LINE_LABEL}>{label}</span>
      {multiline ? (
        // rest is the input∩textarea intersection; narrow to the rendered element.
        <textarea
          className={`${FIELD_LINE_INPUT} resize-y ${minH} leading-normal ${className}`}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input className={`${FIELD_LINE_INPUT} ${className}`} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}
    </label>
  );
}
