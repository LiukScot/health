import type { KpiTone } from "./dashboard-cards";

/*
 * formatDelta already answers "is this good or bad" and returns it as the
 * discriminant; the cards only rename it. Its own file because a module
 * that exports both components and helpers breaks fast refresh — and
 * because the previous version matched on substrings formatDelta never
 * emits, so every delta rendered flat and nothing failed.
 */
export const toneOfDelta = (className: string): KpiTone =>
  className === "positive" ? "positive" : className === "negative" ? "negative" : "flat";
