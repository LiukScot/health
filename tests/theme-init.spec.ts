import { test, expect } from "@playwright/test";
import { loginUi, purgeUserData } from "./helpers";

// These tests verify that the theme-init script (frontend/public/theme-init.js)
// executes synchronously on page load and applies the stored theme before React
// mounts — preventing a flash of the wrong theme for grey/oled users.

test.beforeEach(async ({ request }) => {
  await purgeUserData(request);
});

test("applies stored theme before React mounts", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("health-theme", "grey");
  });
  await loginUi(page);

  // data-theme must be set by the init script synchronously on domcontentloaded,
  // before React hydrates — so it's already present when we check.
  await page.waitForLoadState("domcontentloaded");
  expect(await page.getAttribute("html", "data-theme")).toBe("grey");
});

test("ignores unknown theme values", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("health-theme", "hacker-purple");
  });
  await loginUi(page);

  await page.waitForLoadState("domcontentloaded");
  expect(await page.getAttribute("html", "data-theme")).toBeNull();
});

test("does nothing when localStorage is empty", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("health-theme");
  });
  await loginUi(page);

  await page.waitForLoadState("domcontentloaded");
  expect(await page.getAttribute("html", "data-theme")).toBeNull();
});
