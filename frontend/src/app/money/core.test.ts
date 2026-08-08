import { describe, expect, test } from "vitest";
import {
  computeRiskTotals,
  formatCurrency,
  formatTxDate,
  freshMovementDefaults,
  freshSnapshotDefaults,
  freshTxDefaults,
  movementFormSchema,
  snapshotFormSchema,
  TIPO_OPTIONS,
  tipoShowsBuyValue,
  tipoShowsPnl,
  todayIso,
  transactionSchema,
} from "./core";

describe("tipo field visibility", () => {
  test("only 'nuovo vincolo' books a buy value", () => {
    expect(tipoShowsBuyValue("nuovo vincolo")).toBe(true);
    expect(tipoShowsPnl("nuovo vincolo")).toBe(false);
  });

  test("every other tipo records PnL instead", () => {
    for (const tipo of TIPO_OPTIONS.filter((t) => t !== "nuovo vincolo")) {
      expect(tipoShowsBuyValue(tipo)).toBe(false);
      expect(tipoShowsPnl(tipo)).toBe(true);
    }
  });

  // The two are exclusive by construction: the form renders one field, and the
  // hook zeroes whichever is hidden. If both could be true the amount would be
  // double-counted into currentValue.
  test("the two are always exclusive", () => {
    for (const tipo of [...TIPO_OPTIONS, "something unknown"]) {
      expect(tipoShowsBuyValue(tipo)).toBe(!tipoShowsPnl(tipo));
    }
  });
});

describe("form defaults", () => {
  test("start on today with empty amounts", () => {
    const d = freshTxDefaults();
    expect(d.txDate).toBe(todayIso());
    expect(d.buyValue).toBe("");
    expect(d.pnl).toBe("");
    expect(d.tipo).toBe("nuovo vincolo");
  });

  test("todayIso is a local calendar date, not a UTC-shifted one", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(todayIso()).toBe(expected);
  });
});

describe("formatting", () => {
  test("renders euros and survives a non-finite value", () => {
    expect(formatCurrency(1234.5)).toContain("€");
    expect(formatCurrency(Number.NaN)).toBe(formatCurrency(0));
  });

  test("falls back to a dash on an unparseable date", () => {
    expect(formatTxDate("not-a-date")).toBe("—");
    expect(formatTxDate("2026-03-14")).not.toBe("—");
  });
});

describe("transactionSchema", () => {
  test("rejects a payload missing a required field", () => {
    expect(transactionSchema.safeParse({ id: "tx-1" }).success).toBe(false);
  });

  test("accepts a full row", () => {
    const row = {
      id: "tx-1",
      txDate: "2026-03-14",
      asset: "ETF-A",
      tipo: "cedola",
      derivedType: "return",
      buyValue: 0,
      pnl: 12.5,
      currentValue: 12.5,
      note: "",
      createdAt: "2026-03-14 10:00:00",
      updatedAt: "2026-03-14 10:00:00",
    };
    expect(transactionSchema.safeParse(row).success).toBe(true);
  });
});

describe("computeRiskTotals", () => {
  const tx = (asset: string, currentValue: number) => ({
    id: `tx-${asset}-${currentValue}`, txDate: "2026-01-01", asset, tipo: "nuovo vincolo",
    derivedType: "buy", buyValue: currentValue, pnl: 0, currentValue, note: "",
    createdAt: "", updatedAt: "",
  });
  const style = (riskLevel: string | null) => ({ colorHex: null, riskLevel });

  test("buckets each asset by its risk level", () => {
    const totals = computeRiskTotals(
      [tx("A", 100), tx("B", 50), tx("C", 25)],
      { A: style("low"), B: style("medium"), C: style("high") },
    );
    expect(totals).toEqual({ low: 100, medium: 50, high: 25 });
  });

  test("sums several transactions on the same asset", () => {
    const totals = computeRiskTotals([tx("A", 100), tx("A", 40)], { A: style("low") });
    expect(totals.low).toBe(140);
  });

  // An asset nobody classified must not be quietly counted as low risk — that
  // would overstate the safe share of the portfolio.
  test("ignores assets with no risk level, and unknown levels", () => {
    const totals = computeRiskTotals(
      [tx("A", 100), tx("B", 999), tx("C", 999)],
      { A: style("low"), B: style(null), C: style("extreme") },
    );
    expect(totals).toEqual({ low: 100, medium: 0, high: 0 });
  });

  test("ignores an asset missing from the styles map entirely", () => {
    expect(computeRiskTotals([tx("Ghost", 500)], {})).toEqual({ low: 0, medium: 0, high: 0 });
  });

  test("rounds to cents so floating point noise never reaches the database", () => {
    const totals = computeRiskTotals([tx("A", 0.1), tx("A", 0.2)], { A: style("low") });
    expect(totals.low).toBe(0.3);
  });

  test("keeps negative values, which a sold-off asset legitimately has", () => {
    const totals = computeRiskTotals([tx("A", 100), tx("A", -130)], { A: style("high") });
    expect(totals.high).toBe(-30);
  });

  test("returns zeros with no transactions", () => {
    expect(computeRiskTotals([], { A: style("low") })).toEqual({ low: 0, medium: 0, high: 0 });
  });
});

describe("movement and snapshot forms", () => {
  test("empty amount coerces to 0 on submit", () => {
    expect(movementFormSchema.parse({ name: "Rent", direction: "expense", amount: "", note: "" }).amount).toBe(0);
    expect(snapshotFormSchema.parse({ snapshotDate: "2026-01-31", liquid: "" }).liquid).toBe(0);
  });

  test("rejects an unknown direction and a negative amount", () => {
    expect(movementFormSchema.safeParse({ name: "X", direction: "sideways", amount: 1 }).success).toBe(false);
    expect(movementFormSchema.safeParse({ name: "X", direction: "income", amount: -1 }).success).toBe(false);
  });

  test("movement defaults start on income with an empty amount", () => {
    expect(freshMovementDefaults()).toEqual({ name: "", direction: "income", amount: "", note: "" });
  });

  test("snapshot defaults start on today", () => {
    expect(freshSnapshotDefaults().snapshotDate).toBe(todayIso());
  });
});
