// Keyboard use: everything important works without a mouse.
import { test, expect } from "@playwright/test";
import { APP, SITE, setLang, useMockApi } from "./helpers.js";

test.beforeEach(async ({ page }) => useMockApi(page));

test("website: first Tab shows 'Skip to content', which jumps to the page", async ({ page }) => {
  await setLang(page, SITE, "en");
  await page.goto(SITE + "/story");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("website: chat opens, answers and closes with the keyboard", async ({ page }) => {
  await setLang(page, SITE, "en");
  await page.goto(SITE + "/");
  const opener = page.getByRole("button", { name: "Ask Daman" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const box = page.getByRole("textbox", { name: "Type your question…" });
  await expect(box).toBeFocused();
  await page.keyboard.type("What is the default value mark-up for cement?");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog").getByText("From Daman's verified notes")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("link", { name: /F3/ }).first()).toHaveAttribute("target", "_blank");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ask Daman" })).toBeFocused();
});

test("app: skip link, keyboard navigation and the ledger drawer", async ({ page }) => {
  await setLang(page, APP, "en");
  await page.goto(APP + "/overview");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

  await page.goto(APP + "/ledger");
  const first = page.getByRole("button", { name: /^DMN-2026-/ }).first();
  await first.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  // Tab stays inside the open drawer.
  for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
  expect(await drawer.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(first).toBeFocused();
});
