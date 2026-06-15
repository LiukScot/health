import type { InputHTMLAttributes } from "react";
import { FIELD_LINE_INPUT } from "./FieldLine";

// Native date input styled like the form date/time fields: auto width, tinted
// surface, themed (inverted) calendar-picker indicator. One picker style across
// the whole app — no bespoke calendar popover.
const DATE_INPUT =
  "!w-auto max-w-full justify-self-start cursor-pointer tabular-nums [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-inline [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100";

type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">;

export function DateInput({ value, onChange, ariaLabel, className = "", ...rest }: DateInputProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={`${FIELD_LINE_INPUT} ${DATE_INPUT} ${className}`}
      // Open the native picker when clicking anywhere on the field, not just the
      // calendar icon. showPicker() requires the click user-gesture it runs in.
      onClick={(e) => {
        const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
        el.showPicker?.();
      }}
      {...rest}
    />
  );
}
