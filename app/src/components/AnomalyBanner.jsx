import { useLanguage } from "../i18n/LanguageContext.jsx";
import { fmt, Num } from "./ui.jsx";

/**
 * Red banner shown when the scanned energy input does not match declared
 * production. Numbers come from the deterministic check (@daman/core/massBalance.js);
 * the reasoning text comes from Gemini.
 */
export default function AnomalyBanner({ deterministic, llm, llmStale }) {
  const { t } = useLanguage();
  const d = deterministic ?? {};

  return (
    <div role="alert" className="rounded-sm border border-red-700 bg-white">
      <div className="flex items-center gap-3 bg-red-700 px-4 py-2 text-white">
        <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-sm bg-white font-mono text-sm font-bold text-red-700">
          !
        </span>
        <p className="text-sm font-semibold uppercase tracking-wider">{t("anomaly.title")}</p>
        {llm?.severity && llm.severity !== "NONE" && (
          <span className="ms-auto font-mono text-xs">
            {t("anomaly.severity")}: {llm.severity}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm text-red-700">{t("anomaly.body")}</p>
        {d.evaluated ? (
          <dl className="mt-3 grid grid-cols-1 gap-px border border-slate-300 bg-slate-300 sm:grid-cols-3">
            <div className="bg-white px-3 py-2">
              <dt className="text-xs text-slate-600">{t("anomaly.intensity")}</dt>
              <dd>
                <Num className="text-lg font-semibold text-red-700">
                  {fmt(d.intensity, 2)} {d.intensityUnit}
                </Num>
              </dd>
            </div>
            <div className="bg-white px-3 py-2">
              <dt className="text-xs text-slate-600">{t("anomaly.expected")}</dt>
              <dd>
                <Num className="text-lg font-semibold text-slate-900">
                  {fmt(d.expectedMin, 0)}–{fmt(d.expectedMax, 0)} {d.intensityUnit}
                </Num>
              </dd>
            </div>
            <div className="bg-white px-3 py-2">
              <dt className="text-xs text-slate-600">{t("anomaly.deviation")}</dt>
              <dd>
                <Num className="text-lg font-semibold text-red-700">
                  {d.deviationPct > 0 ? "+" : ""}
                  {fmt(d.deviationPct, 1)}%
                </Num>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 font-mono text-xs text-slate-600">{t("anomaly.notEvaluated")}</p>
        )}
        {llm?.reasoning && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">{t("anomaly.reasoning")}</p>
            <p dir="ltr" className={`mt-1 text-start text-sm leading-relaxed ${llmStale ? "text-slate-400 line-through" : "text-slate-700"}`}>
              {llm.reasoning}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
