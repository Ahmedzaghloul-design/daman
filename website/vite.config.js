import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Pages listed in the sitemap (the Arabic version is the same address; the
// language is chosen on the page).
const PAGES = ["/", "/story", "/how-we-calculate", "/tools"];
// Reserved placeholder (".example" never belongs to anyone) until a domain is chosen.
const PLACEHOLDER = "https://daman.example";

/** Fills %SITE_URL% in index.html and writes robots.txt + sitemap.xml at build. */
function seo(siteUrl) {
  return {
    name: "daman-seo",
    transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", siteUrl),
    generateBundle() {
      if (siteUrl === PLACEHOLDER) this.warn(`VITE_SITE_URL is not set: link previews and the sitemap use the placeholder ${PLACEHOLDER}. Set it before going online.`);
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n` });
      const urls = PAGES.map((p) => `  <url><loc>${siteUrl}${p === "/" ? "/" : p}</loc><lastmod>${today}</lastmod></url>`).join("\n");
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const siteUrl = (env.VITE_SITE_URL || PLACEHOLDER).replace(/\/$/, "");
  return {
    plugins: [react(), tailwindcss(), seo(siteUrl)],
    server: {
      // The marketing website runs on 5173; the program (app/) runs on 5174.
      port: 5173,
      strictPort: true,
      // The chatbot calls the shared API, which holds the Gemini key.
      proxy: { "/api": "http://localhost:8787" },
    },
  };
});
