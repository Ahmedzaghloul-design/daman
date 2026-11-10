# CBAM reference notes (from documents shared by the team, 2026-11-10)

What each document says, whether it is **current** (definitive period, from
1 January 2026) or **historical** (transitional period, 2023–2025), and where
Daman uses it. Facts used on the website must also appear in
`docs/DAMAN_V2_SPEC.md` §4 with a source.

| # | Document | Date | Status | Use in Daman |
| --- | --- | --- | --- | --- |
| D1 | *CBAM Compliance Essentials for Importers and Indirect Customs Representatives as from 1 January 2026* ("Guideline Document for External Stakeholders"), DG TAXUD | 2026 | **Current** | Website FAQ and timeline (authorisation, 50 t threshold, enforcement) |
| D2 | *Application User Manual — CBAM Declarant Portal ver 1.4.1.1*, v1.81, DG TAXUD | 18 Mar 2025 | Transitional portal, but the **data model** (operator, installation, direct/indirect emissions) carries into the definitive period | Program data model (Phase 4), calculator inputs (Phase 3), explorer (Phase 2) |
| D3 | *Most important features for the Declarant Portal for release CBAM 1.4.0.1* (slide) | Jan 2025 | Transitional, describes the third-country operator function that continues as O3CI | Website: why O3CI matters to Egyptian factories |
| D4 | *Requesting delayed submission in the CBAM Transitional Registry — Guidance for Declarants* | 1 Oct 2024 | **Historical** (quarterly reports ended with the transitional period) | Not used on the website |
| D5 | Publications Office catalogue page: *CBAM — Checklist for EU importers* (ISBN 978-92-68-09247-7, DOI 10.2778/127227) | 28 Nov 2023 | Catalogue page only; the checklist PDF itself was not included | Not used until the PDF is provided |

## D1 — key points (current)

- CBAM goods: cement, aluminium, fertilisers, iron and steel, hydrogen and
  electricity.
- Importers or indirect customs representatives must hold a valid CBAM
  account number or application reference number for imports **above 50
  tonnes per calendar year**, and for **all electricity and hydrogen**
  imports, to get goods released for free circulation.
- Applications for CBAM authorisation must be submitted **before importing
  and at the latest by 31 March 2026**, via UUM&DS → Authorisation Management
  Module (AMM) in the CBAM Registry, through the National Competent
  Authority (NCA).
- Customs verifies the CBAM account number; NCAs monitor compliance through
  the CBAM Registry and enforce penalties.
- The guideline does not supersede Regulation (EU) 2023/956.

## D2 — emissions data model (per CBAM good)

For each good: HS (6-digit) + CN (8-digit) code, description, country of
origin, net mass (tonnes) or supplementary units; then up to 999 emissions
entries, each with:

- **Country of production**; **operator** (ID, name, address, contact);
  **installation** (ID, name, economic activity, address, UN/LOCODE,
  latitude/longitude).
- **Quantity produced** in that installation.
- **Direct embedded emissions**: type of determination (actual data, or
  default where allowed), applicable reporting methodology, **specific direct
  embedded emissions** (tCO2e per tonne of good).
- **Indirect embedded emissions** (not for electricity as a good):
  **electricity consumed** (MWh per tonne), **source of electricity**
  ("auto-produced", "(bilateral) power purchase agreement", "received from the
  grid"), **emission factor** (tCO2 per MWh) and its source.
- **Production method** (and steel mill ID for steel) and **emissions
  qualifying parameters**.
- **Supporting documents** and **carbon price due** in the country of
  production (type of instrument, legal act, amount, currency, emissions
  covered).

Formulas stated in the manual:

- Installation direct emissions = goods measure × specific (direct) embedded emissions
- Installation indirect emissions = goods measure × specific (indirect) embedded emissions
- Specific (indirect) embedded emissions = electricity consumed (MWh/t) × emission factor (tCO2/MWh)
- Total emissions = direct + indirect
- Emissions per unit of product = total emissions ÷ goods measure

## D3 — third-country operators

- Operators of non-EU installations may provide data about their facilities,
  including parameters for direct and indirect emissions.
- Declarants share their EORI number with suppliers so the data becomes
  accessible to them; the declarant searches the "Third Country
  Installations registry" from the Emissions tab.
- Declarants remain responsible for the final accuracy of their reports,
  whatever the source of the data.
- Current equivalent (verified on the Commission site): the CBAM Registry
  module **O3CI** lets operators outside the EU upload and share their
  installations and emissions data with declarants, instead of sending it to
  each declarant separately —
  https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-registry_en
