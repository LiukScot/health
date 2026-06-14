import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

// Underline-only field (former .field.field-line): uppercase micro-label above
// a borderless tinted input/textarea. Renders the control itself so the input
// styling lives in one place; spread rhf register() props straight onto it.
export const FIELD_LINE_INPUT =
  "w-full bg-[color-mix(in_srgb,white_3%,var(--bg))] border-0 rounded-sm px-stack py-inline text-text text-control font-medium font-body shadow-none outline-none transition-[background,box-shadow] duration-150 ease-[ease] hover:bg-[color-mix(in_srgb,white_5%,var(--bg))] focus:bg-[color-mix(in_srgb,white_5%,var(--bg))] focus:shadow-[inset_0_0_0_1px_var(--accent)] placeholder:text-muted-soft [[data-theme=oled]_&]:bg-card-soft [[data-theme=oled]_&]:hover:bg-[color-mix(in_srgb,white_6%,var(--card-soft))] [[data-theme=oled]_&]:focus:bg-[color-mix(in_srgb,white_6%,var(--card-soft))]";

type FieldLineProps = InputHTMLAttributes<HTMLInputElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: ReactNode;
    multiline?: boolean;
    /** Therapy worksheets use shorter textareas (54px) than diary/pain (64px). */
    compact?: boolean;
  };

export function FieldLine({ label, multiline = false, compact = false, className = "", ...rest }: FieldLineProps) {
  const minH = compact ? "min-h-[54px]" : "min-h-[64px]";
  return (
    <label className="grid gap-inline content-start">
      <span className="pt-stack pb-inline text-nano font-bold tracking-[0.16em] uppercase text-muted">{label}</span>
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
