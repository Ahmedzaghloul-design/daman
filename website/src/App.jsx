import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import Home from "./pages/Home.jsx";
import Story from "./pages/Story.jsx";
import HowWeCalculate from "./pages/HowWeCalculate.jsx";
import NotFound from "./pages/NotFound.jsx";

// The tools carry the official EU data (~300 KB), so load them only when opened.
const Tools = lazy(() => import("./pages/Tools.jsx"));

// Scroll to the top on page change, or to the #section in the URL.
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <ScrollManager />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/story" element={<Story />} />
          <Route path="/how-we-calculate" element={<HowWeCalculate />} />
          <Route path="/tools" element={<Suspense fallback={<div className="min-h-screen" />}><Tools /></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
