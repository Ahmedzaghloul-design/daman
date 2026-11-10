// Shared test helpers.
export const SITE = "http://localhost:5173";
export const APP = "http://localhost:5174";
const MOCK_API = "http://localhost:8797";

/** Send the page's /api calls to the mock API instead of the real one. */
export async function useMockApi(page) {
  await page.route(/\/api\/(audit|audit-image|chat|health)/, async (route) => {
    const u = new URL(route.request().url());
    const res = await route.fetch({ url: MOCK_API + u.pathname + u.search });
    await route.fulfill({ response: res });
  });
  // Never send demo requests or touch the cloud database from tests.
  await page.route(/\/api\/lead/, (route) => route.fulfill({ json: { ok: true } }));
  await page.route(/supabase\.co/, (route) => route.abort());
}

/** Start with a chosen language and an empty chat history. */
export async function setLang(page, base, lang) {
  const key = base === SITE ? "daman.site.lang" : "daman.app.lang";
  await page.addInitScript(([k, l]) => {
    try {
      if (!sessionStorage.getItem("__init")) {
        localStorage.clear();
        localStorage.setItem(k, l);
        sessionStorage.setItem("__init", "1");
      }
    } catch {}
  }, [key, lang]);
}

/** Show everything that waits for scrolling (reveal animations), then let it settle. */
export async function settle(page) {
  await page.evaluate(() => document.querySelectorAll(".reveal, .draw").forEach((e) => e.classList.add("in")));
  await page.waitForTimeout(700);
}
