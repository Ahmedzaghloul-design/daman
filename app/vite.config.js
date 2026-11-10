import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The program runs on 5174; the marketing website (website/) runs on 5173.
    port: 5174,
    strictPort: true,
    // The browser never talks to Gemini directly. Every /api call is proxied
    // to the Express server (server/index.js), which holds the API key.
    proxy: { "/api": "http://localhost:8787" },
  },
});
