import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { IMAGES } from "../data/images.js";

/**
 * A site photo with an "Illustrative image" label when it is AI-generated.
 * Renders nothing if the file is missing, so the layout never shows a broken image.
 */
export default function Photo({ name, className = "", aspect = "aspect-[16/9]" }) {
  const { lang, t } = useLanguage();
  const [missing, setMissing] = useState(false);
  const img = IMAGES[name];
  if (!img || missing) return null;
  return (
    <figure className={`reveal relative overflow-hidden rounded-panel bg-sand ${aspect} ${className}`}>
      <img
        src={img.src}
        alt={img.alt[lang] ?? img.alt.en}
        loading="lazy"
        decoding="async"
        onError={() => setMissing(true)}
        className="h-full w-full object-cover"
      />
      {img.illustrative && (
        <figcaption className="absolute bottom-3 start-3 rounded-tag bg-nile-deep/80 px-2 py-1 font-mono text-[11px] text-on-nile">
          {t("illustrative")}
        </figcaption>
      )}
    </figure>
  );
}
