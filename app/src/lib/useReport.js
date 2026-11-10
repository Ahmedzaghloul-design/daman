import { useMemo } from "react";
import { entriesFor, productEmissions } from "@daman/core/report.js";
import { useAppState } from "../state/AppState.jsx";

/** Report rows for the selected year: [{ product, installation, r }]. */
export function useReport() {
  const { products, installations, ledger, settings } = useAppState();
  return useMemo(
    () =>
      products.map((product) => {
        const r = productEmissions(product, ledger, { year: settings.year, gridFactor: settings.gridFactor });
        return {
          product,
          installation: installations.find((i) => i.id === product.installationId),
          r: { ...r, entryIds: entriesFor(product, ledger, settings.year).map((e) => e.id) },
        };
      }),
    [products, installations, ledger, settings.year, settings.gridFactor],
  );
}
