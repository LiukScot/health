import { desc, eq, sql } from "drizzle-orm";
import type { DrizzleDB } from "./db/index.ts";
import { assetStyles, monthlyMovements, monthlySnapshots, transactions, userPreferences } from "./db/index.ts";
import { inferType, makeId } from "./money-helpers.ts";

/**
 * Export/import/wipe for the Money realm, ported from the standalone money
 * app. The backup payload keeps that app's field names (`date`, `type`,
 * `low`/`medium`/`high`) so files exported before the merge still import.
 */

export type ImportPayload = {
  transactions: Record<string, unknown>[];
  monthlyMovements: Record<string, unknown>[];
  monthlySnapshots: Record<string, unknown>[];
  assetColors: Record<string, string>;
  assetRisks: Record<string, string>;
  preferences: { showZeroAssets: boolean };
  replaceStyles: boolean;
  replacePrefs: boolean;
};

export function buildBackupPayload(db: DrizzleDB, userId: number) {
  const txRows = db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.txDate), desc(transactions.id))
    .all();
  const movementRows = db
    .select()
    .from(monthlyMovements)
    .where(eq(monthlyMovements.userId, userId))
    .orderBy(monthlyMovements.name, desc(monthlyMovements.id))
    .all();
  const snapshotRows = db
    .select()
    .from(monthlySnapshots)
    .where(eq(monthlySnapshots.userId, userId))
    .orderBy(desc(monthlySnapshots.snapshotDate), desc(monthlySnapshots.id))
    .all();
  const styleRows = db
    .select({ asset: assetStyles.asset, colorHex: assetStyles.colorHex, riskLevel: assetStyles.riskLevel })
    .from(assetStyles)
    .where(eq(assetStyles.userId, userId))
    .all();
  const prefRow = db
    .select({ showZeroAssets: userPreferences.showZeroAssets })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1)
    .get();

  const assetColors: Record<string, string> = {};
  const assetRisks: Record<string, string> = {};
  for (const row of styleRows) {
    if (row.colorHex) assetColors[row.asset] = String(row.colorHex);
    if (row.riskLevel) assetRisks[row.asset] = String(row.riskLevel);
  }

  return {
    transactions: txRows.map((row) => ({
      id: row.id,
      date: row.txDate,
      asset: row.asset,
      tipo: row.tipo,
      type: row.derivedType,
      buyValue: Number(row.buyValue),
      pnl: Number(row.pnl),
      currentValue: Number(row.currentValue),
      note: row.note ?? "",
    })),
    monthlyMovements: movementRows.map((row) => ({
      id: row.id,
      name: row.name,
      direction: row.direction,
      amount: Number(row.amount),
      cadence: row.cadence,
      note: row.note ?? "",
    })),
    monthlySnapshots: snapshotRows.map((row) => ({
      id: row.id,
      date: row.snapshotDate,
      low: Number(row.lowRisk),
      medium: Number(row.mediumRisk),
      high: Number(row.highRisk),
      liquid: Number(row.liquid),
    })),
    assetColors,
    assetRisks,
    preferences: { showZeroAssets: Boolean(prefRow?.showZeroAssets ?? 0) },
  };
}

/**
 * Deletes this user's money rows. Preferences are *reset*, never deleted:
 * user_preferences is one row shared with the health realm, so dropping it
 * would take the graph selection with it.
 */
