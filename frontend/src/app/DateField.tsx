import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isValid, parseISO } from "date-fns";
import "react-day-picker/style.css";

const DISPLAY_FORMAT = "d MMM yyyy";
const ISO_FORMAT = "yyyy-MM-dd";

// date-fns parseISO on a date-only string returns local midnight, and format
// reads local components, so a YYYY-MM-DD string round-trips without timezone
// shift. Using new Date(string) here would parse as UTC and shift the day.
function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
};

export function DateField({ value, onChange, ariaLabel, placeholder = "Select date" }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  const selected = parseIsoDate(value);
  const label = selected ? format(selected, DISPLAY_FORMAT) : placeholder;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? format(date, ISO_FORMAT) : "");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="date-field">
      <button
        type="button"
        className="date-field-trigger"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        data-empty={selected ? undefined : "true"}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </button>

      {open ? (
        <div id={popoverId} className="date-field-popover" role="dialog" aria-label={ariaLabel ?? "Choose date"}>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected}
            captionLayout="dropdown"
            startMonth={new Date(1920, 0)}
            endMonth={new Date(new Date().getFullYear() + 10, 11)}
            weekStartsOn={1}
            autoFocus
          />
        </div>
      ) : null}
    </div>
  );
}
