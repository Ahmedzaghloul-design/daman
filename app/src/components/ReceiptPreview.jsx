import { useLanguage } from "../i18n/LanguageContext.jsx";
import { Panel } from "./ui.jsx";

/**
 * Left side of the split-screen review. Shows the uploaded photo when there is
 * one; otherwise renders a mock handwritten Arabic receipt from the OCR text
 * (used for the sample run and for PDFs).
 */
export default function ReceiptPreview({ file, previewUrl, rawText }) {
  const { t } = useLanguage();
  const lines = rawText ? rawText.split(" - ") : [];

  return (
    <Panel
      title={t("review.source")}
      actions={file?.name && <span className="max-w-48 truncate font-mono text-xs text-slate-500">{file.name}</span>}
    >
      <div className="flex justify-center bg-gray-100 p-4">
        {previewUrl ? (
          <img src={previewUrl} alt={t("review.source")} className="max-h-[480px] w-auto border border-slate-300 bg-white object-contain" />
        ) : (
          <div
            dir="rtl"
            lang="ar"
            className="relative w-full max-w-sm -rotate-1 border border-slate-300 bg-white px-6 py-5 font-receipt text-slate-800"
          >
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-2">
              <div>
                <p className="text-xl font-bold">إيصال استلام</p>
                <p className="text-sm">وقود / طاقة</p>
              </div>
              <p className="text-sm">رقم ٠٠٤٧١</p>
            </div>
            <div className="mt-3 space-y-1">
              {(lines.length ? lines : ["..."]).map((line, i) => (
                <p key={i} className="border-b border-slate-300 py-1.5 text-xl leading-relaxed">
                  {line}
                </p>
              ))}
              <p className="border-b border-slate-300 py-1.5 text-xl leading-relaxed">التوقيع: ________</p>
            </div>
            <div
              aria-hidden="true"
              className="absolute bottom-6 left-6 flex h-20 w-20 rotate-12 items-center justify-center rounded-full border-2 border-red-700 text-center text-sm font-bold text-red-700"
            >
              مُستلَم
            </div>
          </div>
        )}
      </div>
      {rawText && (
        <div className="border-t border-slate-300 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">{t("review.rawOcr")}</p>
          <p dir="rtl" lang="ar" className="mt-2 rounded-sm border border-slate-300 bg-gray-50 p-3 font-mono text-sm leading-relaxed text-slate-800">
            {rawText}
          </p>
        </div>
      )}
    </Panel>
  );
}
