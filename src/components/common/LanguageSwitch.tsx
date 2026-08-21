"use client";

import { LANGUAGES, type Language } from "@/constant/text";
import { useI18n } from "@/context/i18n";

/**
 * The UI language switch (TASK-006 item 2). Two real radio inputs in a
 * fieldset: it works by tap, by click and by keyboard arrow keys, and it is
 * never hover-only. The chosen language is what every request sends as
 * `Accept-Language`.
 */
export function LanguageSwitch() {
  const { language, setLanguage, t } = useI18n();

  return (
    <fieldset className="cr-segmented m-0 border-solid p-0">
      <legend className="sr-only">{t("header.languageLabel")}</legend>
      {LANGUAGES.map((code: Language) => {
        const checked = code === language;
        return (
          <label key={code} title={t(`header.language.${code}`)}>
            <input
              type="radio"
              name="ui-language"
              value={code}
              checked={checked}
              onChange={() => setLanguage(code)}
            />
            <span aria-hidden={false}>{t(`header.language.${code}.short`)}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
