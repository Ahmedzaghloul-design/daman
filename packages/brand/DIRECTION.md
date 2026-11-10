# Daman brand direction

Derived from the product, not from trends (method: unslop by Damir Sokolovsky,
CC BY 4.0). Decided in Phase 1, 2026-11-10.

- **Product.** Daman turns handwritten Arabic fuel and energy receipts from
  Egyptian factories into an audit-ready emissions ledger that EU buyers can
  rely on.
- **Character.** Exact, accountable, grounded.
- **World.** The weighbridge office of an Egyptian heavy-industry plant:
  carbon-copy receipt books, rubber stamps, ruled ledger paper, the Nile and
  the desert outside. Paper, ink and gold, not neon and glass.
- **Moments.** (1) A handwritten receipt turning into a clean ledger row, the
  core of the product, shown in the website hero and the live demo.
  (2) The gold approval seal landing on a verified entry.
- **Signature.** The gold check seal from the logo. It marks every
  human-approved entry, in the program and on the website, and is used only
  for things a person actually approved.

## Logo: "The Stamped Receipt" (concept 04)

| Part | Meaning |
| --- | --- |
| Two stacked receipts | The carbon-copy receipt books used on Egyptian plant floors |
| Square Kufic ض | First letter of ضمان (guarantee), in a calligraphy style born in the Arab world |
| Ledger lines | The record, written down |
| Gold check seal | A human reviewer approved it |

- Source of truth: `logo/mark.js`. Generated files: `logo/*.svg` and
  `brand-sheet.html` (`npm run build -w @daman/brand`).
- Two forms: the **3D logo** (website hero, presentations; interactive) and
  the **flat logo** (documents, program). Browser tabs and app icons use the
  **simplified icon**: the Kufic ض with its dot in gold.
- Never redraw the logo by hand in a component; import the layers from
  `logo/mark.js`.
- Not used, on purpose: the EU flag stars, so Daman never looks like an
  official EU body.

## Palette: Nile & desert gold

| Role | Color | Rule |
| --- | --- | --- |
| Brand | Nile teal `#0E5E6F` | Primary actions, logo; white text on it 7.4:1 |
| Dark areas | Deep Nile `#073640` | Program sidebar, dark website sections |
| Accent | Desert gold `#C8963E` | Logo and decorative highlights only (too light for text on cream) |
| Gold text | Dark gold `#875F1C` | When text must be gold (5.0:1 on cream) |
| Background | Cream `#F6F0E4`, card `#FCF8F0`, raised sand `#EDE3D1` | |
| Status | Verified `#146C37`, needs review `#9A4A0A`, anomaly `#B91C1C` | Meaning only, never decoration |

All text pairs meet WCAG 4.5:1. Tokens live in `tokens.css`.

## Motion

Slow and purposeful: counting numbers, a receipt being read line by line, the
seal pressing down, the 3D logo turning toward the pointer. One easing curve
(`cubic-bezier(0.22, 1, 0.36, 1)`). Nothing bounces, glows or pulses for
attention, and everything respects "reduce motion" settings.
