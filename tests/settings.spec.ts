import { expect, test } from "@playwright/test";
import { e2eUser, loginUi, openAccountPanel, openSettingsRealm, openSettingsSection, purgeUserData } from "./helpers";

test.beforeEach(async ({ request, page }) => {
  await purgeUserData(request);
  await loginUi(page);
  await openSettingsRealm(page);
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

  await openSettingsRealm(page);
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
  await openSettingsSection(page, "Appearance");

  // The radio is visually hidden inside its card, so the click goes where a
  // user's click goes — on the label — and the radio is asserted after.
  const grey = page.getByRole("radio", { name: /Grey/ });
  await page.locator("label", { has: grey }).click();
  await expect(grey).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "grey");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "grey");
});

test("saves birthday in settings", async ({ page }) => {
  await openSettingsSection(page, "Health");

  // Birthday autosaves on change: register the response listener before filling
  // the native date input that triggers the PUT, otherwise it can land first.
  const responsePromise = page.waitForResponse(response =>
    response.url().includes('/api/v1/preferences') && response.request().method() === 'PUT'
  );
  await page.getByLabel("Birthday").fill("1995-06-12");
  await responsePromise;

  await page.reload();
  await openSettingsRealm(page);
  await openSettingsSection(page, "Health");
  await expect(page.getByLabel("Birthday")).toHaveValue("1995-06-12");
});
