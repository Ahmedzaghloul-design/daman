import { app } from "./app.js";
import { MODEL, MOCK } from "./services/geminiApi.js";

// API_PORT wins in development (tools often set PORT for the web server);
// hosting platforms that only set PORT still work in production.
const PORT = Number(process.env.API_PORT || process.env.PORT) || 8787;

// On Vercel the platform runs the exported app; locally we start a server.
if (!process.env.VERCEL) app.listen(PORT, () => {
  console.log(`Daman API listening on http://localhost:${PORT}`);
  console.log(MOCK ? "Gemini: MOCK mode" : `Gemini model: ${MODEL}`);
  if (!MOCK && !process.env.GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY is not set. /api/audit will return 503 until it is.");
  }
});

export default app;
