// English website copy. Every regulatory statement maps to a verified fact in
// docs/DAMAN_V2_SPEC.md §4 (noted as [F#]). Do not add facts here without
// adding them to the spec with a source first.

export const en = {
  langSwitch: "العربية",
  common: {
    skip: "Skip to content",
  },
  meta: {
    home: { title: "Daman — Verified carbon data for Egyptian exporters", description: "Daman turns handwritten Arabic fuel and energy receipts from Egyptian factories into verified emissions data for EU CBAM, so exports are priced on real emissions, not default values." },
    story: { title: "Our story — Daman", description: "Why Daman exists: Egyptian factories keep handwritten Arabic energy records, and EU CBAM needs verified emissions data. Built by students at The American University in Cairo." },
    how: { title: "How we calculate — Daman", description: "Step by step: how Daman reads a receipt, calculates emissions, checks them against production and keeps a human sign-off on every entry." },
    tools: { title: "CBAM cost estimate — Daman", description: "Estimate what EU buyers pay on CBAM default values for common Egyptian exports, using the official EU default values and certificate price." },
    notFound: { title: "Page not found — Daman", description: "This page does not exist. Go back to the Daman home page." },
  },
  nav: {
    homeHint: "(home page)",
    product: "How it works",
    calculate: "How we calculate",
    story: "Our story",
    pricing: "Pricing",
    tools: "CBAM tools",
    login: "Log in",
    demo: "Request a demo",
    menu: "Menu",
    close: "Close",
  },

  hero: {
    eyebrow: "EU CBAM definitive period · in force since 1 January 2026", // [F2]
    title: "The analog-to-digital bridge for EU CBAM compliance.",
    subtitle:
      "Daman reads the handwritten Arabic fuel and energy records of Egyptian factories and turns them into verified emissions data for your EU buyers, so your exports are priced on your real emissions, not on marked-up default values.",
    primary: "Request a demo",
    secondary: "See how we calculate",
    globeHint: "Drag the globe",
    legend: { now: "Now: Egypt to the EU", uk: "From 2027: UK CBAM", next: "Next: MENA, Africa and Asia" },
  },

  globe: {
    label: "Interactive globe showing Daman's trade routes from Egypt to Europe, the UK from 2027, and planned regions",
    cities: {
      cairo: "Cairo · Pyramids of Giza, Cairo Tower",
      alexandria: "Alexandria · Citadel of Qaitbay",
      suez: "Suez Canal",
      rotterdam: "Rotterdam · port of entry to the EU",
      berlin: "Berlin · Brandenburg Gate",
      paris: "Paris · Eiffel Tower",
      rome: "Rome · Colosseum",
      london: "London · UK CBAM from 1 January 2027",
      casablanca: "Morocco · planned region",
      riyadh: "Saudi Arabia · planned region",
      istanbul: "Türkiye · planned region",
      mumbai: "India · planned region",
      johannesburg: "South Africa · planned region",
    },
  },

  timeline: {
    kicker: "The mandate",
    title: "What changes, and when",
    intro:
      "CBAM puts a carbon price on six kinds of goods entering the EU: cement, iron and steel, aluminium, fertilisers, electricity and hydrogen. The EU importer declares and pays; the data comes from you, the producer.", // [F1][F10]
    items: [
      { date: "1 Jan 2026", title: "Definitive period begins", body: "CBAM moves from reporting only to financial obligations.", tag: "In force" }, // [F2]
      { date: "31 Mar 2026", title: "Importer authorisation deadline", body: "Importers bringing in more than 50 tonnes a year, and all electricity and hydrogen, need a CBAM authorisation or application reference.", tag: "In force" }, // [F11][F7]
      { date: "1 Jan 2027", title: "UK CBAM starts", body: "The UK applies its own CBAM to aluminium, cement, fertiliser, hydrogen, and iron and steel.", tag: "Legislated" }, // [F16]
      { date: "1 Feb 2027", title: "CBAM certificate sales open", body: "EU importers can start buying the certificates that cover embedded emissions.", tag: "Scheduled" }, // [F8]
      { date: "30 Sep 2027", title: "First annual CBAM declaration", body: "Importers declare 2026 imports and surrender certificates, then every 30 September.", tag: "Scheduled" }, // [F12]
      { date: "1 Jan 2028", title: "Downstream products (proposed)", body: "A proposal would add about 180 downstream steel and aluminium products. It is still being negotiated.", tag: "Proposed" }, // [F9]
    ],
    markup: {
      title: "The cost of not having real data",
      body: "When verified installation data is missing, a default value applies. For most sectors that default carries a mark-up that rises every year.", // [F3][F6]
      sectors: { metals: "Steel, cement, aluminium, hydrogen", fertilisers: "Fertilisers", electricity: "Electricity" },
      years: ["2026", "2027", "2028+"],
      note: "Mark-up added on top of the default emission value. Source: Implementing Regulation (EU) 2025/2621.", // [F3][F4]
      cta: "Estimate the cost for your product",
    },
  },

  problem: {
    kicker: "The problem",
    title: "The data exists. It's on paper, in Arabic.",
    items: [
      { title: "Defaults cost margin", body: "Without verified data, your buyer declares conservative default values with a mark-up, and that cost comes back to you in price negotiations." },
      { title: "Records are often handwritten", body: "Fuel, electricity and delivery records on Egyptian plant floors are often handwritten in Arabic, and paper can't be audited as it is." },
      { title: "Typical tools expect digital data", body: "Carbon-accounting tools usually expect structured digital inputs, not photos of handwritten Arabic receipts." },
    ],
  },

  o3ci: {
    kicker: "Share once",
    title: "Your data, ready for the EU's operator registry",
    body: "The EU's CBAM Registry has a module for producers outside the EU, called O3CI. Factories upload their installation and emissions data once and share it with every EU importer, instead of sending it to each buyer separately. Daman is built to prepare exactly that data from your receipts.", // [F13]
    points: [
      "Installation details: location, operator, production method",
      "Direct emissions from fuels, per tonne of product",
      "Indirect emissions from electricity, with its source",
      "Every value traced to an approved source document",
    ], // [F14]
    note: "Daman prepares the data. Uploading it to O3CI is done by the operator.",
  },

  pipeline: {
    kicker: "How it works",
    title: "From a photo to a verified record",
    steps: [
      { title: "Photograph", body: "Site staff photograph the handwritten receipt or delivery note in the app, or send it on WhatsApp." },
      { title: "Read", body: "Gemini reads the Arabic text from the photo, digits included. A digit it cannot read is marked, never guessed." },
      { title: "Structure and check", body: "Gemini maps it to English fields; plain code double-checks every number and tests it against your production." },
      { title: "Human approval", body: "Anything uncertain goes to a named reviewer. Nothing enters the ledger without a person's sign-off." },
      { title: "Verified ledger", body: "Approved entries become a clean English record, ready for your buyers and the registry." },
    ],
    status: "Prototype: photos are read with Gemini today; a dedicated Arabic handwriting model is planned.",
  },

  demo: {
    kicker: "Live demo",
    title: "Watch a receipt become data",
    intro: "Pick a sample receipt. These are real responses from Daman's audit service, recorded so this page works without using a live API.",
    samples: ["Diesel delivery", "Electricity bill", "Unclear handwriting"],
    run: "Run",
    replay: "Run again",
    stages: { raw: "Raw text from the receipt", digits: "Digits normalised", fields: "Structured record", check: "Checks", decision: "Decision" },
    fields: { factory_name: "Factory", energy_type: "Energy", volume: "Quantity", unit: "Unit", date: "Date", confidence_score: "Confidence" },
    reasons: {
      anomaly: "Flagged by the mass-balance and consistency check",
      lowConfidence: "Model confidence below 0.85",
      modelFlag: "Model asked for a human check",
      missingField: "A field is missing or unreadable",
      invalidDate: "Date is missing or unreadable",
      illegibleDigits: "Illegible digit in the source, so the number may be guessed",
    },
    intensity: "{value} {unit} against a plant benchmark of {min}–{max}",
    decisionReview: "Sent to a human reviewer",
    decisionClear: "Ready for sign-off",
    recorded: "Recorded {date} · model {model} · sample data",
  },

  anyFactory: {
    kicker: "Beyond the six sectors",
    title: "Built for any factory that burns fuel or uses power",
    body: "Daman reads energy records from any factory: textiles, food, chemicals, glass, ceramics and more. For goods covered by CBAM it produces the data your EU buyers need for their filings. For everyone else it answers EU buyers' emissions questions and prepares you for the proposed 2028 expansion.",
    cbam: "Covered by CBAM now",
    other: "Buyer emissions requests",
    cbamSectors: ["Cement", "Iron and steel", "Aluminium", "Fertilisers", "Electricity", "Hydrogen"],
    otherSectors: ["Textiles", "Food and beverages", "Chemicals", "Glass", "Ceramics", "Paper"],
  },

  trust: {
    kicker: "Why you can trust the numbers",
    title: "AI reads. Code calculates. A person approves.",
    items: [
      { title: "No black box", body: "Every emission figure is plain arithmetic you can redo by hand, shown step by step." },
      { title: "Every number has a source", body: "Each ledger line keeps the text read from its receipt, the source file name and the person who approved it." },
      { title: "Uncertainty is flagged, never hidden", body: "Low confidence, unreadable digits and mass-balance gaps always go to a human." },
      { title: "Honest about our role", body: "Daman prepares data. It is not an accredited CBAM verifier, and we say so." },
    ],
    cta: "See exactly how we calculate",
  },

  pricing: {
    kicker: "Pricing",
    title: "Priced as compliance insurance",
    subtitle: "A fixed monthly cost set against an open-ended default-value exposure.",
    perMonth: "per installation, per month",
    recommended: "Recommended",
    cta: "Request a demo",
    note: "Indicative pricing, confirmed after a site assessment.",
    tiers: [
      { name: "Standard", price: "$1,000", desc: "For a single installation starting CBAM data collection.", features: ["Receipt and manifest reading", "Arabic-to-English structured ledger", "Mass-balance checks", "Human review queue", "CSV export"] },
      { name: "Assured", price: "$1,500", desc: "For installations preparing for third-party verification.", features: ["Everything in Standard", "Evidence pack per reporting period (planned)", "Registry-ready installation data", "Multiple reviewer roles and sign-off log", "On-site onboarding for plant staff (planned)"] },
    ],
  },

  faq: {
    kicker: "Questions",
    title: "Frequently asked",
    items: [
      { q: "Who has to declare CBAM: me or my buyer?", a: "Your EU buyer (the importer or their customs representative) declares and buys certificates. You supply the emissions data for your installation. Daman prepares that data." }, // [F10][F11]
      { q: "What happens if my buyer has no real data from me?", a: "They can legally declare default values instead. For steel, cement, aluminium and hydrogen those defaults carry a mark-up of 10% in 2026, 20% in 2027 and 30% from 2028. Fertilisers carry 1%, electricity none." }, // [F3][F4][F6]
      { q: "When is the first CBAM declaration due?", a: "By 30 September 2027, covering goods imported during 2026, and every 30 September after that." }, // [F12]
      { q: "My buyer imports less than 50 tonnes a year. Does CBAM apply?", a: "Importers below 50 tonnes of CBAM goods per calendar year are exempt, except for electricity and hydrogen. The threshold applies to the importer's yearly total, so check with your buyer." }, // [F7][F11]
      { q: "Does this only matter for the EU?", a: "No. The UK applies its own CBAM from 1 January 2027 to aluminium, cement, fertiliser, hydrogen, and iron and steel." }, // [F16]
      { q: "Is Daman an accredited verifier?", a: "No. Daman prepares and checks your data and keeps the evidence trail. Verification is done by an accredited body." },
    ],
    disclaimer: "General information, not legal advice. Last checked 10 November 2026.",
  },

  form: {
    title: "Request a demonstration",
    body: "Tell us about your installation. We'll walk you through Daman using sample records from your sector.",
    name: "Full name",
    company: "Company",
    email: "Work email",
    sector: "Sector",
    submit: "Send request",
    success: "Thank you. This is a prototype, so nothing was sent yet.",
    sectors: ["Cement", "Iron and steel", "Aluminium", "Fertilisers", "Other"],
  },

  footer: {
    tagline: "From the factory floor to the EU ledger.",
    disclaimer: "Daman prepares emissions data. It is not an accredited CBAM verifier. Images marked illustrative are AI-generated.",
    built: "Built by students at the American University in Cairo.",
    rights: "© 2026 Daman. Cairo, Egypt.",
    links: { story: "Our story", calculate: "How we calculate", app: "Open the program" },
  },

  story: {
    kicker: "Our story",
    title: "ضمان means guarantee.",
    lead: "We named the company after the one thing a factory owner needs from compliance data: the certainty that the number is right.",
    chapters: [
      { title: "It started with a receipt book", body: "Walk into the weighbridge office of many Egyptian cement or steel plants and you'll often find carbon-copy receipt books: diesel deliveries, gas readings, electricity, all written by hand in Arabic. That paper is often the most detailed record of a plant's energy use. But on paper, it rarely reaches the systems EU buyers use for compliance." },
      { title: "Then the rules changed", body: "Since 1 January 2026, EU importers of CBAM goods carry a real carbon cost. If they can't get verified data from the producer, they use default values with a mark-up that rises to 30% by 2028 for most sectors. For an Egyptian exporter, that's margin lost on paper they already have." },
      { title: "So we built the bridge", body: "Daman reads the paper, structures it, checks it against what the plant actually produced, and puts a person in charge of every approval. The result is data an EU buyer can rely on, traceable back to the original receipt." },
    ],
    principlesTitle: "What we won't compromise on",
    principles: ["Real data over defaults", "Every number traceable to its source", "A human approves every entry", "Honest about what we are and aren't"],
    roadmapKicker: "Where we're going",
    roadmapTitle: "Egypt is where we start, not where we stop",
    roadmapBody: "Carbon border measures are spreading. The EU's CBAM is in force, and the UK starts its own in 2027. Every exporter selling carbon-intensive goods into those markets faces the same paper problem.", // [F2][F16]
    roadmap: [
      { stage: "Now", title: "Egypt", body: "Cement, steel, fertiliser and aluminium exporters selling to the EU." },
      { stage: "Next", title: "The rest of MENA", body: "Exporters across the Middle East and North Africa, where Arabic records are the norm." },
      { stage: "From 2027", title: "The UK market", body: "Producers selling into the UK under the UK CBAM, alongside the EU." },
      { stage: "Later", title: "Africa and Asia", body: "Emerging-market exporters of CBAM goods, in their own languages and record formats." },
    ],
    roadmapNote: "These are our plans, not current customers.",
    teamTitle: "Who we are",
    teamBody: "Daman is being built by students at the American University in Cairo who saw the gap between how Egyptian plants keep records and what European regulation now demands.",
  },

  calc: {
    kicker: "How we calculate",
    title: "Every number, step by step",
    lead: "Change any value below and watch each step recalculate. This is the same code Daman runs on every receipt.",
    rule: "AI reads and explains. Code calculates. A person approves.",
    illustrative: "Illustrative factor for this demonstration. Real filings use values agreed with your verifier.",
    s1: { title: "Read the receipt", body: "The receipt text is read and Arabic-Indic digits are converted to Western digits.", input: "Receipt text" },
    s2: { title: "Structure the record", body: "Gemini maps the text to fields. Code then checks them; uncertain values go to a person." },
    s3: { title: "Direct emissions from fuel", body: "Quantity of fuel × emission factor = kilograms of CO2.", qty: "Fuel quantity", fuel: "Fuel", factor: "Emission factor" },
    s4: { title: "Indirect emissions from electricity", body: "Electricity used × grid emission factor. The EU records whether power came from the grid, your own plant or a purchase agreement.", mwh: "Electricity (MWh)", factor: "Emission factor (tCO2/MWh)", source: "Source of electricity", sources: ["Received from the grid", "Auto-produced", "Power purchase agreement"] }, // [F14]
    s5: { title: "Per tonne of product", body: "Total emissions ÷ tonnes produced = specific embedded emissions, the number the EU asks for.", tonnes: "Tonnes produced" }, // [F14]
    s6: { title: "Mass-balance check", body: "Fuel used per tonne is compared with the plant's normal range. Outside the range, a person must explain it before approval.", min: "Benchmark min", max: "Benchmark max", ok: "Within the plant's normal range", flag: "Outside the normal range: sent for human review" },
    result: { direct: "Direct", indirect: "Indirect", total: "Total", perTonne: "Per tonne" },
    source: "Formulas follow the EU CBAM Declarant Portal data model (user manual v1.81, §1.9).",
  },

  tools: {
    kicker: "CBAM tools",
    title: "Does CBAM apply to you, and what does it cost?",
    lead: "Two tools built on the official EU files. Every number shows where it comes from.",
    checker: {
      title: "Sector checker",
      body: "Enter the customs (CN) code of what you export, or pick your industry.",
      input: "CN code",
      placeholder: "e.g. 2523 29 00",
      industries: { cement: "Cement", steel: "Iron and steel", aluminium: "Aluminium", fertilisers: "Fertilisers", hydrogen: "Hydrogen", electricity: "Electricity", other: "Something else" },
      covered: "Covered by CBAM now",
      coveredBody: "Your EU buyer must declare the embedded emissions of this product.",
      matches: "Matching CBAM goods",
      proposed: "Possibly covered from 2028 (proposal, not law)",
      proposedBody: "This chapter includes steel and aluminium products in the Commission's proposal to extend CBAM to about 180 downstream goods from 1 January 2028. The list is still being negotiated: check the proposal's annex.",
      notCovered: "Not covered by CBAM",
      notCoveredBody: "CBAM does not apply to this product today. EU buyers may still ask for its emissions, and Daman can prepare them.",
      tooShort: "Enter at least 4 digits.",
      threshold: "Importers bringing in less than 50 tonnes of CBAM goods per year are exempt, except for electricity and hydrogen.",
      basis: "Based on the goods listed in the EU default-values file (every CBAM good except electricity, which is listed separately).",
    },
    calc: {
      title: "Cost calculator (default values)",
      body: "What your EU buyer pays in CBAM certificates when no verified data from you is available, and what real data could change.",
      product: "Product",
      search: "Search by code or name",
      cnChoice: "Exact CN code and production route",
      year: "Import year",
      tonnes: "Tonnes exported per year",
      price: "Certificate price (EUR)",
      quarter: "2026 quarter",
      priceAssumed: "Not yet published for {year}. Using the latest official price ({price} EUR, Q3 2026), held constant.",
      priceOfficial: "Official price for {q} 2026, published {date}.",
      actual: "Your actual emissions, if known (tCO2e per tonne)",
      actualHint: "Optional. Leave empty if you don't know yet.",
      working: "The working",
      rows: {
        table: "Default value table used",
        dv: "Default value",
        markup: "Mark-up for {year}",
        embedded: "Embedded emissions with mark-up",
        factor: "CBAM factor for {year}",
        cscf: "Cross-sectoral correction factor",
        benchmark: "Benchmark (Column B)",
        free: "Free allocation adjustment",
        perTonne: "Certificates per tonne",
        certs: "Certificates needed",
        cost: "Estimated cost",
      },
      units: { perT: "tCO2e/t", certs: "certificates", eur: "EUR" },
      result: "Estimated CBAM cost on default values",
      perTonne: "{value} EUR per tonne",
      gapTitle: "What verified data could change",
      gapBody: "Your figure is {gap} tCO2e per tonne below the marked-up default, worth about {value} EUR a year at this price.",
      gapHigher: "Your figure is above the marked-up default, so verified data would not lower the cost for this product.",
      gapNote: "Approximate. With actual data, free allocation uses a different benchmark (Column A) plus the free allocation embedded in precursors, so the exact saving can be higher or lower.",
      byYear: "Cost by year for the same tonnes and price",
      formula: "Certificates = max(0, default × (1 + mark-up) − CBAM factor × CSCF × benchmark) × tonnes",
      unavailable: { no_default_value: "No default value is published for this product.", unsupported_sector: "This sector is not supported by the calculator.", year_not_supported: "Free-allocation factors are not yet set for this year.", no_benchmark: "Choose the exact CN code and route above." },
      sources: "Sources",
      disclaimer: "Estimate only, not legal or financial advice. The EU Excel files are informative; the binding values are in Implementing Regulations (EU) 2025/2621 (corrected by 2026/1740) and 2025/2620. Your buyer's actual cost also depends on their own declaration.",
      notes: { egypt: "Egypt's own value", other: "No Egypt-specific value is listed, so the 'Other countries and territories' value applies (IR 2025/2621, Annex I)." },
      routeLabel: "route {route}",
      tables: { egypt: "Egypt", other: "Other countries and territories" },
    },
  },

  teaser: {
    kicker: "Estimate your exposure",
    title: "What would your EU buyers pay on default values?",
    lead: "A quick estimate for common Egyptian exports, using the official EU default values and the latest official certificate price. The full calculator, with every CBAM good, your own products and the sector checker, is in the Daman app.",
    product: "Product",
    tonnes: "Tonnes exported to the EU per year",
    year: "Year",
    result: "Estimated CBAM cost on default values",
    perTonne: "{value} EUR per tonne",
    open: "Open the full calculator in the app",
    basis: "EU default value table used: {table}, mark-up {markup}, CBAM factor {factor}, benchmark {benchmark}, price {price} EUR (Q3 2026). Estimate only, not legal or financial advice.",
    tables: { egypt: "Egypt", other: "Other countries and territories" },
    goods: { "2523100090": "Grey clinker", "25232900": "Grey Portland cement", "31021019": "Urea (> 45% N)", "7601": "Unwrought aluminium", "72071114": "Steel billets (semi-finished)" },
  },
  appPreview: {
    kicker: "Inside the app",
    title: "One screen for every product you export",
    body: "Factory teams photograph receipts on their phones; managers see emissions per product, how much is backed by real data, and what their EU buyers would pay. It is built to install to the home screen on iPhone and Android.",
    cta: "Open the app",
    demo: "Demo data",
    kpi1: "Embedded emissions",
    kpi2: "Backed by actual data",
    kpi3: "Receipts approved",
    kpi4: "Buyer cost on defaults",
    table: "Emissions report",
    cols: ["CN code · Product", "Exported", "Actual data", "tCO2e / t"],
    incomplete: "Incomplete",
    vsDefault: "vs EU default",
  },

  notFound: { title: "Page not found", back: "Back to the home page" },
  illustrative: "Illustrative image",
};
