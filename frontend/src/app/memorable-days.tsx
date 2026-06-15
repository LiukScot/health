import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { SectionHead, InlineFeedback, useSplitColumnHeightSync } from "./shared";
import { toDateKey, type InlineMessage, type MemorableDay } from "./core";
import { emojiCatalog, emojiCategoryLabels, type EmojiCategory, type EmojiRecord } from "./emoji-catalog";
import { getErrorMessage } from "../lib";
import { memorableDayPayloadSchema, matchesMemorableDate, type useMemorableDays } from "../hooks/use-memorable-days";
import { DateInput } from "../components/ui/DateInput";
import { Select } from "../components/ui/select";
import { Button, buttonClass } from "../components/ui/Button";
import { FieldLine, FIELD_LINE_LABEL } from "../components/ui/FieldLine";
import { EntriesHeading } from "./entries";

const MEMO_BACKDROP =
  "fixed inset-0 bg-scrim [backdrop-filter:blur(6px)] grid place-items-center p-5 z-40";
const MEMO_MODAL = "w-[min(520px,100%)] p-5 flex flex-col gap-3 bg-card border-0 rounded-md shadow-none";
export const MEMO_DAY_CELL =
  "min-h-[108px] p-3 rounded-md bg-card-soft text-text text-left flex flex-col gap-2 relative transition-[background,color] duration-150 ease-[ease] hover:bg-[color-mix(in_srgb,var(--text)_4%,var(--card-soft))]";
export const MEMO_LIST_ITEM =
  "flex items-center justify-between flex-[0_0_auto] w-full gap-3 p-3 rounded-md border-0 bg-card-soft text-text shadow-none hover:bg-[color-mix(in_srgb,var(--text)_4%,var(--card-soft))]";
const MEMO_MODAL_ACTIONS = "flex items-center gap-3 justify-end flex-wrap";
const EMOJI_TAB =
  "min-h-0 px-[4px] py-0 rounded-none border border-transparent bg-transparent shadow-none text-micro font-bold tracking-[0.08em] uppercase cursor-pointer focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]";
const EMOJI_BTN =
  "min-h-0 p-[2px] rounded-none border border-transparent bg-transparent shadow-none inline-flex items-center justify-center text-title leading-none cursor-pointer focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]";
// Exported so the Design System demo reuses the exact production contracts.
export const DAY_NUMBER =
  "bg-transparent border-0 shadow-none min-h-0 p-0 font-[inherit] text-[inherit] cursor-pointer leading-none";
export const EMOJI_TRIGGER =
  "min-w-0 min-h-0 p-0 rounded-none inline-flex items-center justify-center bg-transparent border border-transparent text-text shadow-none cursor-pointer focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]";

type Props = {
  memorable: ReturnType<typeof useMemorableDays>;
};

type DraftState = {
  id: number | null;
  date: string;
  title: string;
  emoji: string;
  description: string;
  repeatMode: "one-time" | "monthly" | "yearly";
  locked: boolean;
};

type MemorableLookups = {
  oneTimeByDate: Map<string, MemorableDay[]>;
  monthlyByDay: Map<number, MemorableDay[]>;
  yearlyByMonthDay: Map<string, MemorableDay[]>;
};

type EmojiPickerScrollTopByCategory = Record<EmojiCategory, number>;

type EmojiPickerState = {
  open: boolean;
  activeCategory: EmojiCategory;
  search: string;
  recent: string[];
  scrollTopByCategory: EmojiPickerScrollTopByCategory;
};

const emojiCategoryOrder = Object.keys(emojiCategoryLabels) as EmojiCategory[];

