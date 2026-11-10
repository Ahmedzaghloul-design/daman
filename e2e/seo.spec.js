// Search engines and link previews.
import { test, expect } from "@playwright/test";
import { APP, SITE, setLang, useMockApi } from "./helpers.js";

const PAGES = { "/": /Verified carbon data/, "/story": /Our story/, "/how-we-calculate": /How we calculate/, "/tools": /CBAM cost estimate/ };

test.beforeEach(async ({ page }) => useMockApi(page));

for (const [path, title] of Object.entries(PAGES)) {
  test(`website ${path}: own title and description`, async ({ page }) => {
    await setLang(page, SITE, "en");
    await page.goto(SITE + path);
    await expect(page).toHaveTitle(title);
    expect((await page.locator('meta[name="description"]').getAttribute("content")).length).toBeGreaterThan(60);
  });
}

test("website: Arabic titles and page direction", async ({ page }) => {
  await setLang(page, SITE, "ar");
  await page.goto(SITE + "/story");
  await expect(page).toHaveTitle(/قصتنا/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
});

test("website: link preview tags and preview image", async ({ page, request }) => {
  await page.goto(SITE + "/");
  for (const p of ["og:title", "og:description", "og:image", "og:url"]) {
    await expect(page.locator(`meta[property="${p}"]`)).toHaveCount(1);
  }
  const img = await request.get(SITE + "/og-image.png");
  expect(img.status()).toBe(200);
  expect(img.headers()["content-type"]).toContain("image/png");
});

test("app: kept out of search engines", async ({ page, request }) => {
  await page.goto(APP + "/overview");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect(await (await request.get(APP + "/robots.txt")).text()).toContain("Disallow: /");
});
