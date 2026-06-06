import type { PainEntry, DiaryEntry } from "./core";

export function formatEntrySummaryDate(entryDate: string, entryTime: string): string {
  const time = entryTime.length >= 5 ? entryTime : `${entryTime}:00`;
  const d = new Date(`${entryDate}T${time}`);
  if (Number.isNaN(d.getTime())) return `${entryDate} ${entryTime}`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
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

export function formatMetricDisplay(value: number | null | undefined, fractionDigits = 0): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: fractionDigits });
}
