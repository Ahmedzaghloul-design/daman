// A single gold line drawing of landmarks: Egypt → trade route → Europe and
// the UK → (faded) the wider world Daman plans to reach. Decorative only.
// Every shape uses pathLength="1" so the CSS ".draw" animation can trace it.

const crenels = (x, y, count, w = 8) => {
  let d = `M${x} ${y}`;
  for (let i = 0; i < count; i++) d += ` v-6 h${w} v6 h${w}`;
  return d;
};
const arches = (x, y, count, w, h) => {
  let d = "";
  for (let i = 0; i < count; i++) {
    const ax = x + i * w;
    d += `M${ax + 2} ${y} v-${h * 0.55} a${(w - 4) / 2} ${(w - 4) / 2} 0 0 1 ${w - 4} 0 v${h * 0.55} `;
  }
  return d;
};

// Each landmark: paths drawn relative to a 1700 × 150 canvas, baseline y = 140.
const EGYPT = [
  { name: "Pyramids of Giza", d: "M20 140 L95 52 L170 140 M95 52 L118 140 M128 140 L176 84 L224 140 M176 84 L188 140 M200 140 L236 100 L272 140" },
  { name: "Cairo Tower", d: "M302 140 L306 52 M322 140 L318 52 M306 70 L318 64 M306 90 L318 84 M306 110 L318 104 M306 130 L318 124 M296 52 H328 L324 40 H300 Z M312 40 V8" },
  { name: "Citadel of Qaitbay", d: `M352 140 V104 H484 V140 ${crenels(352, 104, 8, 8.25)} M398 104 V72 H438 V104 ${crenels(398, 72, 2, 10)} M458 104 V60 H468 V104 M463 60 V48 M410 140 V124 a8 8 0 0 1 16 0 V140` },
  { name: "Suez Canal ship", d: "M508 128 H628 L618 140 H518 Z M520 128 V116 H544 V128 M546 128 V112 H570 V128 M572 128 V116 H596 V128 M600 128 V100 H612 V128 M494 146 Q520 142 546 146 T598 146 T650 146" },
];
const ROUTE = { d: "M664 96 C700 40 760 40 796 96" };
const EUROPE = [
  { name: "Colosseum", d: `M812 140 V82 Q882 66 952 82 V140 M812 110 H952 M812 94 H952 ${arches(812, 140, 7, 20, 30)}` },
  { name: "Eiffel Tower", d: "M980 140 Q1004 106 1010 66 L1016 16 L1022 66 Q1028 106 1052 140 M992 140 Q1016 116 1040 140 M1000 110 H1032 M1007 72 H1025 M1016 16 V6" },
  { name: "Brandenburg Gate", d: "M1080 140 V82 M1098 140 V82 M1116 140 V82 M1134 140 V82 M1152 140 V82 M1170 140 V82 M1074 82 H1176 V72 H1074 Z M1094 72 V62 H1156 V72 M1114 62 l8 -12 l8 12 M1118 50 h8" },
  { name: "Elizabeth Tower", d: "M1206 140 V48 H1234 V140 M1220 66 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M1220 66 V60 M1220 66 L1225 69 M1206 48 L1220 14 L1234 48 M1220 14 V4" },
  { name: "Rotterdam cranes", d: "M1270 140 V44 M1262 140 L1270 116 L1278 140 M1250 44 H1338 M1270 44 L1300 30 L1338 44 M1326 44 V84 M1320 84 H1332 V92 H1320 Z" },
];
const WORLD = [
  { name: "Hassan II Mosque minaret (Morocco)", d: "M1382 140 V44 H1402 V140 M1378 44 H1406 V36 H1378 Z M1388 36 V24 H1396 V36 M1392 24 V14" },
  { name: "Kingdom Centre (Saudi Arabia)", d: "M1432 140 L1444 30 Q1462 64 1480 30 L1492 140 M1450 56 H1474" },
  { name: "Galata Tower (Türkiye)", d: "M1522 140 V60 H1550 V140 M1518 60 H1554 M1522 60 L1536 24 L1550 60 M1536 24 V14 M1530 80 V92 M1542 80 V92" },
  { name: "Gateway of India", d: "M1580 140 V70 H1680 V140 M1612 140 V104 a18 18 0 0 1 36 0 V140 M1580 70 V58 H1600 V70 M1660 70 V58 H1680 V70 M1590 58 q0 -10 0 -12 M1670 58 q0 -10 0 -12" },
];

export default function LandmarkSkyline({ tone = "light", className = "" }) {
  const egypt = tone === "dark" ? "#c8963e" : "#875f1c";
  const europe = tone === "dark" ? "#a9bfc3" : "#0e5e6f";
  const future = tone === "dark" ? "#a9bfc3" : "#6b6152";
  const shape = (l, color, extra = {}) => (
    <path key={l.name} d={l.d} pathLength="1" stroke={color} {...extra}>
      <title>{l.name}</title>
    </path>
  );
  return (
    <svg
      viewBox="0 0 1700 150"
      className={`draw w-full ${className}`}
      fill="none"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
    >
      {EGYPT.map((l) => shape(l, egypt))}
      <path d={ROUTE.d} pathLength="1" stroke={egypt} style={{ strokeDasharray: "0.04 0.03", strokeDashoffset: 0 }} />
      {EUROPE.map((l) => shape(l, europe))}
      <g opacity="0.5">{WORLD.map((l) => shape(l, future))}</g>
      <path d="M0 140 H1700" pathLength="1" stroke={egypt} strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
