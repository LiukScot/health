import type { PainEntry, DiaryEntry } from "./core";

export function formatEntrySummaryDate(entryDate: string, entryTime: string): string {
  const time = entryTime.length >= 5 ? entryTime : `${entryTime}:00`;
  const d = new Date(`${entryDate}T${time}`);
  if (Number.isNaN(d.getTime())) return `${entryDate} ${entryTime}`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

const MONTH_LABEL = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

/** "August 2026" — the heading the entry log groups rows under. */
export function formatMonthLabel(entryDate: string): string {
  const d = new Date(`${entryDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return entryDate;
  return MONTH_LABEL.format(d);
}

/**
 * Rows in the order given, cut into runs that share a month. A run, not a
 * map: the list is already sorted newest first, so a plain scan keeps that
 * order and needs no re-sort. Entries with an unparseable date fall into
 * their own run rather than being dropped.
 */
export function groupByMonth<T>(rows: T[], dateOf: (row: T) => string): { key: string; label: string; rows: T[] }[] {
  const groups: { key: string; label: string; rows: T[] }[] = [];
  for (const row of rows) {
    const date = dateOf(row);
    const key = date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.rows.push(row);
    else groups.push({ key, label: formatMonthLabel(date), rows: [row] });
  }
  return groups;
}

export function bandNine(level: number | null | undefined, higherIsBetter = false): "low" | "mid" | "high" | "" {
  if (level == null || Number.isNaN(Number(level))) return "";
  const n = Math.round(Number(level));
  if (higherIsBetter) {
    if (n <= 3) return "high";
    if (n <= 6) return "mid";
    return "low";
  }
  if (n <= 3) return "low";
  if (n <= 6) return "mid";
  return "high";
}

export function painPreview(entry: PainEntry): string {
  const parts = [entry.area, entry.symptoms].filter((p) => p?.trim()).join(", ");
  const note = entry.note?.trim();
  if (parts && note) return `${parts} · ${note}`;
  if (parts) return parts;
  if (note) return note;
  return "—";
}

export function diaryPreview(entry: DiaryEntry): string {
  const moodBits = [entry.positiveMoods, entry.negativeMoods, entry.generalMoods].map((s) => s?.trim()).filter(Boolean).join(", ");
  const desc = entry.description?.trim();
  if (moodBits && desc) return `${moodBits} · ${desc}`;
  return moodBits || desc || "—";
}

