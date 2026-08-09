import type { ReactNode } from "react";

// Past-entries primitives shared by CBT/DBT/Diary/Pain. The summary layout
// differs per screen (badges, mood, preview), so these expose styled wrappers
// + class constants the screens compose, rather than one rigid component.

export const ENTRY_ROW =
  "group/row border-0 border-b border-border rounded-none m-0 overflow-hidden bg-transparent transition-[background] duration-150 ease-[ease]";
export const ENTRY_SUMMARY =
  "group/sum list-none grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-3 px-[2px] py-3 cursor-pointer border-0 rounded-none shadow-none bg-transparent min-h-0 [&::-webkit-details-marker]:hidden";
export const ENTRY_DATE =
  "font-medium text-xs font-mono text-muted min-w-[110px] tabular-nums tracking-wide group-hover/sum:text-text";
export const ENTRY_PREVIEW =
  "text-control text-muted overflow-hidden text-ellipsis whitespace-nowrap group-hover/sum:text-text";
export const ENTRY_CHEVRON =
  "text-muted-soft transition-transform duration-200 ease-[ease] text-nano group-open/row:rotate-90";
export const ENTRY_EXPANDED =
  "px-[2px] pt-2 pb-3 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3";
export const DETAIL_ACTIONS = "[grid-column:1/-1] flex gap-1 justify-end -mt-1";
export const DETAIL_ACTION_BTN =
  "px-2 py-1 text-xs font-medium text-muted bg-transparent border-0 rounded-[6px] shadow-none cursor-pointer font-[inherit] transition-[color,background] duration-150 ease-[ease] hover:text-text hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]";
export const DELETE_CONFIRM = "text-danger-strong bg-danger-strong/18 font-extrabold";

// Forms whose fields are all much the same shape (CBT, DBT, the money forms)
// flow into as many columns as fit. auto-fit reacts to the container, not the
// viewport, so collapsing the sidebar reflows them with no breakpoint
// involved; min(100%,…) keeps one column from overflowing a narrow container.
export const FORM_GRID =
  "grid gap-3 content-start min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,28rem),1fr))]";
// For rows that head or close a group and would read wrong beside a field.
export const FORM_FULL = "[grid-column:1/-1]";

// Forms built from blocks of genuinely different size get placed by hand:
// letting an algorithm guess produced a different ragged result at every
// width. The wide column takes the blocks that need room to read — a nine-step
// metric, a six-tab strip — and the narrow one takes what stays legible small,
// like a date or free text. No rule between them; the gap is the separation.
// Container query, so collapsing the sidebar reflows it too.
export const FORM_SPLIT =
  "grid gap-10 min-w-0 @3xl:grid-cols-2 @3xl:items-start";
// One number, 40px, for every gap on the page — columns, blocks, the page
// margin, the headings. That only works because the labels and headings are
// text-box trimmed, so a text box is exactly as tall as its letters and a
// declared 40 is 40 on screen. Without the trim (Firefox, for now) vertical
// gaps read a few px larger than horizontal ones; that is the whole reason
// this used to be six different numbers compensating for leading.
// The pt-0/mt-0 below cancel the padding blocks carry for the tight forms,
// where the gap is 12px and that padding is the only separation.
export const FORM_COL = "grid gap-10 content-start min-w-0 [&>*>:first-child]:pt-0 [&>*>:first-child]:mt-0";

export const DATETIME_FIELD =
  "!w-auto max-w-full justify-self-start cursor-pointer tabular-nums [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100";

export function EntriesHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`[text-box:trim-both_cap_alphabetic] text-control text-accent uppercase tracking-[0.16em] font-bold mb-10 ${className}`}>
      {children}
    </h2>
  );
}

// The entry log, stacked under the form it belongs to. Every row is rendered:
// the list used to sit in a right-hand column capped to the form's height,
// which clipped the overflow behind a fade and a "Show more" button that was
// never wired to anything, so the clipped rows had no way back.
export function PastEntries({
  title,
  isLoading,
  loadingText,
  isEmpty,
  emptyState,
  children,
}: {
  title: ReactNode;
  isLoading: boolean;
  loadingText: string;
  isEmpty: boolean;
  emptyState: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      {isLoading && <p className="text-muted text-control">{loadingText}</p>}
      <EntriesHeading className="mt-0">{title}</EntriesHeading>
      {isEmpty ? emptyState : children}
    </div>
  );
}

// Inline tag chip inside an expanded entry's detail value (former .tag-mini).
export const TAG_MINI =
  "py-[2px] px-2 text-micro text-muted bg-[color-mix(in_srgb,var(--card)_60%,var(--card-strong))] rounded-[4px]";

// Accent-underline tab button shape (no color), shared by TagTabs + Settings tabs.
export const TAG_TAB_BTN =
  "inline-flex items-center gap-2 py-1 px-0 text-control font-medium bg-transparent border-0 border-b rounded-none shadow-none cursor-pointer font-[inherit] whitespace-nowrap min-h-0 transition-[color,border-color] duration-150 ease-[ease]";

// Accent-underline tab strip shared by Diary (moods) and Pain (medicines).
export function TagTabs<T extends string>({
  tabs,
  active,
  onSelect,
  ariaLabel,
}: {
  tabs: { id: T; label: string; count: number }[];
  active: T;
  onSelect: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <nav className="flex flex-wrap gap-y-1 gap-x-5" role="tablist" aria-label={ariaLabel}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`${TAG_TAB_BTN} ${active === t.id ? "text-text border-b-accent" : "text-muted border-b-transparent hover:text-text"}`}
          onClick={() => onSelect(t.id)}
        >
          {t.label} <span className={`text-micro font-medium ${active === t.id ? "text-accent" : "text-muted-soft"}`}>{t.count}</span>
        </button>
      ))}
    </nav>
  );
}

// Renders a list of tag chips inside a detail value, or an em-dash when empty.
export function TagList({ items }: { items: string[] }) {
  if (!items.length) return <>—</>;
  return (
    <>
      {items.map((t) => (
        <span key={t} className={TAG_MINI}>{t}</span>
      ))}
    </>
  );
}

export function DetailGroup({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <span className="text-micro text-muted uppercase tracking-wider">{label}</span>
      <span className="text-control flex flex-wrap gap-1 text-text">{children}</span>
    </div>
  );
}

type PainBadgeVariant = "low" | "mid" | "high" | "muted";
const PAIN_BADGE: Record<PainBadgeVariant, string> = {
  low: "bg-success text-success-fg",
  mid: "bg-warning text-warning-fg",
  high: "bg-danger text-white",
  muted: "bg-[color-mix(in_srgb,var(--card)_50%,var(--border))] text-muted",
};

export function PainBadge({
  variant,
  sm = false,
  children,
}: {
  variant: PainBadgeVariant;
  sm?: boolean;
  children: ReactNode;
}) {
  const size = sm ? "min-w-[24px] h-[24px] text-xs px-1" : "min-w-[30px] h-[30px] text-sm px-2";
  return (
    <span className={`inline-flex items-center justify-center rounded-[8px] font-extrabold ${size} ${PAIN_BADGE[variant]}`}>
      {children}
    </span>
  );
}
