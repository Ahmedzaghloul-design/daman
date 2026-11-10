// Presentation mode: the full tour as a presenter runs it (recorded answers).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { APP, setLang, settle, useMockApi } from "./helpers.js";

test.beforeEach(async ({ page }) => {
  await useMockApi(page);
  // Recorded mode must not call Gemini for receipts or the chat.
  await page.route(/\/api\/(audit|audit-image|chat)/, () => {
    throw new Error("presentation (recorded) called the API");
  });
});

for (const lang of ["en", "ar"]) {
  test(`presentation runs end to end (${lang})`, async ({ page }) => {
    await setLang(page, APP, lang);
    await page.goto(APP + "/present");
    const card = page.getByRole("complementary", { name: lang === "en" ? "Presentation guide" : "دليل العرض" });
    const next = card.getByRole("button", { name: lang === "en" ? "Next" : "التالي" });
    await expect(card).toContainText("1/11");
    await settle(page); // let the page finish fading in before measuring contrast
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations.map((v) => v.id)).toEqual([]);

    // 2: unclear receipt (recorded) -> flagged, digit not guessed
    await next.click();
    await expect(page.getByText(/Illegible digit|رقم غير مقروء|غير مقروء/).first()).toBeVisible({ timeout: 10_000 });
    // 3: reject it
    await next.click();
    await page.getByRole("button", { name: lang === "en" ? "Reject" : "رفض", exact: true }).click();
    // 4: unusual diesel receipt
    await next.click();
    const approve = page.getByRole("button", { name: lang === "en" ? "Approve and add to ledger" : "اعتماد وإضافة إلى السجل" });
    await expect(approve).toBeVisible({ timeout: 10_000 });
    await expect(approve).toBeDisabled();
    // 5: fields pre-filled; the presenter approves
    await next.click();
    await expect(approve).toBeEnabled();
    await approve.click();
    const id = (await page.getByRole("status").filter({ hasText: /DMN-/ }).textContent()).match(/DMN-\d{4}-\d{4}/)[0];
    expect(id).toBe("DMN-2026-0008"); // fresh demo has 7 entries
    // 6: ledger shows it
    await next.click();
    await expect(page).toHaveURL(/\/ledger/);
    await expect(page.getByRole("button", { name: id })).toBeVisible();
    // 7-8: report, cost
    await next.click();
    await expect(page).toHaveURL(/\/report/);
    await next.click();
    // 9: chat with a sourced answer
    await next.click();
    const chat = page.getByRole("dialog");
    await expect(chat).toContainText(lang === "en" ? "30 September 2027" : "30 سبتمبر 2027");
    await expect(chat.getByRole("link", { name: /F10/ })).toHaveAttribute("href", /eur-lex\.europa\.eu/);
    // 10: verifier view
    await next.click();
    await expect(page).toHaveURL(/\/verify/);
    await expect(chat).toHaveCount(0);
    // 11: finish
    await next.click();
    await expect(card).toContainText("11/11");
    await card.getByRole("button", { name: lang === "en" ? "Finish" : "إنهاء" }).click();
    await expect(card).toHaveCount(0);
  });
}

test("presentation: arrow keys move, Back doesn't re-run a receipt", async ({ page }) => {
  await setLang(page, APP, "en");
  await page.goto(APP + "/present");
  const card = page.getByRole("complementary", { name: "Presentation guide" });
  await expect(card).toContainText("1/11");
  await page.keyboard.press("ArrowRight");
  await expect(card).toContainText("2/11");
  await expect(page).toHaveURL(/\/receipts/);
  await page.keyboard.press("ArrowLeft");
  await expect(card).toContainText("1/11");
  await page.keyboard.press("ArrowRight");
  await expect(card).toContainText("2/11");
});
