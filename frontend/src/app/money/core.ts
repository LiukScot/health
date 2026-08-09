import { z } from "zod";
import { apiEnvelopeSchema } from "../../lib";

export const transactionSchema = z.object({
  id: z.string(),
  txDate: z.string(),
  asset: z.string(),
  tipo: z.string(),
  derivedType: z.string(),
  buyValue: z.number(),
  pnl: z.number(),
  currentValue: z.number(),
  note: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const transactionListSchema = apiEnvelopeSchema(z.array(transactionSchema));

export const TIPO_OPTIONS = [
  "nuovo vincolo",
  "cedola",
  "interessi",
  "cashback",
  "Variazione Valore",
] as const;

// "nuovo vincolo" is the only tipo that books money in; the others record a
// return or a revaluation, which lands in PnL. The form shows one field or
// the other accordingly, and the unused one is submitted as 0.
const TIPO_BUY_ONLY = new Set<string>(["nuovo vincolo"]);

export function tipoShowsBuyValue(tipo: string): boolean {
  return TIPO_BUY_ONLY.has(tipo);
}

export function tipoShowsPnl(tipo: string): boolean {
  return !tipoShowsBuyValue(tipo);
}

export const txFormSchema = z.object({
  txDate: z.string().min(1),
  asset: z.string().min(1),
  tipo: z.string().min(1),
  buyValue: z.coerce.number().finite(),
  pnl: z.coerce.number().finite(),
  note: z.string().default(""),
});

/**
 * The number fields accept "" so an untouched input shows its placeholder
 * instead of a literal 0; z.coerce.number turns "" into 0 on submit.
 */
export type TxFormValues = Omit<z.infer<typeof txFormSchema>, "buyValue" | "pnl"> & {
  buyValue: number | "";
  pnl: number | "";
};

export function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function freshTxDefaults(): TxFormValues {
  return { txDate: todayIso(), asset: "", tipo: "nuovo vincolo", buyValue: "", pnl: "", note: "" };
}

// Locale comes from the browser, the currency does not — the ledger is in
// euro regardless of where it is read.
const CURRENCY = new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" });
const SHORT_DATE = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });

export function formatCurrency(value: number): string {
  return CURRENCY.format(Number.isFinite(value) ? value : 0);
}

// txDate is a calendar day, not an instant. Date.parse reads a date-only
// string as UTC midnight, which formats as the day before for any reader
// behind UTC, so the parts are placed into a local date instead.
export function formatTxDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "—";
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return "—";
  return SHORT_DATE.format(date);
}

// ── Monthly movements ────────────────────────────────────────────────────

