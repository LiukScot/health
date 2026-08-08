import { describe, expect, test } from "bun:test";
import authRoute from "./auth.ts";
import backupRoute from "./money-backup.ts";
import preferencesRoute from "./preferences.ts";
import transactionsRoute from "./money-transactions.ts";
import stylesRoute from "./money-styles.ts";
import { setupAuthedApp } from "../test-helpers.ts";

async function setup() {
  return setupAuthedApp([
    { path: "/auth", route: authRoute },
    { path: "/money/backup", route: backupRoute },
    { path: "/money/data", route: backupRoute },
    { path: "/money/transactions", route: transactionsRoute },
    { path: "/money/assets/styles", route: stylesRoute },
    { path: "/preferences", route: preferencesRoute },
  ]);
}

type App = Awaited<ReturnType<typeof setup>>["app"];

function seedTx(app: App, cookie: string, asset: string) {
  return app.request("/money/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ txDate: "2026-02-01", asset, tipo: "nuovo vincolo", buyValue: 500, pnl: 10 }),
  });
}

function importJson(app: App, cookie: string, payload: object) {
  return app.request("/money/backup/json/import", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify(payload),
  });
}

describe("money backup auth", () => {
  test("export, import and purge all require authentication", async () => {
    const { app } = await setup();
    expect((await app.request("/money/backup/json")).status).toBe(401);
    expect((await app.request("/money/backup/json/import", { method: "POST" })).status).toBe(401);
    expect((await app.request("/money/data/purge", { method: "POST" })).status).toBe(401);
  });
});

describe("money JSON backup", () => {
  test("exports what was created", async () => {
    const { app, cookie } = await setup();
    await seedTx(app, cookie, "ETF-A");
    const body = await (await app.request("/money/backup/json", { headers: { cookie } })).json();
    expect(body.data.transactions).toHaveLength(1);
    expect(body.data.transactions[0]).toMatchObject({ asset: "ETF-A", date: "2026-02-01", buyValue: 500 });
  });

  test("round-trips an export back through import", async () => {
    const { app, cookie } = await setup();
    await seedTx(app, cookie, "ETF-A");
    const exported = (await (await app.request("/money/backup/json", { headers: { cookie } })).json()).data;

    expect((await importJson(app, cookie, exported)).status).toBe(200);

    const list = await (await app.request("/money/transactions", { headers: { cookie } })).json();
    expect(list.data).toHaveLength(1);
    expect(list.data[0]).toMatchObject({ asset: "ETF-A", buyValue: 500, pnl: 10 });
  });

  test("import replaces what was there instead of appending", async () => {
    const { app, cookie } = await setup();
    await seedTx(app, cookie, "Old-A");
    await importJson(app, cookie, {
      transactions: [{ id: "tx-new", date: "2026-03-03", asset: "New-B", tipo: "cedola", pnl: 5 }],
    });

    const list = await (await app.request("/money/transactions", { headers: { cookie } })).json();
    expect(list.data).toHaveLength(1);
    expect(list.data[0].asset).toBe("New-B");
  });

  test("skips rows with an unusable date or direction", async () => {
    const { app, cookie } = await setup();
    const res = await importJson(app, cookie, {
      transactions: [
        { id: "tx-ok", date: "2026-03-03", asset: "Good", tipo: "cedola", pnl: 1 },
        { id: "tx-bad", date: "2026-02-30", asset: "Bad", tipo: "cedola", pnl: 1 },
      ],
      monthlyMovements: [{ id: "mm-bad", name: "Weird", direction: "sideways", amount: 1 }],
    });
    expect(res.status).toBe(200);

    const list = await (await app.request("/money/transactions", { headers: { cookie } })).json();
    expect(list.data.map((t: { asset: string }) => t.asset)).toEqual(["Good"]);
  });

  test("infers the derived type when the backup omits it", async () => {
    const { app, cookie } = await setup();
    await importJson(app, cookie, {
      transactions: [{ id: "tx-1", date: "2026-03-03", asset: "A", tipo: "cedola", pnl: 8 }],
    });
    const list = await (await app.request("/money/transactions", { headers: { cookie } })).json();
    expect(list.data[0].derivedType).toBe("return");
    expect(list.data[0].currentValue).toBe(8);
  });

  test("restores asset styles and the showZeroAssets preference", async () => {
    const { app, cookie } = await setup();
    await importJson(app, cookie, {
      assetColors: { "ETF-A": "#34d399" },
      assetRisks: { "ETF-A": "low" },
      preferences: { showZeroAssets: true },
    });
    const styles = await (await app.request("/money/assets/styles", { headers: { cookie } })).json();
    expect(styles.data["ETF-A"]).toEqual({ colorHex: "#34d399", riskLevel: "low" });
  });
});

describe("money XLSX backup", () => {
  test("exports a workbook that imports back cleanly", async () => {
    const { app, cookie } = await setup();
    await seedTx(app, cookie, "ETF-A");

    const res = await app.request("/money/backup/xlsx", { headers: { cookie } });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain("money-");
    const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");

    const imported = await app.request("/money/backup/xlsx/import", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ base64 }),
    });
    expect(imported.status).toBe(200);
    const body = await imported.json();
    expect(body.data.imported.transactions).toBe(1);

    const list = await (await app.request("/money/transactions", { headers: { cookie } })).json();
    expect(list.data).toHaveLength(1);
    expect(list.data[0].asset).toBe("ETF-A");
  });

  test("rejects a file that is not a zip", async () => {
    const { app, cookie } = await setup();
    const res = await app.request("/money/backup/xlsx/import", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ base64: Buffer.from("not a spreadsheet").toString("base64") }),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_FILE");
  });

  test("rejects a body with neither a file nor base64", async () => {
    const { app, cookie } = await setup();
    const res = await app.request("/money/backup/xlsx/import", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("MISSING_FILE");
  });
});

describe("money purge", () => {
  test("clears money data", async () => {
    const { app, cookie } = await setup();
    await seedTx(app, cookie, "ETF-A");
    expect((await app.request("/money/data/purge", { method: "POST", headers: { cookie } })).status).toBe(200);
    const list = await (await app.request("/money/transactions", { headers: { cookie } })).json();
    expect(list.data).toHaveLength(0);
  });

  // user_preferences is one row shared with the health realm. Purging money
  // has to reset its own column, not delete the row out from under health.
  test("leaves the health preferences intact", async () => {
    const { app, cookie } = await setup();
    await app.request("/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({
        model: "custom-model",
        chatRange: "30d",
        lastRange: "7d",
        graphSelection: { mood: true },
        birthday: "1990-06-15",
      }),
    });

    await app.request("/money/data/purge", { method: "POST", headers: { cookie } });

    const prefs = await (await app.request("/preferences", { headers: { cookie } })).json();
    expect(prefs.data).toMatchObject({ model: "custom-model", birthday: "1990-06-15" });
    expect(prefs.data.graphSelection).toEqual({ mood: true });
  });

  test("a JSON import also leaves the health preferences intact", async () => {
    const { app, cookie } = await setup();
    await app.request("/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ model: "m", chatRange: "all", lastRange: "all", graphSelection: {}, birthday: "1985-01-02" }),
    });

    await importJson(app, cookie, { preferences: { showZeroAssets: true } });

    const prefs = await (await app.request("/preferences", { headers: { cookie } })).json();
    expect(prefs.data.birthday).toBe("1985-01-02");
  });
});
