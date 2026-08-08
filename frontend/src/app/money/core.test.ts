import { describe, expect, test } from "vitest";
import {
  formatCurrency,
  formatTxDate,
  freshTxDefaults,
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
