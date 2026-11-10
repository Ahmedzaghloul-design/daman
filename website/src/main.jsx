import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Placeholder until Phase 2 builds the real website (see docs/DAMAN_V2_SPEC.md §5).
function Placeholder() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <p className="text-sm text-slate-500">Daman website</p>
      <h1 className="text-3xl font-semibold text-slate-900">Coming in Phase 2.</h1>
      <p className="text-slate-600">
        This is the separate marketing website. The program runs on its own at{" "}
        <a className="underline" href="http://localhost:5174">
          localhost:5174
        </a>
        .
      </p>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Placeholder />
  </StrictMode>,
);
