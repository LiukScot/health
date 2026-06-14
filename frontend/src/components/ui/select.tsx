import { useEffect, useId, useRef, useState } from "react";

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
    <div ref={containerRef} className="relative inline-flex w-full">
      <button
        ref={triggerRef}
        type="button"
        className="appearance-none inline-flex items-center justify-between gap-inline w-full bg-[color-mix(in_srgb,white_3%,var(--bg))] border-0 rounded-sm px-stack py-inline text-text text-control font-medium font-body cursor-pointer text-left transition-[background,box-shadow] duration-150 ease-[ease] hover:bg-[color-mix(in_srgb,white_5%,var(--bg))] focus-visible:bg-[color-mix(in_srgb,white_5%,var(--bg))] focus-visible:shadow-[inset_0_0_0_1px_var(--accent)] focus-visible:outline-none disabled:cursor-not-allowed disabled:text-muted-soft data-[empty=true]:text-muted-soft [[data-theme=oled]_&]:bg-card-soft [[data-theme=oled]_&]:hover:bg-[color-mix(in_srgb,white_6%,var(--card-soft))] [[data-theme=oled]_&]:focus-visible:bg-[color-mix(in_srgb,white_6%,var(--card-soft))]"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        data-empty={selected ? undefined : "true"}
        disabled={disabled}
        onClick={() => (open ? closeListbox(false) : openListbox())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
        <span className="text-micro text-muted pointer-events-none" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <ul
          ref={listboxRef}
          id={listboxId}
          className="absolute top-[calc(100%+var(--spacing-tight))] left-0 z-40 min-w-full m-0 list-none bg-card-strong border border-border rounded-md shadow-[var(--shadow)] p-tight grid gap-tight outline-none"
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
              className="flex items-center px-stack py-inline rounded-sm text-text text-control font-medium font-body cursor-pointer select-none data-[active=true]:bg-[color-mix(in_srgb,white_6%,var(--bg))] aria-selected:bg-accent aria-selected:text-text [[data-theme=oled]_&]:data-[active=true]:bg-[color-mix(in_srgb,white_6%,var(--card-soft))]"
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
