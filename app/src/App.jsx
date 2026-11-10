import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import { AppStateProvider } from "./state/AppState.jsx";
import { AuthProvider } from "./state/Auth.jsx";
import { PipelineProvider } from "./state/Pipeline.jsx";
import Layout from "./components/Layout.jsx";
import Overview from "./pages/Overview.jsx";
import Report from "./pages/Report.jsx";
import Receipts from "./pages/Receipts.jsx";
import Ledger from "./pages/Ledger.jsx";
import Anomalies from "./pages/Anomalies.jsx";
import Installations from "./pages/Installations.jsx";
import Products from "./pages/Products.jsx";
import Settings from "./pages/Settings.jsx";
import Calculator from "./pages/Calculator.jsx";
import Account from "./pages/Account.jsx";
import Verify from "./pages/Verify.jsx";

// The program only: the marketing website lives in website/.
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
      <AppStateProvider>
        <PipelineProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Navigate to="/overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="report" element={<Report />} />
                <Route path="receipts" element={<Receipts />} />
                <Route path="ledger" element={<Ledger />} />
                <Route path="anomalies" element={<Anomalies />} />
                <Route path="calculator" element={<Calculator />} />
                <Route path="installations" element={<Installations />} />
                <Route path="products" element={<Products />} />
                <Route path="settings" element={<Settings />} />
                <Route path="account" element={<Account />} />
                <Route path="verify" element={<Verify />} />
                <Route path="*" element={<Navigate to="/overview" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PipelineProvider>
      </AppStateProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
