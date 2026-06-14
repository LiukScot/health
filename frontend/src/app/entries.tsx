import type { ReactNode, Ref } from "react";
import { Button } from "../components/ui/Button";

// Past-entries primitives shared by CBT/DBT/Diary/Pain. The summary layout
// differs per screen (badges, mood, preview), so these expose styled wrappers
// + class constants the screens compose, rather than one rigid component.

export const ENTRY_ROW =
  "group/row border-0 border-b border-[var(--border-soft)] rounded-none m-0 overflow-hidden bg-transparent transition-[background] duration-150 ease-[ease]";
export const ENTRY_SUMMARY =
  "group/sum list-none grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-stack px-[2px] py-stack cursor-pointer border-0 rounded-none shadow-none bg-transparent min-h-0 [&::-webkit-details-marker]:hidden";
export const ENTRY_DATE =
  "font-medium text-xs font-mono text-muted min-w-[110px] tabular-nums tracking-[0.02em] group-hover/sum:text-text";
export const ENTRY_PREVIEW =
  "text-control text-muted overflow-hidden text-ellipsis whitespace-nowrap group-hover/sum:text-text";
export const ENTRY_CHEVRON =
  "text-muted-soft transition-transform duration-200 ease-[ease] text-nano group-open/row:rotate-90";
export const ENTRY_EXPANDED =
  "px-[2px] pt-inline pb-stack grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-stack";
export const DETAIL_ACTIONS = "[grid-column:1/-1] flex gap-tight justify-end mt-[calc(-1*var(--spacing-tight))]";
export const DETAIL_ACTION_BTN =
  "px-inline py-tight text-xs font-medium text-muted bg-transparent border-0 rounded-[6px] shadow-none cursor-pointer font-[inherit] transition-[color,background] duration-150 ease-[ease] hover:text-text hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]";
export const DELETE_CONFIRM = "text-[#ff3333] bg-[rgba(255,51,51,0.18)] font-extrabold";

export function EntriesHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-control text-muted uppercase tracking-[0.16em] font-bold mt-page mb-stack ${className}`}>
      {children}
    </h2>
  );
}

// Right column of the split form (CBT/DBT/Diary/Pain). Owns the wide-screen
// height-cap layout (--diary-past-col-max-h is set by useDiaryColumnCap) that
// clips overflow rows behind a fade + "Show more". leftColRef stays on the form
// column in the screen; this takes the past column + body refs.
export function PastEntriesColumn({
  title,
  isLoading,
  loadingText,
  isEmpty,
  emptyState,
  overflow,
  colRef,
  bodyRef,
  children,
}: {
  title: ReactNode;
  isLoading: boolean;
  loadingText: string;
  isEmpty: boolean;
  emptyState: ReactNode;
  overflow: boolean;
  colRef: Ref<HTMLDivElement>;
  bodyRef: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <div
      ref={colRef}
      className="min-w-0 min-[1100px]:border-l min-[1100px]:border-[var(--border-soft)] min-[1100px]:pl-split min-[1100px]:flex min-[1100px]:flex-col min-[1100px]:min-h-[var(--diary-past-col-max-h,0)] min-[1100px]:max-h-[var(--diary-past-col-max-h,none)]"
    >
      {isLoading && <p className="text-muted text-control">{loadingText}</p>}
      <EntriesHeading className="min-[1100px]:mt-0">{title}</EntriesHeading>
      {isEmpty ? (
        emptyState
      ) : (
        <div className="min-[1100px]:flex min-[1100px]:flex-col min-[1100px]:flex-1 min-[1100px]:min-h-0">
          <div
            ref={bodyRef}
            className="min-[1100px]:flex-1 min-[1100px]:min-h-0 min-[1100px]:overflow-hidden min-[1100px]:[mask-image:linear-gradient(to_bottom,#000_calc(100%-var(--spacing-block)),transparent)]"
          >
            {children}
          </div>
          <div
            aria-hidden={!overflow}
            className="flex justify-end items-center pt-inline min-[1100px]:flex-shrink-0 min-[1100px]:box-border min-[1100px]:min-h-[calc(var(--spacing-inline)+40px+var(--spacing-block))]"
          >
            {!isLoading && overflow ? <Button className="mb-block">Show more</Button> : null}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline tag chip inside an expanded entry's detail value (former .tag-mini).
export const TAG_MINI =
  "py-[2px] px-inline text-micro text-muted bg-[color-mix(in_srgb,var(--card)_60%,var(--card-strong))] rounded-[4px]";

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
    <nav className="flex flex-wrap gap-y-tight gap-x-block" role="tablist" aria-label={ariaLabel}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`inline-flex items-center gap-inline py-tight px-0 text-control font-medium bg-transparent border-0 border-b rounded-none shadow-none cursor-pointer font-[inherit] whitespace-nowrap min-h-0 transition-[color,border-color] duration-150 ease-[ease] ${active === t.id ? "text-text border-b-accent" : "text-muted border-b-transparent hover:text-text"}`}
          onClick={() => onSelect(t.id)}
        >
          {t.label} <span className={`text-micro font-medium ${active === t.id ? "text-accent" : "text-muted-soft"}`}>{t.count}</span>
        </button>
      ))}
    </nav>
  );
}

export function DetailGroup({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-tight">
      <span className="text-micro text-muted uppercase tracking-[0.05em]">{label}</span>
      <span className="text-control flex flex-wrap gap-tight text-text">{children}</span>
    </div>
  );
}

type PainBadgeVariant = "low" | "mid" | "high" | "muted";
const PAIN_BADGE: Record<PainBadgeVariant, string> = {
  low: "bg-success text-[#0a2018]",
  mid: "bg-warning text-[#2a1a00]",
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
  const size = sm ? "min-w-[24px] h-[24px] text-xs px-tight" : "min-w-[30px] h-[30px] text-sm px-inline";
  return (
    <span className={`inline-flex items-center justify-center rounded-[8px] font-extrabold ${size} ${PAIN_BADGE[variant]}`}>
      {children}
    </span>
  );
}
