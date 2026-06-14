import { describe, expect, test } from "bun:test";
import {
  countMemorableOccurrences,
  matchesMemorableDate,
} from "./memorable-days.ts";

describe("matchesMemorableDate", () => {
  test("one-time matches only the exact date", () => {
    expect(matchesMemorableDate("2024-03-31", "one-time", "2024-03-31")).toBe(true);
    expect(matchesMemorableDate("2024-03-31", "one-time", "2024-04-01")).toBe(false);
  });

  test("monthly matches the same day-of-month", () => {
    expect(matchesMemorableDate("2024-01-15", "monthly", "2024-03-15")).toBe(true);
    expect(matchesMemorableDate("2024-01-15", "monthly", "2024-03-16")).toBe(false);
  });

  test("monthly 31st clamps to the last day of shorter months", () => {
    // February (28 days, 2025 is not a leap year)
    expect(matchesMemorableDate("2024-01-31", "monthly", "2025-02-28")).toBe(true);
    expect(matchesMemorableDate("2024-01-31", "monthly", "2025-02-27")).toBe(false);
    // February (29 days, 2024 is a leap year)
    expect(matchesMemorableDate("2023-01-31", "monthly", "2024-02-29")).toBe(true);
    expect(matchesMemorableDate("2023-01-31", "monthly", "2024-02-28")).toBe(false);
    // April (30 days)
    expect(matchesMemorableDate("2024-01-31", "monthly", "2024-04-30")).toBe(true);
    expect(matchesMemorableDate("2024-01-31", "monthly", "2024-04-29")).toBe(false);
  });

  test("monthly 31st still matches months that have 31 days exactly", () => {
    expect(matchesMemorableDate("2024-01-31", "monthly", "2024-03-31")).toBe(true);
    expect(matchesMemorableDate("2024-01-31", "monthly", "2024-03-30")).toBe(false);
  });

  test("monthly 30th does not double-fire on a 31-day month's last day", () => {
    expect(matchesMemorableDate("2024-01-30", "monthly", "2024-03-31")).toBe(false);
    expect(matchesMemorableDate("2024-01-30", "monthly", "2024-03-30")).toBe(true);
  });

  test("yearly Feb 29 fires on Feb 28 in non-leap years", () => {
    expect(matchesMemorableDate("2024-02-29", "yearly", "2025-02-28")).toBe(true);
    expect(matchesMemorableDate("2024-02-29", "yearly", "2025-02-27")).toBe(false);
    // and on Feb 29 itself in a leap year
    expect(matchesMemorableDate("2024-02-29", "yearly", "2028-02-29")).toBe(true);
  });
});

describe("countMemorableOccurrences", () => {
  test("counts months since anchor for a clamped monthly match", () => {
    // Jan 31 2024 -> Feb 28 2025 is 13 months later
    expect(countMemorableOccurrences("2024-01-31", "monthly", "2025-02-28")).toBe(13);
  });

  test("counts years since anchor for a clamped yearly match", () => {
    expect(countMemorableOccurrences("2024-02-29", "yearly", "2025-02-28")).toBe(1);
  });

  test("returns null when the date does not match", () => {
    expect(countMemorableOccurrences("2024-01-15", "monthly", "2024-03-16")).toBeNull();
  });
});
