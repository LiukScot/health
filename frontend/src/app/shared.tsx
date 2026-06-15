import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiEnvelopeSchema, apiFetch } from "../lib";
import type { InlineMessage, MoodFieldKey, PainFieldKey } from "./core";
import { csvToList, listToCsv, mergeOptions } from "./core";

// Pill primitive shared by toggle/add/edit chips. Shape carries no color so
// idle/active color utilities don't collide on source order.
const CHIP_SHAPE =
  "inline-flex items-center gap-inline px-stack py-tight min-h-page rounded-full text-hint leading-none border-0 shadow-none transition-[color,background] duration-150 ease-[ease]";
const CHIP_IDLE = "text-muted bg-[color-mix(in_srgb,white_5%,var(--card))]";
const CHIP_IDLE_HOVER = "hover:text-text hover:bg-[color-mix(in_srgb,white_9%,var(--card))]";
const CHIP_ACTIVE = "text-accent bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]";
const REMOVE_BTN =
  "inline-flex items-center justify-center w-[18px] h-[18px] min-h-[18px] p-0 rounded-full text-micro font-bold leading-none text-muted bg-[color-mix(in_srgb,var(--bg)_60%,transparent)] border-0 shadow-none flex-none cursor-pointer [@media(hover:hover)]:hover:text-danger [@media(hover:hover)]:hover:bg-[color-mix(in_srgb,var(--danger)_15%,transparent)]";
const ADDER_BTN =
  "border-0 bg-transparent px-stack py-tight min-h-[24px] rounded-full text-xs font-semibold font-body shadow-none cursor-pointer transition-[color,background] duration-150 ease-[ease]";

type SectionHeadVariant = "default" | "dashboard" | "ds" | "tags";
const SECTION_HEAD: Record<SectionHeadVariant, string> = {
  default: "flex justify-between gap-stack pb-tight mt-block",
  dashboard: "flex justify-between gap-stack pb-inline mt-block",
  ds: "flex flex-col gap-[2px] pb-tight mt-block",
  tags: "flex justify-between gap-stack mb-0",
};
const SECTION_TITLE: Record<SectionHeadVariant, string> = {
  default: "text-nano font-bold tracking-[0.16em] uppercase text-muted",
  dashboard: "text-control font-bold tracking-[0.16em] uppercase text-accent",
  ds: "text-nano font-bold tracking-[0.16em] uppercase text-muted",
  tags: "text-nano font-bold tracking-[0.16em] uppercase text-muted",
};
const SECTION_ASIDE: Record<SectionHeadVariant, string> = {
  default: "text-micro text-muted-soft tabular-nums",
  dashboard: "text-micro text-muted-soft tabular-nums",
  ds: "text-micro text-muted-soft tabular-nums",
  tags: "text-xs text-muted-soft",
};

export function InlineFeedback({ message, className }: { message: InlineMessage | null; className?: string }) {
  if (!message) {
    return null;
  }

  const toneColor = { error: "text-danger", success: "text-success", warning: "text-warning-soft", info: "text-muted" }[message.tone] ?? "text-muted";
  const classes = ["m-0 text-control leading-snug", toneColor, className].filter(Boolean).join(" ");
  const ariaLive = message.tone === "error" ? "assertive" : "polite";

  return (
    <p className={classes} role={message.tone === "error" ? "alert" : "status"} aria-live={ariaLive}>
      {message.text}
    </p>
  );
}

export function AnimatedEditingLabel({
  active,
  idleLabel = "Edit",
  editingLabel = "Editing",
}: {
  active: boolean;
  idleLabel?: string;
  editingLabel?: string;
}) {
  const [dotsCount, setDotsCount] = useState(1);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      setDotsCount((count) => (count % 3) + 1);
    }, 500);

    return () => window.clearInterval(timer);
  }, [active]);

  if (!active) {
    return idleLabel;
  }

  return (
    <span className="grid">
      <span className="[grid-area:1/1]">{editingLabel + ".".repeat(dotsCount)}</span>
      <span className="[grid-area:1/1] invisible" aria-hidden="true">{editingLabel}...</span>
    </span>
  );
}

type MultiSelectDomain = "pain" | "mood";