export const movementSchema = z.object({
  id: z.string(),
  name: z.string(),
  direction: z.string(),
  amount: z.number(),
  note: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Movement = z.infer<typeof movementSchema>;
export const movementListSchema = apiEnvelopeSchema(z.array(movementSchema));

export const DIRECTIONS = ["income", "expense"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const movementFormSchema = z.object({
  name: z.string().min(1),
  direction: z.enum(DIRECTIONS),
  amount: z.coerce.number().finite().nonnegative(),
  note: z.string().default(""),
});

export type MovementFormValues = Omit<z.infer<typeof movementFormSchema>, "amount"> & { amount: number | "" };

export function freshMovementDefaults(): MovementFormValues {
  return { name: "", direction: "income", amount: "", note: "" };
}

// ── Monthly snapshots ────────────────────────────────────────────────────

export const snapshotSchema = z.object({
  id: z.string(),
  snapshotDate: z.string(),
  lowRisk: z.number(),
  mediumRisk: z.number(),
  highRisk: z.number(),
  liquid: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Snapshot = z.infer<typeof snapshotSchema>;
export const snapshotListSchema = apiEnvelopeSchema(z.array(snapshotSchema));

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const stylesMapSchema = apiEnvelopeSchema(
  z.record(
    z.string(),
    z.object({ colorHex: z.string().nullable(), riskLevel: z.string().nullable() }),
  ),
);

export type StylesMap = z.infer<typeof stylesMapSchema>["data"];

export const snapshotFormSchema = z.object({
  snapshotDate: z.string().min(1),
  liquid: z.coerce.number().finite(),
});

export type SnapshotFormValues = Omit<z.infer<typeof snapshotFormSchema>, "liquid"> & { liquid: number | "" };

export function freshSnapshotDefaults(): SnapshotFormValues {
  return { snapshotDate: todayIso(), liquid: "" };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * A snapshot only asks for the date and the liquid amount: the three risk
 * buckets are derived from the current transactions. Each asset's current
 * value is summed, then attributed to the bucket its style says it belongs
 * to. Assets with no risk level set count towards none of them — they are
 * simply absent from the snapshot rather than silently folded into "low".
 */
export function computeRiskTotals(
  transactions: readonly Transaction[],
  styles: StylesMap,
): Record<RiskLevel, number> {
  const totals: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 };
  for (const stat of computePerAsset(transactions, styles)) {
    // computePerAsset already normalises an unknown level to null.
    if (stat.riskLevel) totals[stat.riskLevel] += stat.current;
  }
  return { low: round2(totals.low), medium: round2(totals.medium), high: round2(totals.high) };
}

// ── Dashboard ────────────────────────────────────────────────────────────

// Used when an asset has no colour of its own, so a chart still tells assets
// apart. Indexed by position, hence stable for a given asset ordering.
const FALLBACK_PALETTE = ["#5de2a5", "#7fc3ff", "#ffd57f", "#ff8da1", "#c6a3ff", "#9bd8ff"] as const;
export const DEFAULT_ASSET_COLOR = FALLBACK_PALETTE[0];

export function assetColor(asset: string, index: number, styles: StylesMap): string {
  const chosen = styles[asset]?.colorHex;
  if (chosen && /^#[0-9a-fA-F]{6}$/.test(chosen)) return chosen;
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length] ?? DEFAULT_ASSET_COLOR;
}

export type AssetStats = {
  asset: string;
  buyTotal: number;
  pnl: number;
  current: number;
  allocationPct: number;
  pnlPct: number;
  color: string;
  riskLevel: RiskLevel | null;
};

/** Folds the transaction log into one row per asset. */
export function computePerAsset(transactions: readonly Transaction[], styles: StylesMap): AssetStats[] {
  const totals = new Map<string, { buy: number; pnl: number; current: number }>();
  for (const row of transactions) {
    const entry = totals.get(row.asset) ?? { buy: 0, pnl: 0, current: 0 };
    entry.buy += row.buyValue;
    entry.pnl += row.pnl;
    entry.current += row.currentValue;
    totals.set(row.asset, entry);
  }

  const totalCurrent = Array.from(totals.values()).reduce((sum, v) => sum + v.current, 0);

  return Array.from(totals.entries()).map(([asset, stats], index) => {
    const rawRisk = styles[asset]?.riskLevel;
    return {
      asset,
      buyTotal: stats.buy,
      pnl: stats.pnl,
      current: stats.current,
      allocationPct: totalCurrent > 0 ? (stats.current / totalCurrent) * 100 : 0,
      pnlPct: stats.buy > 0 ? (stats.pnl / stats.buy) * 100 : 0,
      color: assetColor(asset, index, styles),
      riskLevel: (RISK_LEVELS as readonly string[]).includes(rawRisk ?? "") ? (rawRisk as RiskLevel) : null,
    };
  });
}

// Rounding noise means a fully sold-off asset lands near zero rather than on
// it, so "zero" is a threshold, not an equality.
const NEAR_ZERO = 0.0001;

export function filterVisibleAssets(stats: readonly AssetStats[], showZero: boolean): AssetStats[] {
  return showZero ? [...stats] : stats.filter((s) => Math.abs(s.current) > NEAR_ZERO);
}

/** The API returns transactions newest first, so the head is the latest. */
export function findLastTxDate(transactions: readonly Transaction[]): string | null {
  return transactions[0]?.txDate ?? null;
}

export type DashboardKpis = {
  totalCurrent: number;
  totalPnl: number;
  assetsCount: number;
  txCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  lastTxDate: string | null;
};

export function computeKpis(
  transactions: readonly Transaction[],
  movements: readonly Movement[],
): DashboardKpis {
  let income = 0;
  let expense = 0;
  for (const row of movements) {
    if (row.direction === "income") income += row.amount;
    else expense += row.amount;
  }
  return {
    totalCurrent: transactions.reduce((sum, row) => sum + row.currentValue, 0),
    totalPnl: transactions.reduce((sum, row) => sum + row.pnl, 0),
    assetsCount: new Set(transactions.map((row) => row.asset)).size,
    txCount: transactions.length,
    monthlyIncome: income,
    monthlyExpense: expense,
    monthlyNet: income - expense,
    lastTxDate: findLastTxDate(transactions),
  };
}
