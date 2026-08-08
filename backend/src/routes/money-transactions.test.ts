import { describe, expect, test } from "bun:test";
import authRoute from "./auth.ts";
import transactionsRoute from "./money-transactions.ts";
import { seedUser, setupAuthedApp } from "../test-helpers.ts";

const VALID = {
  txDate: "2026-03-14",
  asset: "ETF-World",
  tipo: "nuovo vincolo",
  buyValue: 1000,
  pnl: 50,
  note: "first buy",
};

async function setup() {
  const s = await setupAuthedApp([
    { path: "/auth", route: authRoute },
    { path: "/transactions", route: transactionsRoute },
  ]);
  return { ctx: s.ctx, app: s.app, cookie: s.cookie, user: s.user };
}

async function create(app: Awaited<ReturnType<typeof setup>>["app"], cookie: string, body: object = VALID) {
  const res = await app.request("/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify(body),
  });
  return { res, body: res.status === 201 ? await res.json() : null };
}

describe("money transactions auth", () => {
  test("every method requires authentication", async () => {
    const { app } = await setup();
    expect((await app.request("/transactions")).status).toBe(401);
    expect((await app.request("/transactions", { method: "POST" })).status).toBe(401);
    expect((await app.request("/transactions/tx-1", { method: "PUT" })).status).toBe(401);
    expect((await app.request("/transactions/tx-1", { method: "DELETE" })).status).toBe(401);
  });
});

describe("money transactions CRUD", () => {
  test("creates and lists a transaction", async () => {
    const { app, cookie } = await setup();
    const created = await create(app, cookie);
    expect(created.res.status).toBe(201);
    expect(created.body.data.id).toStartWith("tx-");

    const list = await (await app.request("/transactions", { headers: { cookie } })).json();
    expect(list.data).toHaveLength(1);
    expect(list.data[0]).toMatchObject({
      txDate: "2026-03-14",
      asset: "ETF-World",
      buyValue: 1000,
      pnl: 50,
      note: "first buy",
    });
  });

  test("derives type and current value when the client omits them", async () => {
    const { app, cookie } = await setup();
    await create(app, cookie);
    const list = await (await app.request("/transactions", { headers: { cookie } })).json();
    // tipo "nuovo vincolo" with a non-negative buyValue means a buy, and the
    // current value defaults to buyValue + pnl.
    expect(list.data[0].derivedType).toBe("buy");
    expect(list.data[0].currentValue).toBe(1050);
  });

  test("keeps a client-supplied derived type and current value", async () => {
    const { app, cookie } = await setup();
    await create(app, cookie, { ...VALID, derivedType: "sell", currentValue: 7 });
    const list = await (await app.request("/transactions", { headers: { cookie } })).json();
    expect(list.data[0].derivedType).toBe("sell");
    expect(list.data[0].currentValue).toBe(7);
  });

  test("updates an existing transaction", async () => {
    const { app, cookie } = await setup();
    const created = await create(app, cookie);
    const res = await app.request(`/transactions/${created.body.data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ ...VALID, asset: "Bond-A", buyValue: 200, pnl: -10 }),
    });
    expect(res.status).toBe(200);
    const list = await (await app.request("/transactions", { headers: { cookie } })).json();
    expect(list.data[0].asset).toBe("Bond-A");
    expect(list.data[0].currentValue).toBe(190);
  });

  test("deletes a transaction", async () => {
    const { app, cookie } = await setup();
    const created = await create(app, cookie);
    const res = await app.request(`/transactions/${created.body.data.id}`, {
      method: "DELETE",
      headers: { cookie },
    });
    expect(res.status).toBe(200);
    const list = await (await app.request("/transactions", { headers: { cookie } })).json();
    expect(list.data).toHaveLength(0);
  });

  test("rejects an invalid calendar date", async () => {
    const { app, cookie } = await setup();
    const { res } = await create(app, cookie, { ...VALID, txDate: "2026-02-30" });
    expect(res.status).toBe(400);
  });

  test("404s on a transaction that is not yours", async () => {
    const { ctx, app, cookie } = await setup();
    const created = await create(app, cookie);
    const other = await seedUser(ctx.db);
    const otherCookie = await (async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: other.email, password: other.password }),
      });
      return res.headers.get("set-cookie")!.split(";")[0]!;
    })();

    const put = await app.request(`/transactions/${created.body.data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie: otherCookie },
      body: JSON.stringify(VALID),
    });
    expect(put.status).toBe(404);

    const del = await app.request(`/transactions/${created.body.data.id}`, {
      method: "DELETE",
      headers: { cookie: otherCookie },
    });
    expect(del.status).toBe(404);

    // The owner still sees it untouched.
    const list = await (await app.request("/transactions", { headers: { cookie } })).json();
    expect(list.data).toHaveLength(1);
  });
});
