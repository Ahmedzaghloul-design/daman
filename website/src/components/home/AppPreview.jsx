import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { APP_URL } from "../Nav.jsx";
import { buttonClass, Container, SectionHeading } from "../ui.jsx";

// A live, code-drawn preview of the dark app dashboard (demo numbers, labelled).
// Uses the app's dark palette locally so the website shows the real look.
const D = { bg: "#071a1f", card: "#0d252c", raised: "#133139", line: "rgba(255,255,255,.07)", text: "#e9f0f1", text2: "#9fb6bb", nile: "#2aa6b8", gold: "#d4a24c", ok: "#3fbf7f", warn: "#e0a43a", bad: "#ef6b6b" };

function Spark() {
  return (
    <svg viewBox="0 0 200 50" className="w-full" preserveAspectRatio="none" style={{ height: 56 }} aria-hidden="true">
      <defs><linearGradient id="ap-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={D.nile} stopOpacity=".35" /><stop offset="1" stopColor={D.nile} stopOpacity="0" /></linearGradient></defs>
      <path d="M0 40 C25 30 35 34 55 24 S85 8 105 16 S135 38 155 22 S185 8 200 12 V50 H0Z" fill="url(#ap-g)" />
      <path d="M0 40 C25 30 35 34 55 24 S85 8 105 16 S135 38 155 22 S185 8 200 12" fill="none" stroke={D.nile} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
function Ring({ v }) {
  const c = 2 * Math.PI * 30;
  return (
    <svg viewBox="0 0 80 80" width="76" height="76" aria-hidden="true">
      <circle cx="40" cy="40" r="30" fill="none" stroke={D.raised} strokeWidth="8" />
      <circle cx="40" cy="40" r="30" fill="none" stroke={D.ok} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} transform="rotate(-90 40 40)" />
      <text x="40" y="45" textAnchor="middle" fontSize="15" fontWeight="700" fill={D.text}>{Math.round(v * 100)}%</text>
    </svg>
  );
}

export default function AppPreview() {
  const { t } = useLanguage();
  const cols = t("appPreview.cols");
  const card = { background: D.card, border: `1px solid ${D.line}`, borderRadius: 16 };
  return (
    <section className="py-24">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <SectionHeading kicker={t("appPreview.kicker")} title={t("appPreview.title")} intro={t("appPreview.body")} />
          <a href={APP_URL} className={buttonClass("primary", "reveal mt-8")}>{t("appPreview.cta")}</a>
        </div>
        <div className="reveal relative rounded-[24px] p-3 shadow-float sm:p-4" style={{ background: D.bg }} dir="ltr">
          <span className="absolute end-5 top-5 z-10 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: D.raised, color: D.text2 }}>{t("appPreview.demo")}</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="overflow-hidden p-4" style={card}>
              <p className="text-xs" style={{ color: D.text2 }}>{t("appPreview.kpi1")}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: D.text }}>21,708 <span className="text-sm font-medium" style={{ color: D.text2 }}>tCO2e</span></p>
              <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "rgba(63,191,127,.14)", color: D.ok }}>−49.9% {t("appPreview.vsDefault")}</span>
              <div className="-mx-4 -mb-4 mt-2"><Spark /></div>
            </div>
            <div className="flex items-center justify-between gap-3 p-4" style={card}>
              <div>
                <p className="text-xs" style={{ color: D.text2 }}>{t("appPreview.kpi2")}</p>
                <p className="mt-2 text-xs" style={{ color: D.text2 }}>{t("appPreview.kpi3")}</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: D.text }}>8</p>
                <p className="mt-2 text-xs" style={{ color: D.text2 }}>{t("appPreview.kpi4")}</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: D.gold }}>€2.08M</p>
              </div>
              <Ring v={0.97} />
            </div>
            <div className="p-4 sm:col-span-2" style={card}>
              <p className="text-sm font-semibold" style={{ color: D.text }}>{t("appPreview.table")}</p>
              <table className="mt-2 w-full text-[13px]">
                <thead><tr style={{ color: D.text2 }}>{cols.map((c, i) => <th key={c} className={`py-2 font-medium ${i === 3 ? "text-end" : "text-start"}`} style={{ borderBottom: `1px solid ${D.line}` }}>{c}</th>)}</tr></thead>
                <tbody style={{ color: D.text }}>
                  <tr>
                    <td className="py-2.5" style={{ borderBottom: `1px solid ${D.line}` }}><span className="font-mono text-xs" style={{ color: D.nile }}>2523 10 00 90</span><br /><span className="text-xs" style={{ color: D.text2 }}>Grey clinker</span></td>
                    <td className="tabular-nums" style={{ borderBottom: `1px solid ${D.line}` }}>8,000 t</td>
                    <td style={{ borderBottom: `1px solid ${D.line}` }}><span className="inline-block h-1.5 w-16 rounded-full align-middle" style={{ background: D.ok }} /> <span className="text-xs" style={{ color: D.text2 }}>100%</span></td>
                    <td className="text-end font-semibold tabular-nums" style={{ borderBottom: `1px solid ${D.line}` }}>0.7004</td>
                  </tr>
                  <tr>
                    <td className="py-2.5"><span className="font-mono text-xs" style={{ color: D.nile }}>2523 29 00</span><br /><span className="text-xs" style={{ color: D.text2 }}>Grey Portland cement</span></td>
                    <td className="tabular-nums">25,000 t</td>
                    <td className="text-xs" style={{ color: D.warn }}>{t("appPreview.incomplete")}</td>
                    <td className="text-end font-semibold tabular-nums">0.0188</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
