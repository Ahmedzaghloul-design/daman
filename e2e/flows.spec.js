// Click-through tests: what a visitor or a factory reviewer actually does.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { APP, SITE, setLang, useMockApi } from "./helpers.js";

test.beforeEach(async ({ page }) => useMockApi(page));

test("website: navigate pages and switch to Arabic", async ({ page, isMobile }) => {
  await setLang(page, SITE, "en");
  await page.goto(SITE + "/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("analog-to-digital bridge");
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("link", { name: "How we calculate" }).first().click();
  await expect(page).toHaveURL(/how-we-calculate/);
  await page.getByRole("button", { name: "العربية" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).not.toContainText("How");
});

test("website: live demo runs a recorded receipt", async ({ page }) => {
  await setLang(page, SITE, "en");
  await page.goto(SITE + "/#demo");
  const demo = page.locator("section", { has: page.getByRole("heading", { name: "Watch a receipt become data" }) });
  await demo.getByRole("button", { name: "Diesel delivery", exact: true }).click();
  await demo.getByRole("button", { name: /^Run/ }).first().click();
  await expect(demo.getByText("Structured record")).toBeVisible();
});

test("website: cost estimate matches the checked figure for steel billets", async ({ page }) => {
  await setLang(page, SITE, "en");
  await page.goto(SITE + "/tools");
  await page.getByLabel("Product").selectOption("72071114");
  await expect(page.getByText("252.37 EUR per tonne")).toBeVisible(); // checked by hand, spec F23/F24
  await expect(page.getByRole("link", { name: "Open the full calculator in the app" })).toHaveAttribute("href", /\/calculator$/);
});

test("app: process a sample receipt, approve it, find it in the ledger", async ({ page }) => {
  await setLang(page, APP, "en");
  await page.goto(APP + "/receipts");
  await page.getByRole("button", { name: "Use a sample receipt" }).click();
  await expect(page.getByRole("button", { name: "Approve and add to ledger" })).toBeVisible({ timeout: 15_000 });

  // The review screen must be accessible too.
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).exclude("iframe").analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);

  const approve = page.getByRole("button", { name: "Approve and add to ledger" });
  await expect(approve).toBeDisabled(); // nothing is approved without the checks
  await page.getByLabel("Installation").selectOption({ index: 1 });
  await page.getByLabel("Product").selectOption({ index: 1 });
  await page.getByLabel("Reviewer").fill("Test Reviewer");
  const just = page.getByLabel(/Justification/);
  if (await just.count()) await just.fill("Checked against the fuel log for March.");
  await page.getByLabel("I have compared every field with the source document.").check();
  await expect(approve).toBeEnabled();
  await approve.click();
  const notice = page.getByRole("status").filter({ hasText: /added to the ledger/ });
  await expect(notice).toBeVisible();
  const id = (await notice.textContent()).match(/DMN-\d{4}-\d{4}/)[0];

  await page.goto(APP + "/ledger");
  await expect(page.getByRole("button", { name: id })).toBeVisible();
});

test("app: a photo goes through the photo route (test data box)", async ({ page }) => {
  await setLang(page, APP, "en");
  await page.goto(APP + "/receipts");
  // A tiny valid PNG; the mock API returns its fixed sample reading.
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  // Wait until the app knows the billing status (mock API: treated as allowed).
  await expect(page.getByText(/Gemini billing is on|test data/).first()).toBeVisible();
  const box = page.getByLabel(/test data/);
  if (await box.count()) await box.check();
  await page.locator('input[type=file]:not([capture])').setInputFiles({ name: "receipt.png", mimeType: "image/png", buffer: png });
  await expect(page.getByText("Raw text read from the receipt")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Approve and add to ledger" })).toBeVisible();
});

test("app: calculator and language switch", async ({ page }) => {
  await setLang(page, APP, "en");
  await page.goto(APP + "/calculator");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto(APP + "/settings");
  await page.getByRole("button", { name: "العربية" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