const domainConfig: Record<MultiSelectDomain, { apiBase: string; queryKey: string }> = {
  pain: { apiBase: "/api/v1/pain/options", queryKey: "pain-options" },
  mood: { apiBase: "/api/v1/mood/options", queryKey: "mood-options" },
};

type MultiSelectFieldProps = {
  label: string;
  fieldKey: PainFieldKey | MoodFieldKey;
  value: string;
  options: string[];
  onChange: (next: string) => void;
  domain?: MultiSelectDomain;
  /** When true, the visible heading is omitted (e.g. tabbed layout provides the label). */
  hideLabel?: boolean;
};

export function MultiSelectField({ label, fieldKey, value, options, onChange, domain = "pain", hideLabel = false }: MultiSelectFieldProps) {
  const { apiBase, queryKey: queryKeyName } = domainConfig[domain];
  const queryClient = useQueryClient();
  const selectedValues = useMemo(() => csvToList(value), [value]);
  const [hiddenSet, setHiddenSet] = useState<Set<string>>(() => new Set());
  const [pendingRemovalKey, setPendingRemovalKey] = useState<string | null>(null);
  const confirmRemoveRef = useRef<HTMLButtonElement | null>(null);
  const selectedSet = useMemo(() => new Set(selectedValues.map((entry) => entry.toLowerCase())), [selectedValues]);
  const allOptions = useMemo(() => {
    const merged = mergeOptions(options, selectedValues);
    if (!hiddenSet.size) return merged;
    return merged.filter((option) => {
      const key = option.toLowerCase();
      if (selectedSet.has(key)) return true;
      return !hiddenSet.has(key);
    });
  }, [options, selectedValues, hiddenSet, selectedSet]);
  const [customValue, setCustomValue] = useState("");
  const [editOptionsMode, setEditOptionsMode] = useState(false);
  const [addingOption, setAddingOption] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const addSuccessTimerRef = useRef<number | null>(null);
  const addInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (pendingRemovalKey) {
      confirmRemoveRef.current?.focus();
    }
  }, [pendingRemovalKey]);

  useEffect(() => () => {
    if (addSuccessTimerRef.current !== null) {
      window.clearTimeout(addSuccessTimerRef.current);
    }
  }, []);

  const toggleOption = (option: string) => {
    const key = option.trim().toLowerCase();
    if (!key) return;

    const isSelected = selectedValues.some((entry) => entry.trim().toLowerCase() === key);
    const nextValues = isSelected
      ? selectedValues.filter((entry) => entry.trim().toLowerCase() !== key)
      : [...selectedValues, option];

    onChange(listToCsv(nextValues));
  };

  const commitCustomValue = () => {
    const clean = customValue.trim();
    if (!clean) return;
    const nextValues = mergeOptions(selectedValues, [clean]);
    onChange(listToCsv(nextValues));
    setAddSuccess(true);
    if (addSuccessTimerRef.current !== null) {
      window.clearTimeout(addSuccessTimerRef.current);
    }
    addSuccessTimerRef.current = window.setTimeout(() => {
      setAddSuccess(false);
      addSuccessTimerRef.current = null;
    }, 900);
    setCustomValue("");
    setHiddenSet((current) => {
      const key = clean.toLowerCase();
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
    setPendingRemovalKey((current) => (current === clean.toLowerCase() ? null : current));
    addInputRef.current?.focus();
    void (async () => {
      try {
        await apiFetch(
          `${apiBase}/restore`,
          {
            method: "POST",
            body: JSON.stringify({ field: fieldKey, value: clean }),
          },
          (raw) => apiEnvelopeSchema(z.object({ ok: z.boolean() })).parse(raw).data,
        );
        await queryClient.invalidateQueries({ queryKey: [queryKeyName] });
      } catch {
        // ignore failure: option already restored locally
      }
    })();
  };

  const permanentlyRemoveOption = async (option: string) => {
    const key = option.trim().toLowerCase();
    if (!key) return;

    setPendingRemovalKey(null);
    setHiddenSet((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });

    const nextValues = selectedValues.filter((entry) => entry.trim().toLowerCase() !== key);
    onChange(listToCsv(nextValues));

    try {
      await apiFetch(
        `${apiBase}/remove`,
        {
          method: "POST",
          body: JSON.stringify({ field: fieldKey, value: option }),
        },
        (raw) => apiEnvelopeSchema(z.object({ ok: z.boolean() })).parse(raw).data,
      );
      await queryClient.invalidateQueries({ queryKey: [queryKeyName] });
    } catch {
      // ignore failure: option stays hidden locally for this session
    }
  };

  const setEditMode = (next: boolean) => {
    setEditOptionsMode(next);
    if (next) {
      setAddingOption(false);
      return;
    }
    setPendingRemovalKey(null);
    setCustomValue("");
  };

  return (
    <div className="grid gap-inline content-start">
      {hideLabel ? null : <span className="flex flex-wrap mt-stack mb-stack pl-stack border-l-[3px] border-accent text-sm font-semibold text-accent leading-tight">{label}</span>}
      <div className="flex flex-wrap gap-inline content-start mt-[5px] mb-[5px] order-1" role="group" aria-label={label}>
        {allOptions.map((option) => {
          const optionKey = option.toLowerCase();
          const isSelected = selectedSet.has(optionKey);
          const isConfirmingRemoval = pendingRemovalKey === optionKey;

          if (isConfirmingRemoval) {
            return (
              <div key={option} className="inline-flex items-center gap-inline flex-wrap px-stack py-inline border border-[color-mix(in_srgb,var(--danger)_50%,transparent)] rounded-full bg-[color-mix(in_srgb,var(--danger)_8%,transparent)]" role="group" aria-label={`Confirm removal of ${option}`}>
                <span className="whitespace-nowrap text-text text-control">Remove {option}?</span>
                <div className="inline-flex items-center gap-inline">
                  <button
                    type="button"
                    ref={confirmRemoveRef}
                    className="danger min-h-page px-stack py-tight text-xs shadow-none"
                    onClick={() => {
                      void permanentlyRemoveOption(option);
                    }}
                  >
                    Remove
                  </button>
                  <button type="button" className="min-h-page px-stack py-tight text-xs shadow-none" onClick={() => setPendingRemovalKey(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={option} className="inline-flex items-center">
              {editOptionsMode ? (
                <div className={`${CHIP_SHAPE} ${isSelected ? CHIP_ACTIVE : CHIP_IDLE} cursor-default`}>
                  <span className="whitespace-nowrap">{option}</span>
                  <button
                    type="button"
                    className={REMOVE_BTN}
                    aria-label={`Remove ${option} from suggestions`}
                    onClick={() => setPendingRemovalKey(optionKey)}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={`${CHIP_SHAPE} ${isSelected ? CHIP_ACTIVE : `${CHIP_IDLE} ${CHIP_IDLE_HOVER}`}`}
                  onClick={() => toggleOption(option)}
                  aria-pressed={isSelected}
                >
                  <span className="whitespace-nowrap">{option}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-inline mt-tight">
        {addingOption ? (
          <div className="inline-flex items-center gap-inline pl-stack pr-tight py-[2px] border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] rounded-full bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] min-h-page">
            <input
              ref={addInputRef}
              autoFocus
              type="text"
              className="flex-[1_1_140px] min-w-[120px] max-w-[18rem] w-auto border-0 bg-transparent p-0 text-text text-control font-medium font-body shadow-none outline-none focus:bg-transparent focus:shadow-none placeholder:text-muted-soft"
              placeholder={`New ${label.toLowerCase()}`}
              value={customValue}
              onChange={(event) => setCustomValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitCustomValue();
                  return;
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setAddingOption(false);
                  setCustomValue("");
                }
              }}
            />
            <button
              type="button"
              className={`${ADDER_BTN} ${addSuccess ? "text-success bg-[color-mix(in_srgb,var(--success)_16%,transparent)]" : "text-accent hover:text-text"}`}
              aria-label="Save option"
              onClick={commitCustomValue}
            >
              {addSuccess ? "\u2713" : "Add"}
            </button>
            <button
              type="button"
              className={`${ADDER_BTN} text-muted-soft hover:text-text`}
              aria-label="Cancel"
              onClick={() => {
                setAddingOption(false);
                setCustomValue("");
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className={`${CHIP_SHAPE} text-muted-soft bg-[color-mix(in_srgb,white_5%,var(--card))] font-medium enabled:hover:text-text enabled:hover:bg-[color-mix(in_srgb,white_9%,var(--card))] disabled:opacity-40 disabled:cursor-not-allowed`}
              onClick={() => setAddingOption(true)}
              disabled={editOptionsMode}
            >
              + add option
            </button>
            <button
              type="button"
              className={`border-0 rounded-full px-stack py-tight min-h-page text-hint font-medium leading-none shadow-none cursor-pointer transition-[color,background] duration-150 ease-[ease] ${editOptionsMode ? "text-accent bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]" : "text-muted-soft bg-[color-mix(in_srgb,white_5%,var(--card))] hover:text-text hover:bg-[color-mix(in_srgb,white_9%,var(--card))]"}`}
              aria-pressed={editOptionsMode}
              onClick={() => setEditMode(!editOptionsMode)}
            >
              {editOptionsMode ? "done" : "edit"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Small titled divider used to group sub-sections across pages. When `ruled`,
 * a hairline fills the space after the title. */
export function SectionHead({ title, aside, ruled = false, variant = "default" }: { title: string; aside?: ReactNode; ruled?: boolean; variant?: SectionHeadVariant }) {
  const align = ruled ? "items-center" : variant === "ds" ? "items-start" : "items-baseline";
  return (
    <div className={`${SECTION_HEAD[variant]} ${align}`}>
      <span className={SECTION_TITLE[variant]}>{title}</span>
      {ruled ? <span className="flex-1 h-px bg-border" aria-hidden="true" /> : null}
      {aside != null ? <span className={SECTION_ASIDE[variant]}>{aside}</span> : null}
    </div>
  );
}

/**
 * Caps the "past entries" column to the height of the form column and
 * reports overflow, driving the "Show more" button used on Diary / Pain.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useDiaryColumnCap<T>(entries: T[], isLoading: boolean) {
  const pastEntriesBodyRef = useRef<HTMLDivElement>(null);
  const pastColRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  const syncAndMeasure = useCallback(() => {
    const col = pastColRef.current;
    const left = leftColRef.current;
    if (col && left) {
      const h = Math.round(left.getBoundingClientRect().height);
      if (h > 0) {
        col.style.setProperty("--diary-past-col-max-h", `${h}px`);
      }
    }
    const body = pastEntriesBodyRef.current;
    if (!body || entries.length === 0) {
      setOverflow(false);
      return;
    }
    setOverflow(body.scrollHeight > body.clientHeight + 1);
  }, [entries.length]);

  useLayoutEffect(() => {
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        syncAndMeasure();
      });
    };
    schedule();

    const body = pastEntriesBodyRef.current;
    const left = leftColRef.current;
    const hasRO = typeof ResizeObserver !== "undefined";
    const ro = hasRO ? new ResizeObserver(schedule) : null;
    if (ro) {
      if (body) ro.observe(body);
      if (left) ro.observe(left);
    }
    const onToggle = () => schedule();
    body?.addEventListener("toggle", onToggle, true);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      body?.removeEventListener("toggle", onToggle, true);
      window.removeEventListener("resize", schedule);
    };
  }, [syncAndMeasure, entries, isLoading]);

  return { leftColRef, pastColRef, pastEntriesBodyRef, overflow };
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSplitColumnHeightSync(deps: ReadonlyArray<unknown> = []) {
  const leftColRef = useRef<HTMLElement | null>(null);
  const rightColRef = useRef<HTMLElement | null>(null);

  const syncHeights = useCallback(() => {
    const left = leftColRef.current;
    const right = rightColRef.current;
    if (!left || !right) return;
    const height = Math.round(left.getBoundingClientRect().height);
    if (height > 0) {
      right.style.setProperty("--split-col-height", `${height}px`);
    }
  }, []);

  useLayoutEffect(() => {
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncHeights);
    };
    schedule();

    const left = leftColRef.current;
    const right = rightColRef.current;
    const hasRO = typeof ResizeObserver !== "undefined";
    const ro = hasRO ? new ResizeObserver(schedule) : null;
    if (ro) {
      if (left) ro.observe(left);
      if (right) ro.observe(right);
    }
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", schedule);
    };
  // deps intentionally let caller re-sync when screen data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncHeights, ...deps]);

  return { leftColRef, rightColRef };
}
