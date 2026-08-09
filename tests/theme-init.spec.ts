import { test, expect, type Page } from "@playwright/test";

// theme-init.js (frontend/public/theme-init.js) applies the stored theme and
// realm synchronously on load, before React mounts, so grey/oled users do not
// get a flash of the wrong theme.
//
// Proving that needs the app bundle out of the way. App.tsx sets the same two
// attributes from the same two localStorage keys once it mounts, so a test
// that lets React run passes whether or not the init script exists at all.
// Blocking /assets/*.js leaves the document with nothing running but
// theme-init.js; the #root guard fails loudly if that ever stops being true.
//
// The response wait is what makes the negative cases mean anything. "The
// script rejected this value" and "the script never ran" both leave the
// attribute unset, so absence alone proves nothing — each test also has to
// show the script was fetched, and the two rejection cases pair the bad value
// with a good one on the other key.

async function loadShellOnly(page: Page, seed: () => void): Promise<void> {
  await page.route("**/assets/*.js", (route) => route.abort());
  await page.addInitScript(seed);

  const initScriptLoaded = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/theme-init.js" && response.ok(),
    { timeout: 10_000 },
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await initScriptLoaded;

  await expect(page.locator("#root")).toBeEmpty();
}

test("applies the stored theme", async ({ page }) => {
  await loadShellOnly(page, () => localStorage.setItem("world-theme", "grey"));
  expect(await page.getAttribute("html", "data-theme")).toBe("grey");
});

test("applies the stored realm", async ({ page }) => {
  await loadShellOnly(page, () => localStorage.setItem("world-realm", "money"));
  expect(await page.getAttribute("html", "data-realm")).toBe("money");
});

test("ignores an unknown theme but still applies the realm", async ({ page }) => {
  await loadShellOnly(page, () => {
    localStorage.setItem("world-theme", "hacker-purple");
    localStorage.setItem("world-realm", "money");
  });
  expect(await page.getAttribute("html", "data-theme")).toBeNull();
  expect(await page.getAttribute("html", "data-realm")).toBe("money");
});

test("ignores an unknown realm but still applies the theme", async ({ page }) => {
  await loadShellOnly(page, () => {
    localStorage.setItem("world-realm", "crypto-castle");
    localStorage.setItem("world-theme", "oled");
  });
  expect(await page.getAttribute("html", "data-realm")).toBeNull();
  expect(await page.getAttribute("html", "data-theme")).toBe("oled");
});

test("does nothing when localStorage is empty", async ({ page }) => {
  await loadShellOnly(page, () => localStorage.clear());
  expect(await page.getAttribute("html", "data-theme")).toBeNull();
  expect(await page.getAttribute("html", "data-realm")).toBeNull();
});
