import { expect, test } from "@playwright/test";

test("a new profile is saved and still there after refresh", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /we should hang out/i })).toBeVisible();
  await expect(page.getByText("Example")).toBeVisible();
  await expect(page.getByRole("link", { name: /join|i'm in/i })).toHaveCount(0);
  await page.getByLabel("Name").fill("Avery Chen");
  await page.getByLabel("Timezone").selectOption("America/Chicago");
  await page.getByRole("checkbox", { name: /18 or older/i }).check();
  await page.getByRole("button", { name: "Save and see tonight" }).click();
  await expect(page.getByRole("heading", { name: "Tonight" })).toBeVisible();
  await expect(page.getByText("Avery Chen").first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("Avery Chen").first()).toBeVisible();
  await expect(page.getByText("Times use America/Chicago.")).toBeVisible();
});

test("a too-short name is rejected and the profile is not created", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Name").fill("A");
  await page.getByRole("checkbox", { name: /18 or older/i }).check();
  await page.getByRole("button", { name: "Save and see tonight" }).click();
  await expect(page.getByText(/at least 2 characters/i)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Name")).toBeVisible();
});

test("an unknown page offers a way home", async ({ page }) => {
  await page.goto("/not-a-page");
  await expect(page.getByRole("heading", { name: /can't find that page/i })).toBeVisible();
  await page.getByRole("link", { name: "Back to Tonight" }).click();
  await expect(page).toHaveURL("/");
});

test("landing fits a phone and a desktop window", async ({ page }) => {
  for (const size of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
