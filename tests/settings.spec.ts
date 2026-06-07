import { expect, test } from "@playwright/test";
import { e2eUser, loginUi, openAccountPanel, purgeUserData } from "./helpers";

test.beforeEach(async ({ request, page }) => {
  await purgeUserData(request);
  await loginUi(page);
  await page.getByRole("button", { name: "settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});

test.afterEach(async ({ request }) => {
  await purgeUserData(request);
});

test("changes password and restores the original password", async ({ page }) => {
  const temporaryPassword = "Password456";

  await openAccountPanel(page);
  await page.getByLabel("Current password").fill(e2eUser.password);
  await page.getByLabel("New password").fill(temporaryPassword);
  await page.getByLabel("Confirm").fill(temporaryPassword);
  await page.getByRole("button", { name: "Change password" }).click();
  
  // Wait for password update confirmation
  await expect(page.getByText("Password updated.")).toBeVisible();
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "Log out" }).click();
  await loginUi(page, temporaryPassword);

  await page.getByRole("button", { name: "settings" }).click();
  await openAccountPanel(page);
  await page.getByLabel("Current password").fill(temporaryPassword);
  await page.getByLabel("New password").fill(e2eUser.password);
  await page.getByLabel("Confirm").fill(e2eUser.password);
  await page.getByRole("button", { name: "Change password" }).click();
  
  // Wait for password update confirmation 
  await expect(page.getByText("Password updated.")).toBeVisible();
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "Log out" }).click();
  await loginUi(page);
});

test("switches theme and persists it across reload", async ({ page }) => {
  await page.getByRole("button", { name: "Preferences" }).click();

  await page.getByRole("button", { name: "Grey" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "grey");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "grey");
});

test("saves birthday in settings", async ({ page }) => {
  await page.getByRole("button", { name: "Preferences" }).click();

  // Birthday autosaves on selection: register the response listener before the
  // calendar interaction that triggers the PUT, otherwise the response can land first.
  const responsePromise = page.waitForResponse(response =>
    response.url().includes('/api/v1/preferences') && response.request().method() === 'PUT'
  );
  await page.getByRole("button", { name: "Birthday" }).click();
  const calendar = page.getByRole("dialog", { name: "Birthday" });
  await calendar.getByRole("combobox").first().selectOption({ label: "June" });
  await calendar.getByRole("combobox").last().selectOption("1995");
  await calendar.getByRole("button", { name: /June 12(th)?,? 1995/i }).click();
  await responsePromise;

  await page.reload();
  await page.getByRole("button", { name: "settings" }).click();
  await page.getByRole("button", { name: "Preferences" }).click();
  await expect(page.getByRole("button", { name: "Birthday" })).toHaveText("12 Jun 1995");
});
