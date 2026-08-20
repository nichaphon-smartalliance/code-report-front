"use client";

import { use } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * PLACEHOLDER — the report view is **TASK-008's** deliverable (polling,
 * progress, sanitized Markdown). Nothing of it is started here.
 *
 * This route exists for the same reason TASK-006 created a bare `/reports/new`:
 * TASK-007 must navigate somewhere real after a `202 { jobId }`, and a submit
 * that lands on a 404 cannot be verified. It renders the heading and the id it
 * was given, and calls no API.
 */
export default function ReportPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  return (
    <RequireAuth>
      <ReportPlaceholder jobId={jobId} />
    </RequireAuth>
  );
}

function ReportPlaceholder({ jobId }: { jobId: string }) {
  const { t } = useI18n();
  return (
    <div>
      <h1 className="m-0 font-display text-2xl font-semibold text-ink">{t("reports.view.heading")}</h1>
      <p className="cr-nums m-0 mt-3 break-all font-mono text-sm text-muted">{jobId}</p>
    </div>
  );
}
