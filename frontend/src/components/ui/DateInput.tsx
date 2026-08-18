import type { InputHTMLAttributes } from "react";
import { FIELD_LINE_INPUT } from "./FieldLine";

// Shared look for every native date/time control: tinted surface, themed
// (inverted) calendar-picker indicator, tabular figures. One picker style
// across the whole app — no bespoke calendar popover.
const DATE_PICKER_SKIN =
  "cursor-pointer tabular-nums [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100";

/*
 * Sizing for the full-width date/time fields (the entry forms).
 *
 * `w-[1px] min-w-full` rather than the obvious `w-full`: iOS Safari gives its
 * native date widget an intrinsic width and lets it beat the specified
 * `width`, so a `width: 100%` field renders wider than its card and pushes the
 * whole page sideways. `min-width` is honoured where `width` is not, so a
 * throwaway width plus `min-width: 100%` pins the control to its container on
 * every browser. Keeps the native appearance — `appearance: none` also fixes
 * the overflow but takes the desktop calendar icon with it.
 */
export const DATE_TIME_INPUT = `!w-[1px] min-w-full max-w-full ${DATE_PICKER_SKIN}`;

// Settings/money shrink the field to its content: it sits in a row, where a
// stretched control reads worse. Written mobile-first on purpose — the pinned
// sizing is the base and `mobile:` opts desktop out, so the safe value wins by
// default instead of depending on which utility Tailwind emits last.
const DATE_INPUT = `${DATE_TIME_INPUT} mobile:!w-auto mobile:min-w-0 justify-self-start [&::-webkit-calendar-picker-indicator]:ml-2`;

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
