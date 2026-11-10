// Accessibility scan (axe-core, WCAG 2.1 A and AA rules) of every page, in
// English and Arabic. Fails on any violation and prints what to fix.
import fs from "node:fs";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { APP, SITE, setLang, settle, useMockApi } from "./helpers.js";

const PAGES = [
  ...["/", "/story", "/how-we-calculate", "/tools"].map((p) => [SITE, p]),
  ...["/overview", "/report", "/receipts", "/ledger", "/anomalies", "/verify", "/calculator", "/installations", "/products", "/settings", "/account"].map((p) => [APP, p]),
];

for (const lang of ["en", "ar"]) {
  for (const [base, path] of PAGES) {
    test(`a11y ${lang} ${base === SITE ? "site" : "app"}${path}`, async ({ page }) => {
      await useMockApi(page);
      await setLang(page, base, lang);
      await page.goto(base + path);
      await page.waitForLoadState("networkidle");
      await settle(page);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).exclude("iframe").analyze();
      fs.mkdirSync("test-results/a11y", { recursive: true });
      fs.writeFileSync(`test-results/a11y/${test.info().project.name}-${lang}-${base === SITE ? "site" : "app"}${path.replace(/\//g, "_")}.json`, JSON.stringify(r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => ({ target: n.target.join(" "), html: n.html.slice(0, 160), why: n.failureSummary?.slice(0, 200) })) })), null, 1));
      const summary = r.violations.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length}× e.g. ${v.nodes[0].target.join(" ")}`);
      expect(summary, summary.join("\n")).toEqual([]);
    });
  }
}
