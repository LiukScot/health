import { describe, expect, test } from "vitest";
import { groupByMonth, formatMonthLabel } from "./screen-format";

describe("groupByMonth", () => {
  test("cuts a newest-first list into month runs, preserving order", () => {
    const rows = [
      { d: "2026-08-09" },
      { d: "2026-04-19" },
      { d: "2026-04-18" },
      { d: "2025-12-31" },
    ];
    const groups = groupByMonth(rows, (r) => r.d);

    expect(groups.map((g) => g.key)).toEqual(["2026-08", "2026-04", "2025-12"]);
    expect(groups[1].rows).toEqual([{ d: "2026-04-19" }, { d: "2026-04-18" }]);
  });

  test("keeps a month that recurs later as its own run, so order is never re-sorted", () => {
    const groups = groupByMonth(
      [{ d: "2026-04-19" }, { d: "2026-03-01" }, { d: "2026-04-02" }],
      (r) => r.d,
    );

    expect(groups.map((g) => g.key)).toEqual(["2026-04", "2026-03", "2026-04"]);
  });

  test("returns no groups for an empty list", () => {
    expect(groupByMonth([], (r: { d: string }) => r.d)).toEqual([]);
  });

  test("keeps an unparseable date as its own row rather than dropping it", () => {
    const groups = groupByMonth([{ d: "" }], (r) => r.d);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("");
  });
});

describe("formatMonthLabel", () => {
  test("names the month and year", () => {
    expect(formatMonthLabel("2026-08-09")).toMatch(/2026/);
  });
});
