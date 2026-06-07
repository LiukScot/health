import { useEffect, useId, useRef, useState } from "react";
import "./select.css";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  ariaLabel: string;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Accessible select hand-rolled to mirror DateField (trigger button + popover).
 * Radix Select was dropped: @radix-ui/react-select@2.3.0 hits an infinite
 * render loop with React 19.2.5 ("Maximum update depth exceeded" in
 * SelectItemText), crashing the form at runtime with no upstream fix.
 */
export function Select({ value, onValueChange, options, ariaLabel, disabled, placeholder }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const optionBaseId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const label = selected ? selected.label : (placeholder ?? "");

  const openListbox = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const closeListbox = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const commit = (index: number) => {
    const option = options[index];
    if (option) onValueChange(option.value);
    closeListbox(true);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // Move focus into the listbox when it opens so keyboard users can drive it,
  // and back to the trigger is handled explicitly on close.
  useEffect(() => {
    if (open) listboxRef.current?.focus();
  }, [open]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (open) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openListbox();
    }
  };

  const handleListboxKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, options.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        closeListbox(true);
        break;
      case "Tab":
        closeListbox(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="ui-select">
      <button
        ref={triggerRef}
        type="button"
        className="ui-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        data-empty={selected ? undefined : "true"}
        disabled={disabled}
        onClick={() => (open ? closeListbox(false) : openListbox())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="ui-select-value">{label}</span>
        <span className="ui-select-icon" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <ul
          ref={listboxRef}
          id={listboxId}
          className="ui-select-listbox"
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={`${optionBaseId}-${activeIndex}`}
          tabIndex={-1}
          onKeyDown={handleListboxKeyDown}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${optionBaseId}-${index}`}
              className="ui-select-option"
              role="option"
              aria-selected={option.value === value}
              data-active={index === activeIndex ? "true" : undefined}
              onClick={() => commit(index)}
              onPointerMove={() => setActiveIndex(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
