import path from "node:path";
import fs from "node:fs";
import { Database } from "bun:sqlite";
import { openDb, runMigrations } from "./db.ts";

/**
 * One-shot import of the standalone money app's database into World.
 *
 * Money's rows are copied verbatim except for `user_id`, which is remapped
 * onto the World user with the same email address. Re-running is safe: every
 * copied table is keyed (transactions/movements/snapshots by their text id,
 * asset_styles by the unique user+asset index) so INSERT OR IGNORE turns a
 * second run into a no-op instead of a duplicate.
 */

type Args = {
  source: string;
  target: string;
  email: string;
  dryRun: boolean;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (key: string, fallback: string) => {
    const pref = `--${key}=`;
    const hit = args.find((a) => a.startsWith(pref));
    return hit ? hit.slice(pref.length) : fallback;
  };
  const source = get("source", path.resolve(process.cwd(), "../data/mymoney.sqlite"));
  const target = get("target", process.env.DB_PATH || path.resolve(process.cwd(), "../data/world.sqlite"));
  const email = get("email", process.env.MIGRATION_PRIMARY_EMAIL || "").trim().toLowerCase();
  if (!email) {
    throw new Error("Missing account email. Use --email=... or MIGRATION_PRIMARY_EMAIL.");
  }
  if (!fs.existsSync(source)) {
    throw new Error(`Source database not found: ${source}`);
  }
  return { source, target, email, dryRun: args.includes("--dry-run") };
}

type SourceRow = Record<string, unknown>;

function resolveUserId(db: Database, email: string, label: string): number {
  const row = db
    .query(`SELECT id FROM users WHERE lower(email) = ? LIMIT 1`)
    .get(email) as { id?: number } | null;
  if (!row?.id) {
    throw new Error(`No ${label} account found for ${email}.`);
  }
  return row.id;
}

const COPIES = [
  {
    table: "transactions",
    columns: ["id", "tx_date", "asset", "tipo", "derived_type", "buy_value", "pnl", "current_value", "note", "created_at", "updated_at"],
  },
  {
    table: "monthly_movements",
    columns: ["id", "name", "direction", "amount", "note", "created_at", "updated_at"],
  },
  {
    table: "monthly_snapshots",
    columns: ["id", "snapshot_date", "low_risk", "medium_risk", "high_risk", "liquid", "created_at", "updated_at"],
  },
  {
    table: "asset_styles",
    columns: ["asset", "color_hex", "risk_level", "updated_at"],
  },
] as const;

/**
 * Copies one account's money data across. Caller owns the transaction, which
 * is what lets --dry-run reuse this and roll back. Returns rows read per
 * table — note that INSERT OR IGNORE means a re-run reports the same numbers
 * while writing nothing.
 */
export function copyMoneyData(source: Database, target: Database, email: string): Record<string, number> {
  const sourceUserId = resolveUserId(source, email, "money");
  const targetUserId = resolveUserId(target, email, "World");
  const counts: Record<string, number> = {};

  for (const { table, columns } of COPIES) {
    const rows = source
      .query(`SELECT ${columns.join(", ")} FROM ${table} WHERE user_id = ?`)
      .all(sourceUserId) as SourceRow[];

    const insert = target.query(
      `INSERT OR IGNORE INTO ${table} (user_id, ${columns.join(", ")})
       VALUES (?, ${columns.map(() => "?").join(", ")})`
    );
    for (const row of rows) {
      insert.run(targetUserId, ...columns.map((col) => row[col] as never));
    }
    counts[table] = rows.length;
  }

  // show_zero_assets lived in money's own user_preferences table; in World it
  // is one column of the preferences row shared with the health realm, so it
  // is upserted on its own instead of being copied with the row.
  const prefs = source
    .query(`SELECT show_zero_assets FROM user_preferences WHERE user_id = ? LIMIT 1`)
    .get(sourceUserId) as { show_zero_assets?: number } | null;
  if (prefs) {
    target
      .query(
        `INSERT INTO user_preferences (user_id, show_zero_assets) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET show_zero_assets = excluded.show_zero_assets`
      )
      .run(targetUserId, prefs.show_zero_assets ?? 0);
    counts.user_preferences = 1;
  }

  return counts;
}

function main(): void {
  const cfg = parseArgs();

  const source = new Database(cfg.source, { readonly: true });
  const target = openDb(cfg.target);
  runMigrations(target);

  let counts: Record<string, number> = {};
  if (cfg.dryRun) {
    // Real work inside a transaction we never commit: the counts are
    // accurate, the target database is left untouched.
    try {
      target.exec("BEGIN");
      counts = copyMoneyData(source, target, cfg.email);
    } finally {
      target.exec("ROLLBACK");
    }
  } else {
    target.transaction(() => {
      counts = copyMoneyData(source, target, cfg.email);
    })();
  }

  source.close();
  target.close();

  const verb = cfg.dryRun ? "Would import" : "Imported";
  for (const [table, count] of Object.entries(counts)) {
    console.log(`${verb} ${count} row(s) into ${table}`);
  }
  console.log(
    cfg.dryRun
      ? `Dry run only — ${cfg.target} was not modified.`
      : `Money data imported into ${cfg.target} for ${cfg.email}.`
  );
}

if (import.meta.main) {
  main();
}
