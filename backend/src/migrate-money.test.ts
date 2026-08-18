import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { copyMoneyData } from "./migrate-money.ts";
import { createTestDb, seedUser } from "./test-helpers.ts";

const EMAIL = "owner@example.com";

// The standalone money app's schema, as it exists in the database being
// migrated from. Deliberately hand-written rather than imported: this is the
// shape of the *old* app, and it must not drift when World's schema changes.
function createMoneyDb(): Database {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, name TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP, disabled_at TEXT);
    CREATE TABLE transactions (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, tx_date TEXT NOT NULL,
      asset TEXT NOT NULL, tipo TEXT NOT NULL, derived_type TEXT NOT NULL, buy_value REAL DEFAULT 0,
      pnl REAL DEFAULT 0, current_value REAL DEFAULT 0, note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE monthly_movements (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT NOT NULL,
      direction TEXT NOT NULL, amount REAL DEFAULT 0, note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE monthly_snapshots (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, snapshot_date TEXT NOT NULL,
      low_risk REAL DEFAULT 0, medium_risk REAL DEFAULT 0, high_risk REAL DEFAULT 0, liquid REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE asset_styles (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      asset TEXT NOT NULL, color_hex TEXT, risk_level TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE user_preferences (user_id INTEGER PRIMARY KEY, show_zero_assets INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
  `);
  return db;
}

/** Seeds one money account. `userId` is deliberately not 1, so a migration
 *  that forgot to remap user_id would land on the wrong row and be caught. */
function seedMoney(db: Database, email = EMAIL, userId = 42): number {
  db.query(`INSERT INTO users (id, email, password_hash) VALUES (?, ?, 'x')`).run(userId, email);
  db.query(
    `INSERT INTO transactions (id, user_id, tx_date, asset, tipo, derived_type, buy_value, pnl, current_value, note)
     VALUES ('tx-1', ?, '2026-01-10', 'ETF-A', 'nuovo vincolo', 'buy', 1000, 25, 1025, 'note')`
  ).run(userId);
  db.query(
    `INSERT INTO monthly_movements (id, user_id, name, direction, amount) VALUES ('mm-1', ?, 'Rent', 'expense', 850)`
  ).run(userId);
  db.query(
    `INSERT INTO monthly_snapshots (id, user_id, snapshot_date, low_risk, medium_risk, high_risk, liquid)
     VALUES ('snap-1', ?, '2026-01-31', 1, 2, 3, 4)`
  ).run(userId);
  db.query(
    `INSERT INTO asset_styles (user_id, asset, color_hex, risk_level) VALUES (?, 'ETF-A', '#34d399', 'low')`
  ).run(userId);
  db.query(`INSERT INTO user_preferences (user_id, show_zero_assets) VALUES (?, 1)`).run(userId);
  return userId;
}

async function setupTarget(email = EMAIL) {
  const ctx = createTestDb();
  const user = await seedUser(ctx.db, { email });
  return { rawDb: ctx.rawDb, userId: user.id };
}

describe("copyMoneyData", () => {
  test("copies every table onto the matching World account", async () => {
    const source = createMoneyDb();
    seedMoney(source);
    const { rawDb, userId } = await setupTarget();

    const counts = copyMoneyData(source, rawDb, EMAIL);
    expect(counts).toMatchObject({
      transactions: 1,
      monthly_movements: 1,
      monthly_snapshots: 1,
      asset_styles: 1,
      user_preferences: 1,
    });

    const tx = rawDb.query(`SELECT * FROM transactions`).get() as Record<string, unknown>;
    expect(tx).toMatchObject({ id: "tx-1", user_id: userId, asset: "ETF-A", buy_value: 1000, current_value: 1025 });

    const style = rawDb.query(`SELECT * FROM asset_styles`).get() as Record<string, unknown>;
    expect(style).toMatchObject({ user_id: userId, asset: "ETF-A", color_hex: "#34d399", risk_level: "low" });

    const prefs = rawDb.query(`SELECT show_zero_assets FROM user_preferences`).get() as { show_zero_assets: number };
    expect(prefs.show_zero_assets).toBe(1);
  });

  test("is idempotent — a second run adds nothing", async () => {
    const source = createMoneyDb();
    seedMoney(source);
    const { rawDb } = await setupTarget();

    copyMoneyData(source, rawDb, EMAIL);
    copyMoneyData(source, rawDb, EMAIL);

    for (const table of ["transactions", "monthly_movements", "monthly_snapshots", "asset_styles"]) {
      const row = rawDb.query(`SELECT count(*) AS c FROM ${table}`).get() as { c: number };
      expect(row.c).toBe(1);
    }
  });

  test("leaves the health side of user_preferences alone", async () => {
    const source = createMoneyDb();
    seedMoney(source);
    const { rawDb, userId } = await setupTarget();
    rawDb
      .query(`INSERT INTO user_preferences (user_id, chat_range, model) VALUES (?, '30d', 'custom')`)
      .run(userId);

    copyMoneyData(source, rawDb, EMAIL);

    const row = rawDb.query(`SELECT chat_range, model, show_zero_assets FROM user_preferences`).get() as {
      chat_range: string;
      model: string;
      show_zero_assets: number;
    };
    expect(row).toMatchObject({ chat_range: "30d", model: "custom", show_zero_assets: 1 });
  });

  test("refuses to run when the email is missing on either side", async () => {
    const source = createMoneyDb();
    seedMoney(source, "someone-else@example.com");
    const { rawDb } = await setupTarget();
    expect(() => copyMoneyData(source, rawDb, EMAIL)).toThrow(/No money account/);

    const source2 = createMoneyDb();
    seedMoney(source2);
    const ctx = createTestDb();
    expect(() => copyMoneyData(source2, ctx.rawDb, EMAIL)).toThrow(/No World account/);
  });

  test("does not touch another World user's rows", async () => {
    const source = createMoneyDb();
    seedMoney(source);
    const ctx = createTestDb();
    const owner = await seedUser(ctx.db, { email: EMAIL });
    const bystander = await seedUser(ctx.db, { email: "bystander@example.com" });

    copyMoneyData(source, ctx.rawDb, EMAIL);

    const mine = ctx.rawDb.query(`SELECT count(*) AS c FROM transactions WHERE user_id = ?`).get(owner.id) as { c: number };
    const theirs = ctx.rawDb.query(`SELECT count(*) AS c FROM transactions WHERE user_id = ?`).get(bystander.id) as { c: number };
    expect(mine.c).toBe(1);
    expect(theirs.c).toBe(0);
  });
});
