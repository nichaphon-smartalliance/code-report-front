"use client";

import { useI18n } from "@/context/i18n";

/**
 * The screen's heading. Shed out of `NewReportForm.tsx` by TASK-010 — the
 * element, its classes and its copy key moved verbatim.
 */
export function NewReportHeader() {
  const { t } = useI18n();
  return (
    <h1 className="m-0 font-display text-2xl font-semibold text-ink">
      {t("reports.new.heading")}
    </h1>
  );
}
