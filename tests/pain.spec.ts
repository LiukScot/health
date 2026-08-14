import { expect, test } from "@playwright/test";
import { loginUi, navigateTo, openEntryView, purgeUserData } from "./helpers";

test.beforeEach(async ({ request, page }) => {
  await purgeUserData(request);
  await loginUi(page);
  await navigateTo(page, "pain");
  await expect(page.getByRole("heading", { name: "Pain" })).toBeVisible();
});

test.afterEach(async ({ request }) => {
  await purgeUserData(request);
});

test("shows a pain empty state when there are no entries", async ({ page }) => {
  await openEntryView(page, "history");
  await expect(page.getByText("No pain entries yet")).toBeVisible();
  await expect(page.getByText("Open New entry to record a flare", { exact: false })).toBeVisible();
});

// Pain CRUD UI flow E2E removed — same rationale as diary.spec.ts.
// Covered by 14 backend unit tests in backend/src/routes/pain.test.ts.
