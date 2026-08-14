import { expect, test } from "@playwright/test";
import { openEntryView, loginUi, navigateTo, purgeUserData, uniqueText } from "./helpers";

test.beforeEach(async ({ request, page }) => {
  await purgeUserData(request);
  await loginUi(page);
  await navigateTo(page, "CBT");
  await expect(page.getByRole("heading", { name: "CBT Thought Response" })).toBeVisible();
});

test.afterEach(async ({ request }) => {
  await purgeUserData(request);
});

test("creates, edits, and deletes a CBT thought-record entry", async ({ page }) => {
  const situation = uniqueText("cbt-situation");
  const updatedSituation = uniqueText("cbt-updated");

  await page.getByLabel("Situation").fill(situation);
  await page.getByLabel("Thoughts").fill("I can't manage this.");
  await page.getByLabel("Main unhelpful thought").fill("I always fail.");
  await page.getByLabel("Productive response").fill("Take one step at a time.");

  await page.getByRole("button", { name: /Save entry/i }).click();

  await openEntryView(page, "history");
  const entryRow = page.locator("details").filter({ hasText: situation });
  await expect(entryRow).toBeVisible();
  await entryRow.click();
  await expect(entryRow.getByText("I always fail.")).toBeVisible();

  await entryRow.getByRole("button", { name: /Edit/i }).click();
  await page.getByLabel("Situation").fill(updatedSituation);
  await page.getByRole("button", { name: /Update entry/i }).click();

  await openEntryView(page, "history");
  const updatedRow = page.locator("details").filter({ hasText: updatedSituation });
  await expect(updatedRow).toBeVisible();
  await updatedRow.click();

  await updatedRow.getByRole("button", { name: "Delete" }).click();
  await updatedRow.getByRole("button", { name: "Delete?" }).click();

  await expect(page.locator("details").filter({ hasText: updatedSituation })).toHaveCount(0);
});
