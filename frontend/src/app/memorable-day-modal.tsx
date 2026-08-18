import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { SectionHead, InlineFeedback } from "./shared";
import type { InlineMessage } from "./core";
import { emojiCatalog, emojiCategoryLabels, type EmojiCategory, type EmojiRecord } from "./emoji-catalog";
import { getErrorMessage } from "../lib";
import { memorableDayPayloadSchema } from "../hooks/use-memorable-days";
import { DateInput } from "../components/ui/DateInput";
import { Button, buttonClass } from "../components/ui/Button";
import { FieldLine, FIELD_LINE_LABEL } from "../components/ui/FieldLine";
import {
  EMOJI_TRIGGER,
  MEMO_BACKDROP,
  MEMO_MODAL,
  MEMO_MODAL_ACTIONS,
} from "./memorable-days-constants";

const EMOJI_TAB =
  "min-h-0 px-[4px] py-0 rounded-none border border-transparent bg-transparent shadow-none text-micro font-bold tracking-[0.08em] uppercase cursor-pointer focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]";
const EMOJI_BTN =
  "min-h-0 p-[2px] rounded-none border border-transparent bg-transparent shadow-none inline-flex items-center justify-center text-title leading-none cursor-pointer focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]";

export type DraftState = {
  id: number | null;
  date: string;
  title: string;
  emoji: string;
  description: string;
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

function createEmojiPickerScrollTopByCategory(): EmojiPickerScrollTopByCategory {
  return { recent: 0, smileys: 0, people: 0, nature: 0, food: 0, travel: 0, objects: 0, symbols: 0, flags: 0 };
}

function createEmojiPickerState(): EmojiPickerState {
  return { open: false, activeCategory: "recent", search: "", recent: [], scrollTopByCategory: createEmojiPickerScrollTopByCategory() };
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

const emojiByValue = new Map(emojiCatalog.map((record) => [record.emoji, record]));
const emojiRecordsByCategory = (() => {
  const grouped = {
    smileys: [] as EmojiRecord[], people: [] as EmojiRecord[], nature: [] as EmojiRecord[],
    food: [] as EmojiRecord[], travel: [] as EmojiRecord[], objects: [] as EmojiRecord[],
    symbols: [] as EmojiRecord[], flags: [] as EmojiRecord[],
  };
  for (const record of emojiCatalog) {
    grouped[record.category].push(record);
  }
  return grouped;
})();

type Props = {
  initialDraft: DraftState;
  isSaving: boolean;
  onSave: (draft: DraftState) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onClose: () => void;
  onDraftDateChange: (date: string) => void;
};

export function MemorableDayModal({ initialDraft, isSaving, onSave, onDelete, onClose, onDraftDateChange }: Props) {
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const [feedback, setFeedback] = useState<InlineMessage | null>(null);
  const [emojiPicker, setEmojiPicker] = useState<EmojiPickerState>(() => createEmojiPickerState());
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerScrollRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerSearchRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerWasOpenRef = useRef(false);

  const {
    open: emojiPickerOpen,
    activeCategory: emojiPickerActiveCategory,
    search: emojiPickerSearch,
    recent: emojiPickerRecent,
    scrollTopByCategory: emojiPickerScrollTopByCategory,
  } = emojiPicker;

  const emojiPickerRecords = (() => {
    const search = emojiPickerSearch.trim().toLowerCase();
    if (search) {
      return emojiCatalog.filter((record) => record.searchText.includes(search));
    }
    return emojiPickerActiveCategory === "recent"
      ? emojiPickerRecent.map((emoji) => emojiByValue.get(emoji)).filter((record): record is EmojiRecord => Boolean(record))
      : emojiRecordsByCategory[emojiPickerActiveCategory];
  })();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !emojiPickerOpen) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [emojiPickerOpen, onClose]);

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

  useEffect(() => {
    if (!draft.date) return;
    onDraftDateChange(draft.date);
  }, [draft.date, onDraftDateChange]);

  const rememberEmojiPickerScrollTop = useCallback(() => {
    const scroller = emojiPickerScrollRef.current;
    if (!scroller) return;
    const nextScrollTop = scroller.scrollTop;
    setEmojiPicker((current) => {
      const currentScrollTop = current.scrollTopByCategory[current.activeCategory] ?? 0;
      if (currentScrollTop === nextScrollTop) return current;
      return { ...current, scrollTopByCategory: { ...current.scrollTopByCategory, [current.activeCategory]: nextScrollTop } };
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
      if (event.key === "Escape") closeEmojiPicker();
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeEmojiPicker, emojiPickerOpen]);

  const openEmojiPicker = () => {
    setEmojiPicker((current) => ({ ...current, open: true }));
    emojiPickerWasOpenRef.current = false;
  };

  const selectEmoji = (record: EmojiRecord) => {
    setDraft((current) => ({ ...current, emoji: record.emoji }));
    setEmojiPicker((current) => ({
      ...current,
      recent: [record.emoji, ...current.recent.filter((emoji) => emoji !== record.emoji)].slice(0, 24),
    }));
    closeEmojiPicker();
  };

  const handleSave = async () => {
    try {
      const payload = memorableDayPayloadSchema.parse({
        date: draft.date, title: draft.title, emoji: draft.emoji,
        description: draft.description,
      });
      await onSave({ ...draft, ...payload });
    } catch (error) {
      setFeedback({ tone: "error", text: getDraftErrorMessage(error) });
    }
  };

  const handleDelete = async () => {
    if (!draft.id) return;
    try {
      await onDelete(draft.id);
    } catch (error) {
      setFeedback({ tone: "error", text: getErrorMessage(error) });
    }
  };

  return (
    <div className={MEMO_BACKDROP} role="presentation" onClick={onClose}>
      <div className={MEMO_MODAL} role="dialog" aria-modal="true" aria-label={draft.id ? "Edit memorable day" : "Add memorable day"} onClick={(event) => event.stopPropagation()}>
        <SectionHead title={draft.id ? "Edit memorable day" : "Add memorable day"} variant="dashboard" />
        {feedback?.tone === "error" ? <InlineFeedback message={feedback} /> : null}
        <div className="grid grid-cols-[168px_88px] gap-3 items-start justify-start">
          <label className="grid gap-2 content-start min-w-0">
            <span className={FIELD_LINE_LABEL}>Date</span>
            <DateInput value={draft.date} onChange={(value) => setDraft((current) => ({ ...current, date: value }))} ariaLabel="Date" />
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
                onClick={() => { if (emojiPickerOpen) { closeEmojiPicker(); return; } openEmojiPicker(); }}
              >
                <span aria-hidden="true" className="text-[32px] leading-none">{draft.emoji || "✨"}</span>
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
                      id="emoji-search"
                      name="emoji-search"
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
                      <p className="m-0 px-[2px] pt-2 pb-[2px] text-center text-muted-soft text-control">No emoji match.</p>
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
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        />
        <FieldLine
          label="Description"
          multiline
          compact
          rows={3}
          value={draft.description}
          onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
        />
        <div className={MEMO_MODAL_ACTIONS}>
          <Button variant="primary" onClick={() => void handleSave()} disabled={isSaving}>
            Save
          </Button>
          {draft.id ? (
            <Button variant="danger" onClick={() => void handleDelete()} disabled={isSaving}>
              Delete
            </Button>
          ) : null}
          <button type="button" className={buttonClass("default", "md", "!bg-[color-mix(in_srgb,var(--text)_10%,transparent)] hover:!bg-[color-mix(in_srgb,var(--text)_16%,transparent)]")} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
