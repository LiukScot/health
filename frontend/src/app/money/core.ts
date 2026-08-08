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

export function formatTxDate(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  return SHORT_DATE.format(new Date(ms));
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
  const currentByAsset = new Map<string, number>();
  for (const row of transactions) {
    currentByAsset.set(row.asset, (currentByAsset.get(row.asset) ?? 0) + row.currentValue);
  }

  const totals: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 };
  for (const [asset, current] of currentByAsset) {
    const level = styles[asset]?.riskLevel;
    if (level && (RISK_LEVELS as readonly string[]).includes(level)) {
      totals[level as RiskLevel] += current;
    }
  }

  return { low: round2(totals.low), medium: round2(totals.medium), high: round2(totals.high) };
}