const REPEAT_OPTIONS: { value: DraftState["repeatMode"]; label: string }[] = [
  { value: "one-time", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function createEmojiPickerScrollTopByCategory(): EmojiPickerScrollTopByCategory {
  return {
    recent: 0,
    smileys: 0,
    people: 0,
    nature: 0,
    food: 0,
    travel: 0,
    objects: 0,
    symbols: 0,
    flags: 0,
  };
}

function createEmojiPickerState(): EmojiPickerState {
  return {
    open: false,
    activeCategory: "recent",
    search: "",
    recent: [],
    scrollTopByCategory: createEmojiPickerScrollTopByCategory(),
  };
}

function buildCalendarDays(month: Date, weekStart: "sunday" | "monday") {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const firstOffset = weekStart === "monday" ? (firstDay.getDay() + 6) % 7 : firstDay.getDay();
  const lastOffset = weekStart === "monday" ? (6 - ((lastDay.getDay() + 6) % 7)) : (6 - lastDay.getDay());
  const start = new Date(firstDay);
  start.setDate(start.getDate() - firstOffset);
  const end = new Date(lastDay);
  end.setDate(end.getDate() + lastOffset);
  const dayCount = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  return Array.from({ length: dayCount }, (_, index) => {
    const value = new Date(start);
    value.setDate(start.getDate() + index);
    return value;
  });
}

function emptyDraft(date: string): DraftState {
  return { id: null, date, title: "", emoji: "", description: "", repeatMode: "one-time", locked: false };
}

function getDraftErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    const titleIssue = error.issues.find((issue) => issue.path[0] === "title");
    if (titleIssue) return "Title is required.";
    const dateIssue = error.issues.find((issue) => issue.path[0] === "date");
    if (dateIssue) return "Date is invalid.";
    return "Check the form fields and try again.";
  }
  return getErrorMessage(error);
}

function buildMemorableLookups(items: MemorableDay[]): MemorableLookups {
  const oneTimeByDate = new Map<string, MemorableDay[]>();
  const monthlyByDay = new Map<number, MemorableDay[]>();
  const yearlyByMonthDay = new Map<string, MemorableDay[]>();

  for (const item of items) {
    const [, month, day] = item.date.split("-").map(Number);
    if (item.repeatMode === "one-time") {
      oneTimeByDate.set(item.date, [...(oneTimeByDate.get(item.date) ?? []), item]);
      continue;
    }
    if (item.repeatMode === "monthly") {
      monthlyByDay.set(day, [...(monthlyByDay.get(day) ?? []), item]);
      continue;
    }
    const monthDayKey = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    yearlyByMonthDay.set(monthDayKey, [...(yearlyByMonthDay.get(monthDayKey) ?? []), item]);
  }

  return { oneTimeByDate, monthlyByDay, yearlyByMonthDay };
}

const emojiByValue = new Map(emojiCatalog.map((record) => [record.emoji, record]));
const emojiRecordsByCategory = (() => {
  const grouped = {
    smileys: [] as EmojiRecord[],
    people: [] as EmojiRecord[],
    nature: [] as EmojiRecord[],
    food: [] as EmojiRecord[],
    travel: [] as EmojiRecord[],
    objects: [] as EmojiRecord[],
    symbols: [] as EmojiRecord[],
    flags: [] as EmojiRecord[],
  };
  for (const record of emojiCatalog) {
    grouped[record.category].push(record);
  }
  return grouped;
})();