export function wipeMoneyData(db: DrizzleDB, userId: number, includeStyles: boolean, includePrefs: boolean): void {
  db.delete(transactions).where(eq(transactions.userId, userId)).run();
  db.delete(monthlyMovements).where(eq(monthlyMovements.userId, userId)).run();
  db.delete(monthlySnapshots).where(eq(monthlySnapshots.userId, userId)).run();
  if (includeStyles) db.delete(assetStyles).where(eq(assetStyles.userId, userId)).run();
  if (includePrefs) {
    db.update(userPreferences)
      .set({ showZeroAssets: 0, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(userPreferences.userId, userId))
      .run();
  }
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toIsoDateOrNull(v: unknown): string | null {
  const s = String(v ?? "").slice(0, 10);
  // Round-trip through Date to reject invalid calendar dates (e.g. "2023-02-30").
  if (!ISO_DATE_RE.test(s)) return null;
  const d = new Date(s);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : null;
}

function toFiniteNumber(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export type ImportCounts = { transactions: number; monthlyMovements: number; monthlySnapshots: number };

// Row ids are minted here rather than carried over from the backup file. These
// three tables key on `id` alone, so an id belonging to another user collided,
// and onConflictDoNothing then dropped the row with nothing but a console
// warning. Both callers wipe the user's own rows first, so no id is reused and
// nothing downstream depends on the ids the file happened to carry.
export function applyImport(db: DrizzleDB, userId: number, payload: ImportPayload): ImportCounts {
  const txRows = payload.transactions
    .map((row) => {
      const txDate = toIsoDateOrNull(row.date ?? row.txDate);
      if (!txDate) return null;
      const buyValue = toFiniteNumber(row.buyValue, 0);
      const pnl = toFiniteNumber(row.pnl, 0);
      const tipo = String(row.tipo ?? "").slice(0, 60);
      return {
        id: makeId("tx"),
        userId,
        txDate,
        asset: String(row.asset ?? "").slice(0, 120),
        tipo,
        derivedType: String(row.derivedType ?? row.type ?? inferType(tipo, buyValue, pnl)).slice(0, 40),
        buyValue,
        pnl,
        currentValue: toFiniteNumber(row.currentValue, buyValue + pnl),
        note: String(row.note ?? "").slice(0, 2000),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (txRows.length > 0) db.insert(transactions).values(txRows).run();

  const validDirections = new Set(["income", "expense"]);
  const movementRows = payload.monthlyMovements
    .map((row) => {
      const direction = String(row.direction ?? "");
      // Unknown directions are dropped rather than silently reclassified.
      if (!validDirections.has(direction)) return null;
      return {
        id: makeId("mm"),
        userId,
        name: String(row.name ?? "").slice(0, 120),
        direction,
        amount: Math.abs(toFiniteNumber(row.amount, 0)),
        // Backups taken before cadence existed carry monthly rows only.
        cadence: String(row.cadence ?? "") === "annual" ? "annual" : "monthly",
        note: String(row.note ?? "").slice(0, 2000),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (movementRows.length > 0) db.insert(monthlyMovements).values(movementRows).run();

  const snapshotRows = payload.monthlySnapshots
    .map((row) => {
      const snapshotDate = toIsoDateOrNull(row.date ?? row.snapshotDate);
      if (!snapshotDate) return null;
      return {
        id: makeId("snap"),
        userId,
        snapshotDate,
        lowRisk: toFiniteNumber(row.low ?? row.lowRisk, 0),
        mediumRisk: toFiniteNumber(row.medium ?? row.mediumRisk, 0),
        highRisk: toFiniteNumber(row.high ?? row.highRisk, 0),
        liquid: toFiniteNumber(row.liquid, 0),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (snapshotRows.length > 0) db.insert(monthlySnapshots).values(snapshotRows).run();

  if (payload.replaceStyles) {
    const assets = new Set<string>([...Object.keys(payload.assetColors), ...Object.keys(payload.assetRisks)]);
    const styleRows = Array.from(assets)
      .filter((asset) => asset.length >= 1 && asset.length <= 120)
      .map((asset) => ({
        userId,
        asset,
        colorHex: payload.assetColors[asset] ?? null,
        riskLevel: payload.assetRisks[asset] ?? null,
      }));
    if (styleRows.length > 0) {
      db.insert(assetStyles).values(styleRows).run();
    }
  }

  if (payload.replacePrefs) {
    const showZeroAssets = payload.preferences.showZeroAssets ? 1 : 0;
    db.insert(userPreferences)
      .values({ userId, showZeroAssets })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { showZeroAssets: sql`excluded.show_zero_assets`, updatedAt: sql`CURRENT_TIMESTAMP` },
      })
      .run();
  }

  return {
    transactions: txRows.length,
    monthlyMovements: movementRows.length,
    monthlySnapshots: snapshotRows.length,
  };
}

/** Accepts the booleans spreadsheets and older backups produce: 1, "1", "true". */
export function coerceBoolean(raw: unknown): boolean {
  if (raw === true || raw === 1) return true;
  const s = String(raw ?? "").trim().toLowerCase();
  return s === "true" || s === "1";
}
