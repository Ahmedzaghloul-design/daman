import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The marketing website runs on 5173; the program (app/) runs on 5174.
    port: 5173,
    strictPort: true,
    // The chatbot (Phase 5) calls the shared API, which holds the Gemini key.
    proxy: { "/api": "http://localhost:8787" },
  },
});
