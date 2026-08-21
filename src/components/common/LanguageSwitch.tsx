"use client";

import { Box, SegmentedControl } from "@mantine/core";
import { isLanguage, LANGUAGES } from "@/constant/text";
import { useI18n } from "@/context/i18n";

/**
 * The UI language switch (TASK-006 item 2, rebuilt Mantine-first by TASK-011).
 *
 * `SegmentedControl` renders real radio inputs, so it still works by tap, by
 * click and by keyboard arrow keys, and it is still never hover-only. The
 * `fieldset` + visually-hidden `legend` around it is what names the group for a
 * screen reader — Mantine's root is a plain `div` and would announce nothing.
 *
 * The chosen language is what every request sends as `Accept-Language`
 * (SPEC-002 behaviour freeze item 9). Unchanged by the redesign.
 */
export function LanguageSwitch() {
  const { language, setLanguage, t } = useI18n();

  return (
    <Box component="fieldset" className="m-0 border-0 p-0">
      <Box component="legend" className="sr-only">
        {t("header.languageLabel")}
      </Box>
      <SegmentedControl
        className="cr-seg"
        name="ui-language"
        value={language}
        onChange={(value) => {
          if (isLanguage(value)) setLanguage(value);
        }}
        data={LANGUAGES.map((code) => ({
          value: code,
          // The full language name stays on `title`, exactly as TASK-006 had
          // it — it is a supplement to the visible TH/EN, never the only cue.
          label: <span title={t(`header.language.${code}`)}>{t(`header.language.${code}.short`)}</span>,
        }))}
      />
    </Box>
  );
}
