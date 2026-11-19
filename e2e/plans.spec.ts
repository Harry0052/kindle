import { expect, test } from "@playwright/test";

async function signUp(page: import("@playwright/test").Page, name: string) {
  await page.goto("/");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Timezone").selectOption("America/Chicago");
  await page.getByLabel("Your area").fill("Lincoln Park");
  await page.getByRole("checkbox", { name: "basketball" }).check();
  await page.getByRole("checkbox", { name: /18 or older/i }).check();
  await page.getByRole("button", { name: "Save and see tonight" }).click();
  await page.waitForURL("/");
  await expect(page.getByRole("heading", { name: "Tonight" })).toBeVisible();
}

test("a stranger cannot see a friends-only plan, and a friend cannot see the exact spot", async ({ page, browser }) => {
  await signUp(page, "Avery Chen");
  await page.getByRole("link", { name: "Create", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create a plan" })).toBeVisible();
  await page.getByLabel("What are you doing?").fill("Basketball tonight");
  const when = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  const local = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T19:00`;
  await page.getByLabel("When").fill(local);
  await page.getByLabel("Area").fill("Riverside courts");
  await page.getByLabel("Exact spot").fill("North gate, court 2");
  await page.getByRole("button", { name: "Publish to friends" }).click();
  await page.waitForURL(/\/plans\//);
  await expect(page.getByRole("heading", { name: "Basketball tonight" })).toBeVisible();
  await expect(page.getByText("North gate, court 2")).toBeVisible();
  const planUrl = page.url();

  const stranger = await browser.newContext();
  const strangerPage = await stranger.newPage();
  await signUp(strangerPage, "Blake Ortiz");
  const hidden = await strangerPage.request.get(planUrl);
  const hiddenBody = await hidden.text();
  expect(hiddenBody).not.toContain("North gate");
  expect(hiddenBody).toContain("find that page");
  expect(hiddenBody).not.toContain("Basketball tonight");
  await strangerPage.goto("/");
  await expect(strangerPage.getByText("Basketball tonight")).toHaveCount(0);

  await page.goto("/friends");
  await page.getByRole("button", { name: "Create friend link" }).click();
  const inviteUrl = await page.getByLabel("Friend link").inputValue();
  await strangerPage.goto(inviteUrl);
  await strangerPage.getByRole("button", { name: "Accept friend request" }).click();
  await expect(strangerPage.getByRole("heading", { name: "Friends" })).toBeVisible();
  await expect(strangerPage.getByText("Avery Chen")).toBeVisible();
  await strangerPage.goto(planUrl);
  await expect(strangerPage.getByRole("heading", { name: "Basketball tonight" })).toBeVisible();
  await expect(strangerPage.getByText("Riverside courts")).toBeVisible();
  await expect(strangerPage.getByText("North gate, court 2")).toHaveCount(0);
  await expect(strangerPage.getByText(/Exact spot hidden|Hidden until you are in/i)).toBeVisible();
  await strangerPage.getByRole("button", { name: "I'm in" }).click();
  await expect(strangerPage.getByText("North gate, court 2")).toBeVisible();
  await stranger.close();
});