export function MemorableDaysSection({ memorable }: Props) {
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [feedback, setFeedback] = useState<InlineMessage | null>(null);
  const [successDateKey, setSuccessDateKey] = useState<string | null>(null);
  const [popoverDateKey, setPopoverDateKey] = useState<string | null>(null);
  const [emojiPicker, setEmojiPicker] = useState<EmojiPickerState>(() => createEmojiPickerState());
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerScrollRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerSearchRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerWasOpenRef = useRef(false);
  const weekdayLabels = memorable.weekStart === "monday"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = useMemo(() => buildCalendarDays(memorable.visibleMonth, memorable.weekStart), [memorable.visibleMonth, memorable.weekStart]);
  const lookups = useMemo(() => buildMemorableLookups(memorable.memorableDays), [memorable.memorableDays]);
  const {
    open: emojiPickerOpen,
    activeCategory: emojiPickerActiveCategory,
    search: emojiPickerSearch,
    recent: emojiPickerRecent,
    scrollTopByCategory: emojiPickerScrollTopByCategory,
  } = emojiPicker;
  const todayKey = toDateKey(new Date());
  const { leftColRef, rightColRef } = useSplitColumnHeightSync([days.length, memorable.memorableDays.length, memorable.isLoading]);
  const popoverItems = useMemo(() => {
    if (!popoverDateKey) return [];
    const [,, day] = popoverDateKey.split("-").map(Number);
    const monthDayKey = popoverDateKey.slice(5);
    return [
      ...(lookups.oneTimeByDate.get(popoverDateKey) ?? []),
      ...(lookups.monthlyByDay.get(day) ?? []),
      ...(lookups.yearlyByMonthDay.get(monthDayKey) ?? []),
    ].filter((item) => matchesMemorableDate(item, popoverDateKey));
  }, [popoverDateKey, lookups]);
  const emojiPickerRecords = useMemo(() => {
    const search = emojiPickerSearch.trim().toLowerCase();
    if (search) {
      // When searching, search the full catalog instead of just the active category
      return emojiCatalog.filter((record) => record.searchText.includes(search));
    }
    const baseRecords = emojiPickerActiveCategory === "recent"
      ? emojiPickerRecent.map((emoji) => emojiByValue.get(emoji)).filter((record): record is EmojiRecord => Boolean(record))
      : emojiRecordsByCategory[emojiPickerActiveCategory];
    return baseRecords;
  }, [emojiPickerActiveCategory, emojiPickerRecent, emojiPickerSearch]);

  useEffect(() => {
    if (!draft) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !emojiPickerOpen) {
        setDraft(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [draft, emojiPickerOpen]);

  useEffect(() => {
    if (!successDateKey) return;
    const timer = window.setTimeout(() => setSuccessDateKey(null), 2500);
    return () => window.clearTimeout(timer);
  }, [successDateKey]);

  useEffect(() => {
    if (!popoverDateKey) return;
    const onMouseDown = (event: MouseEvent) => {
      if (popoverRef.current?.contains(event.target as Node)) return;
      setPopoverDateKey(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPopoverDateKey(null);
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [popoverDateKey]);

  useEffect(() => {
    if (!emojiPickerOpen) return;
    const savedScrollTop = emojiPickerScrollTopByCategory[emojiPickerActiveCategory] ?? 0;
    const wasOpen = emojiPickerWasOpenRef.current;
    emojiPickerWasOpenRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      if (!wasOpen && emojiPickerSearchRef.current) {
        emojiPickerSearchRef.current.focus();
      }
      if (emojiPickerScrollRef.current) {
        emojiPickerScrollRef.current.scrollTop = savedScrollTop;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [emojiPickerActiveCategory, emojiPickerOpen, emojiPickerScrollTopByCategory]);

  useEffect(() => {
    if (emojiPickerOpen) return;
    emojiPickerWasOpenRef.current = false;
  }, [emojiPickerOpen]);

  const rememberEmojiPickerScrollTop = useCallback(() => {
    const scroller = emojiPickerScrollRef.current;
    if (!scroller) return;
    const nextScrollTop = scroller.scrollTop;
    setEmojiPicker((current) => {
      const currentScrollTop = current.scrollTopByCategory[current.activeCategory] ?? 0;
      if (currentScrollTop === nextScrollTop) return current;
      return {
        ...current,
        scrollTopByCategory: {
          ...current.scrollTopByCategory,
          [current.activeCategory]: nextScrollTop,
        },
      };
    });
  }, []);

  const closeEmojiPicker = useCallback(() => {
    rememberEmojiPickerScrollTop();
    setEmojiPicker((current) => ({ ...current, open: false }));
  }, [rememberEmojiPickerScrollTop]);

  useEffect(() => {
    if (!emojiPickerOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (emojiPickerRef.current?.contains(event.target as Node)) return;
      closeEmojiPicker();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeEmojiPicker();
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeEmojiPicker, emojiPickerOpen]);

  useEffect(() => {
    if (!draft?.date) return;
    const [year, month] = draft.date.split("-").map(Number);
    if (!year || !month) return;
    memorable.setVisibleMonth(new Date(year, month - 1, 1));
  }, [draft?.date, memorable]);

  const closeDraft = () => {
    setDraft(null);
    setFeedback(null);
    closeEmojiPicker();
  };

  const onSave = async () => {
    if (!draft) return;
    try {
      const payload = memorableDayPayloadSchema.parse({
        date: draft.date,
        title: draft.title,
        emoji: draft.emoji,
        description: draft.description,
        repeatMode: draft.repeatMode,
      });
      if (draft.id) await memorable.updateMemorableDay(draft.id, payload);
      else await memorable.createMemorableDay(payload);
      setSuccessDateKey(draft.date);
      closeDraft();
    } catch (error) {
      setFeedback({ tone: "error", text: getDraftErrorMessage(error) });
    }
  };

  const onDelete = async () => {
    if (!draft?.id) return;
    try {
      await memorable.deleteMemorableDay(draft.id);
      closeDraft();
    } catch (error) {
      setFeedback({ tone: "error", text: getErrorMessage(error) });
    }
  };

  const openCreate = (date: string) => {
    memorable.setSelectedDate(date);
    setFeedback(null);
    closeEmojiPicker();
    setDraft(emptyDraft(date));
  };

  const openEdit = (item: MemorableDay) => {
    memorable.setSelectedDate(item.date);
    memorable.setVisibleMonth(new Date(`${item.date}T00:00:00`));
    setFeedback(null);
    closeEmojiPicker();
    setDraft({
      id: item.id > 0 ? item.id : null,
      date: item.date,
      title: item.title,
      emoji: item.emoji,
      description: item.description,
      repeatMode: item.repeatMode,
      locked: item.locked,
    });
  };

  const openEmojiPicker = () => {
    setEmojiPicker((current) => ({ ...current, open: true }));
    emojiPickerWasOpenRef.current = false;
  };

  const selectEmoji = (record: EmojiRecord) => {
    setDraft((current) => (current ? { ...current, emoji: record.emoji } : current));
    setEmojiPicker((current) => ({
      ...current,
      recent: [record.emoji, ...current.recent.filter((emoji) => emoji !== record.emoji)].slice(0, 24),
    }));
    closeEmojiPicker();
  };

  const onListItemWheel = (event: React.WheelEvent<HTMLButtonElement>) => {
    const list = event.currentTarget.closest(".memorable-list");
    if (!(list instanceof HTMLElement)) return;
    if (list.scrollHeight <= list.clientHeight + 1) return;
    const newScrollTop = Math.max(0, Math.min(list.scrollTop + event.deltaY, list.scrollHeight - list.clientHeight));
    if (newScrollTop !== list.scrollTop) {
      list.scrollTop = newScrollTop;
      event.preventDefault();
    }
  };

  return (
    <section className="@container p-2 relative">
      <div>
        <div>
          <h1 className="m-0 mb-3 text-title font-bold tracking-tight text-text">Memorable days</h1>
          <SectionHead title="Calendar" variant="dashboard" />
        </div>
      </div>
      <Button variant="primary" className="absolute top-8 right-2" onClick={() => openCreate(toDateKey(new Date()))}>Add new</Button>
      {feedback?.tone === "error" ? <InlineFeedback message={feedback} /> : null}

      <div className="grid gap-12 items-start grid-cols-[minmax(0,1.55fr)_minmax(280px,0.9fr)] max-xwide:grid-cols-1 max-xwide:gap-0">
        <section ref={leftColRef} className="min-w-0 p-0 max-xwide:border-b max-xwide:border-border max-xwide:pb-8">
          <div className="flex items-center justify-between gap-2 mb-8 min-w-0">
            <Button className="flex-shrink-0 tracking-[0.01em]" onClick={() => memorable.setVisibleMonth(new Date(memorable.visibleMonth.getFullYear(), memorable.visibleMonth.getMonth() - 1, 1))}>
              Prev
            </Button>
            <Button
              className="tracking-[0.01em] min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
              onClick={() => memorable.setVisibleMonth(new Date())}
              aria-label="Go to current month"
            >
              {new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" }).format(new Date())}
            </Button>
            <Button className="flex-shrink-0 tracking-[0.01em]" onClick={() => memorable.setVisibleMonth(new Date(memorable.visibleMonth.getFullYear(), memorable.visibleMonth.getMonth() + 1, 1))}>
              Next
            </Button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {weekdayLabels.map((label) => <span key={label} className="flex-1 text-center text-muted text-xs font-bold uppercase">{label}</span>)}
          </div>
          <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-2">
            {days.map((day) => {
              const dayKey = toDateKey(day);
              const monthMatch = day.getMonth() === memorable.visibleMonth.getMonth();
              const isToday = dayKey === todayKey;
              const monthDayKey = dayKey.slice(5);
              const items = [
                ...(lookups.oneTimeByDate.get(dayKey) ?? []),
                ...(lookups.monthlyByDay.get(day.getDate()) ?? []),
                ...(lookups.yearlyByMonthDay.get(monthDayKey) ?? []),
              ].filter((item) => matchesMemorableDate(item, dayKey));
              return (
                <div
                  key={dayKey}
                  className={`${MEMO_DAY_CELL}${monthMatch ? "" : " opacity-[0.48]"}${isToday ? " shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_28%,transparent)]" : ""}`}
                  onClick={(event) => {
                    if ((event.target as Element).closest("button")) return;
                    memorable.setSelectedDate(dayKey);
                    if (items.length > 0) setPopoverDateKey(popoverDateKey === dayKey ? null : dayKey);
                    else openCreate(dayKey);
                  }}
                >
                  <span className="flex items-center justify-between">
                    <button
                      type="button"
                      className={DAY_NUMBER}
                      aria-label={items.length > 0 ? `View events on ${dayKey}` : `${day.getDate()}`}
                      onClick={() => {
                        memorable.setSelectedDate(dayKey);
                        if (items.length > 0) setPopoverDateKey(popoverDateKey === dayKey ? null : dayKey);
                      }}
                    >
                      {day.getDate()}
                    </button>
                  </span>
                  <span className="flex flex-col gap-2">
                    {items.slice(0, 2).map((item) => (
                      <span key={`${item.source}-${item.id}-${item.date}`} className="text-xs leading-snug text-muted whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.emoji || "•"} {item.title}
                      </span>
                    ))}
                    {items.length > 2 ? (
                      <span className="text-micro font-semibold text-accent leading-snug opacity-75">+{items.length - 2} more</span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section ref={rightColRef} className="min-w-0 flex flex-col min-h-0 overflow-hidden h-[var(--split-col-height,auto)] max-h-[var(--split-col-height,none)] max-xwide:h-auto max-xwide:max-h-none max-xwide:pt-5 max-[980px]:pt-0">
          <EntriesHeading className="mt-0 mb-5">All memorable days</EntriesHeading>
          {memorable.isLoading ? (
            <p className="text-muted text-control">Loading memorable days...</p>
          ) : memorable.memorableDays.length === 0 ? (
            <div className="grid gap-2 my-3">
              <p className="text-control font-semibold text-text m-0">No memorable days yet</p>
              <p className="max-w-[60ch] text-control text-muted leading-normal m-0">Add one birthday, anniversary, or event to start the list.</p>
            </div>
          ) : (
            <div className="memorable-list flex flex-col flex-[1_1_auto] min-h-0 overflow-y-auto overflow-x-hidden gap-3 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgba(255,255,255,0.18)_transparent] focus-within:[scrollbar-color:rgba(255,255,255,0.18)_transparent] max-xwide:max-h-none">
              {memorable.memorableDays.map((item) => (
                <button
                  type="button"
                  key={`${item.source}-${item.id}-${item.date}`}
                  className={MEMO_LIST_ITEM}
                  onWheelCapture={onListItemWheel}
                  onClick={() => openEdit(item)}
                >
                  <span className="text-title leading-none">{item.emoji || "✨"}</span>
                  <span className="flex-1 flex flex-col gap-1 items-start">
                    <span className="w-full flex items-baseline justify-between gap-3">
                      <strong className="text-base min-w-0 text-text">{item.title}</strong>
                      <span className="text-muted text-control flex-shrink-0 text-right">{item.date}</span>
                    </span>
                    <span className="text-micro text-muted-soft">{item.locked ? "Locked from Settings" : item.repeatMode}</span>
                  </span>
                </button>
                ))}
            </div>
          )}
        </section>
      </div>

      {draft ? (
        <div className={MEMO_BACKDROP} role="presentation" onClick={closeDraft}>
          <div className={MEMO_MODAL} role="dialog" aria-modal="true" aria-label={draft.id ? "Edit memorable day" : "Add memorable day"} onClick={(event) => event.stopPropagation()}>
            <SectionHead title={draft.id ? "Edit memorable day" : "Add memorable day"} variant="dashboard" />
            <div className="grid grid-cols-[168px_88px] gap-3 items-start justify-start">
              <label className="grid gap-2 content-start min-w-0">
                <span className={FIELD_LINE_LABEL}>Date</span>
                <DateInput value={draft.date} onChange={(value) => setDraft((current) => current ? { ...current, date: value } : current)} ariaLabel="Date" />
              </label>
              <label className="grid gap-2 content-start w-[88px] min-w-[88px] justify-self-end self-start">
                <span className={FIELD_LINE_LABEL}>Emoji</span>
                <div ref={emojiPickerRef} className="relative w-full min-w-0">
                  <button
                    type="button"
                    className={EMOJI_TRIGGER}
                    aria-label={`Emoji ${draft.emoji || "✨"}`}
                    aria-haspopup="dialog"
                    aria-expanded={emojiPickerOpen}
                    aria-controls="emoji-picker-panel"
                    onClick={() => {
                      if (emojiPickerOpen) {
                        closeEmojiPicker();
                        return;
                      }
                      openEmojiPicker();
                    }}
                  >
                    <span aria-hidden="true" className="text-[32px] leading-none">
                      {draft.emoji || "✨"}
                    </span>
                  </button>

                  {emojiPickerOpen ? (
                    <div
                      id="emoji-picker-panel"
                      role="dialog"
                      aria-label="Emoji picker"
                      className="absolute top-full mt-2 right-0 w-[min(420px,calc(100vw-32px))] max-w-[min(420px,calc(100vw-32px))] max-h-[min(520px,calc(100vh-180px))] flex flex-col gap-3 p-3 bg-card border border-border rounded-md shadow-[var(--shadow)] z-30"
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      <label className="grid gap-2 content-start m-0">
                        <span className={`${FIELD_LINE_LABEL} pt-0 pb-0`}>Search emoji</span>
                        <input
                          ref={emojiPickerSearchRef}
                          className="w-full bg-[color-mix(in_srgb,white_3%,var(--bg))] border-0 rounded-sm px-3 py-2 text-text text-control font-medium font-body shadow-none outline-none transition-[background,box-shadow] duration-150 ease-[ease] hover:bg-[color-mix(in_srgb,white_5%,var(--bg))] focus:bg-[color-mix(in_srgb,white_5%,var(--bg))] focus:shadow-[inset_0_0_0_1px_var(--accent)] placeholder:text-muted-soft [[data-theme=oled]_&]:bg-card-soft"
                          type="search"
                          value={emojiPickerSearch}
                          onChange={(event) => setEmojiPicker((current) => ({ ...current, search: event.target.value }))}
                          placeholder="Search emoji"
                        />
                      </label>

                      <div role="tablist" aria-label="Emoji categories" className="flex flex-wrap gap-2">
                        {emojiCategoryOrder.map((category) => {
                          const isActive = emojiPickerActiveCategory === category;
                          const label = emojiCategoryLabels[category];
                          return (
                            <button
                              key={category}
                              type="button"
                              role="tab"
                              aria-selected={isActive}
                              className={`${EMOJI_TAB} ${isActive ? "text-accent" : "text-muted hover:text-text"}`}
                              onClick={() => {
                                rememberEmojiPickerScrollTop();
                                setEmojiPicker((current) => ({ ...current, activeCategory: category }));
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      <div
                        ref={emojiPickerScrollRef}
                        className="min-h-0 max-h-[320px] overflow-auto [overscroll-behavior:contain] [scrollbar-width:thin] [scrollbar-gutter:stable] pr-[2px] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgba(255,255,255,0.18)_transparent] focus-within:[scrollbar-color:rgba(255,255,255,0.18)_transparent]"
                      >
                        {emojiPickerRecords.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {emojiPickerRecords.map((record) => {
                              const isSelected = draft.emoji === record.emoji;
                              return (
                                <button
                                  key={record.emoji}
                                  type="button"
                                  aria-label={record.name}
                                  aria-pressed={isSelected}
                                  className={`${EMOJI_BTN} ${isSelected ? "text-text" : ""}`}
                                  onClick={() => selectEmoji(record)}
                                >
                                  {record.emoji}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="m-0 px-[2px] pt-2 pb-[2px] text-center text-muted-soft text-control">
                            No emoji match.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </label>
            </div>
            <FieldLine
              label="Title"
              type="text"
              value={draft.title}
              onChange={(event) => setDraft((current) => current ? { ...current, title: event.target.value } : current)}
            />
            <FieldLine
              label="Description"
              multiline
              compact
              rows={3}
              value={draft.description}
              onChange={(event) => setDraft((current) => current ? { ...current, description: event.target.value } : current)}
            />
            <div className="grid gap-2 content-start">
              <span className={FIELD_LINE_LABEL}>Repeat</span>
              <Select
                ariaLabel="Repeat"
                value={draft.repeatMode}
                onValueChange={(value) => {
                  const option = REPEAT_OPTIONS.find((item) => item.value === value);
                  if (option) setDraft((current) => current ? { ...current, repeatMode: option.value } : current);
                }}
                options={REPEAT_OPTIONS}
                disabled={draft.locked}
              />
            </div>
            {draft.locked ? <p className="text-muted text-control">Edit birthday in Settings. Same truth, less duplication.</p> : null}
            <div className={MEMO_MODAL_ACTIONS}>
              <Button variant="primary" onClick={() => void onSave()} disabled={memorable.isSaving || draft.locked}>
                Save
              </Button>
              {draft.id && !draft.locked ? (
                <Button variant="danger" onClick={() => void onDelete()} disabled={memorable.isSaving}>
                  Delete
                </Button>
              ) : null}
              <button type="button" className={buttonClass("default", "md", "!bg-[color-mix(in_srgb,var(--text)_10%,transparent)] hover:!bg-[color-mix(in_srgb,var(--text)_16%,transparent)]")} onClick={closeDraft}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {popoverDateKey ? (
        <div className={MEMO_BACKDROP} role="presentation" onClick={() => setPopoverDateKey(null)}>
          <div ref={popoverRef} className={MEMO_MODAL} role="dialog" aria-modal="true" aria-label={`Events on ${popoverDateKey}`} onClick={(event) => event.stopPropagation()}>
            <SectionHead title={popoverDateKey} variant="dashboard" />
            <div className="flex flex-col gap-2 m-0 mb-2">
              {popoverItems.map((item) => (
                <button
                  key={`${item.source}-${item.id}-${item.date}`}
                  type="button"
                  className="flex items-center gap-3 bg-card-soft border-0 shadow-none min-h-0 p-[8px_12px] rounded-md text-text text-left cursor-pointer w-full transition-[background] duration-150 ease-[ease] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                  onClick={() => {
                    setPopoverDateKey(null);
                    openEdit(item);
                  }}
                >
                  <span className="text-xl flex-shrink-0">{item.emoji || "✨"}</span>
                  <span className="flex flex-col gap-[2px]">
                    <strong className="text-text">{item.title}</strong>
                    <span className="text-micro text-muted-soft">{item.repeatMode}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className={MEMO_MODAL_ACTIONS}>
              <Button variant="primary" onClick={() => { setPopoverDateKey(null); openCreate(popoverDateKey); }}>
                Add new
              </Button>
              <button type="button" className={buttonClass("default", "md", "!bg-[color-mix(in_srgb,var(--text)_10%,transparent)] hover:!bg-[color-mix(in_srgb,var(--text)_16%,transparent)]")} onClick={() => setPopoverDateKey(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
