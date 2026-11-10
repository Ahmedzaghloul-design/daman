// Exports from the program. The O3CI file uses the field names of the EU's
// installation / emissions data model (CBAM Declarant Portal manual v1.81
// §1.9) so an operator can copy values into the O3CI portal. It is NOT an
// official EU file format, and says so inside the file.
const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (headers, rows) => "﻿" + [headers.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");

const r6 = (n) => (Number.isFinite(n) ? Math.round(n * 1e6) / 1e6 : null);

export function reportCsv(rows, year) {
  return toCsv(
    ["year", "cn_code", "description", "installation_id", "tonnes_produced", "tonnes_exported", "direct_tco2e", "indirect_tco2e", "specific_tco2e_per_t", "actual_data_share", "status", "warnings"],
    rows.map(({ product, r }) => [year, r.good?.codeDisplay ?? product.cn, r.good?.description, product.installationId, product.tonnesProduced, product.tonnesExported, r6(r.direct), r6(r.indirect), r6(r.specific), r6(r.actualShare), r.status, (r.warnings ?? []).join(" ")]),
  );
}

// EU code-list wording for the source of electricity (manual v1.81 §1.9).
const ELECTRICITY_SOURCE = { grid: "received from the grid", auto: "Auto-produced", ppa: "(bilateral) power purchase agreement" };

export function o3ciExport({ installations, rows, year, gridFactor }) {
  return JSON.stringify(
    {
      notice: "Prepared by Daman (prototype). Field names follow the EU CBAM installation and emissions data model. This is not an official EU file format and has not been verified. Enter the values in the O3CI portal: https://cbam.ec.europa.eu/o3cinstallation",
      reportingYear: year,
      generatedAt: new Date().toISOString(),
      installations: installations.map((i) => ({
        installationId: i.id,
        installationName: i.name,
        economicActivity: i.activity,
        operator: { name: i.operator, contactName: i.contact || null, email: i.email || null },
        address: { countryCode: i.country, city: i.city, street: i.address, unlocode: i.unlocode || null, latitude: i.lat || null, longitude: i.lon || null, coordinateType: i.lat ? "GPS" : null },
        goods: rows
          .filter(({ product }) => product.installationId === i.id)
          .map(({ product, r }) => ({
            cnCode: r.good?.codeDisplay ?? product.cn,
            description: r.good?.description ?? null,
            productionRoute: r.dv?.route ?? null,
            quantityProduced: { netMassTonnes: Number(product.tonnesProduced) || null },
            directEmbeddedEmissions: {
              typeOfDetermination: r.directActual ? "Actual data" : "Default value",
              installationDirectEmissionsTonnes: r6(r.direct),
              specificDirectEmbeddedEmissions: r6(r.specificDirect),
              fuelCombustionTonnes: r.directActual ? r6(r.fuelT) : null,
              processEmissionsTonnes: r.processT,
            },
            indirectEmbeddedEmissions: r.countsIndirect
              ? {
                  typeOfDetermination: r.indirectActual ? "Actual data" : "Default value",
                  installationIndirectEmissionsTonnes: r6(r.indirect),
                  electricityConsumedMWhPerTonne: r.indirectActual ? r6(r.mwh / Number(product.tonnesProduced)) : null,
                  emissionFactorTCO2PerMWh: r.indirectActual ? Number(gridFactor) : null,
                  sourceOfElectricity: ELECTRICITY_SOURCE[i.electricitySource] ?? null,
                }
              : null,
            totalEmbeddedEmissionsTonnes: r6(r.total),
            specificEmbeddedEmissions: r6(r.specific),
            supportingDocuments: r.entryIds ?? [],
            warnings: r.warnings,
          })),
      })),
    },
    null,
    2,
  );
}
