import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "./db.ts";
import { BUILTIN_METRIC_TYPES } from "./schema.ts";

type MetricRow = {
  key: string;
  kind: string;
  unit: string | null;
  min_value: number | null;
  max_value: number | null;
};
type CountRow = { c: number };

function freshDb(): Database {
  const db = new Database(":memory:");
  db.query("PRAGMA foreign_keys = ON").run();
  runMigrations(db); // creates tables; 0 users => nothing seeded yet
  return db;
}

function addUser(db: Database, email: string): void {
  db.query("INSERT INTO users (email, password_hash) VALUES (?, 'x')").run(email);
}

function metricRows(db: Database, userId: number): MetricRow[] {
  return db
    .query("SELECT key, kind, unit, min_value, max_value FROM metric_types WHERE user_id = ? ORDER BY id")
    .all(userId) as MetricRow[];
}

describe("metric_types seed", () => {
  test("seeds every built-in type for a user, with correct kind/range", () => {
    const db = freshDb();
    addUser(db, "a@example.com");
    runMigrations(db); // idempotent re-run seeds the now-existing user

    const rows = metricRows(db, 1);
    expect(rows.length).toBe(BUILTIN_METRIC_TYPES.length);

    const byKey = new Map(rows.map((r) => [r.key, r]));
    expect(byKey.get("mood")).toMatchObject({ kind: "scale", min_value: 1, max_value: 9 });
    expect(byKey.get("coffee")).toMatchObject({ kind: "counter", min_value: 0 });
    expect(byKey.get("positive_moods")?.kind).toBe("tags");
    expect(byKey.get("description")?.kind).toBe("text");
    expect(byKey.get("measurement")?.kind).toBe("measure");
    expect(byKey.get("cbt_situation")?.kind).toBe("text");
  });

  test("is idempotent — re-running migrations adds no duplicates", () => {
    const db = freshDb();
    addUser(db, "a@example.com");
    runMigrations(db);
    runMigrations(db);
    runMigrations(db);

    const count = db.query("SELECT count(*) AS c FROM metric_types WHERE user_id = 1").get() as CountRow;
    expect(count.c).toBe(BUILTIN_METRIC_TYPES.length);
  });

  test("seeds each user independently", () => {
    const db = freshDb();
    addUser(db, "a@example.com");
    addUser(db, "b@example.com");
    runMigrations(db);

    expect(metricRows(db, 1).length).toBe(BUILTIN_METRIC_TYPES.length);
    expect(metricRows(db, 2).length).toBe(BUILTIN_METRIC_TYPES.length);
  });

  test("built-in keys are unique", () => {
    const keys = BUILTIN_METRIC_TYPES.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
