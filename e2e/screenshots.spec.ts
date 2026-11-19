import { expect, test } from "@playwright/test";

test("capture the landing, tonight, a plan, and friends", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/landing-390.png", animations: "disabled", timeout: 15_000 });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.screenshot({ path: "docs/screenshots/landing-1440.png", animations: "disabled", timeout: 15_000 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Name").fill("Avery Chen");
  await page.getByLabel("Timezone").selectOption("America/Chicago");
  await page.getByLabel("Your area").fill("Lincoln Park");
  await page.getByRole("checkbox", { name: "basketball" }).check();
  await page.getByRole("checkbox", { name: /18 or older/i }).check();
  await page.getByRole("button", { name: "Save and see tonight" }).click();
  await page.waitForURL("/");
  await expect(page.getByRole("heading", { name: "Tonight", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Avery Chen" })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "docs/screenshots/tonight-390.png", animations: "disabled", timeout: 15_000 });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("link", { name: "Create", exact: true }).click();
  await page.getByLabel("What are you doing?").fill("Basketball tonight");
  const when = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  const local = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T19:00`;
  await page.getByLabel("When").fill(local);
  await page.getByLabel("Area").fill("Riverside courts");
  await page.getByLabel("Exact spot").fill("North gate, court 2");
  await page.getByRole("button", { name: "Publish to friends" }).click();
  await page.waitForURL(/\/plans\//);
  await page.screenshot({ path: "docs/screenshots/plan-1440.png", animations: "disabled", timeout: 15_000 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/friends");
  await expect(page.getByRole("heading", { name: "Friends", exact: true })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/friends-390.png", animations: "disabled", timeout: 15_000 });
});
