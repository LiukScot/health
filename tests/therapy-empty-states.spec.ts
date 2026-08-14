import { expect, test } from "@playwright/test";
import { loginUi, navigateTo, openEntryView, purgeUserData } from "./helpers";

test.beforeEach(async ({ request, page }) => {
  await purgeUserData(request);
  await loginUi(page);
});

test.afterEach(async ({ request }) => {
  await purgeUserData(request);
});

test("shows empty states for CBT and DBT", async ({ page }) => {
  await navigateTo(page, "CBT");
  await expect(page.getByRole("heading", { name: "CBT Thought Response" })).toBeVisible();
  await openEntryView(page, "history");
  await expect(page.getByText("No CBT entries yet")).toBeVisible();
  await expect(page.getByText("Open New entry to work through the prompts", { exact: false })).toBeVisible();

  await navigateTo(page, "DBT");
  await expect(page.getByRole("heading", { name: "DBT Distress Tolerance" })).toBeVisible();
  await openEntryView(page, "history");
  await expect(page.getByText("No DBT entries yet")).toBeVisible();
  await expect(page.getByText("Open New entry to work through the steps", { exact: false })).toBeVisible();
});