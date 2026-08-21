"use client";

import { AlertTriangle, CircleCheck } from "lucide-react";
import { ReportMarkdown } from "@/components/common";
import { useI18n } from "@/context/i18n";
import type { ApiError } from "@/lib/api/client";
import type { ReportJob } from "@/types/api/main";
import { ReportProgress } from "./ReportProgress";

/**
 * The run's outcome area: the load error, the FAILED panel with its "try
 * again", the NO_COMMITS note, the finished report, or the progress display.
 *
 * Shed out of `ReportView.tsx` by TASK-010 — the branch order, the markup and
 * the copy keys moved verbatim; only the enclosing component is new.
 */
export function ReportResult({
  job,
  loadError,
  polling,
  onTryAgain,
}: {
  job: ReportJob | null;
  loadError: ApiError | null;
  polling: boolean;
  onTryAgain: (failed: ReportJob) => void;
}) {
  const { t } = useI18n();

  if (loadError) {
    return <FailurePanel title={t("reports.view.failed.title")} message={loadError.message} />;
  }
  if (job === null) {
    return (
      <p className="sr-only" role="status">
        {t("common.loading")}
      </p>
    );
  }
  if (job.status === "FAILED") {
    return (
      <>
        <FailurePanel
          title={t("reports.view.failed.title")}
          message={job.error?.message ?? t("common.networkError")}
        />
        <button
          type="button"
          className="cr-btn cr-btn--primary mt-6"
          onClick={() => onTryAgain(job)}
        >
          {t("reports.view.tryAgain")}
        </button>
      </>
    );
  }
  if (job.status === "NO_COMMITS") {
    return (
      <section>
        {/* A successful run that found nothing — never an error state
            (REQ-001 AC 5). Success colour, a check icon and its own words,
            against the danger panel's border, icon and words above. */}
        <h2 className="m-0 flex items-start gap-2 font-display text-lg font-semibold text-ink">
          <CircleCheck size={20} className="mt-1 shrink-0 text-success" aria-hidden="true" />
          {t("reports.view.noCommits.title")}
        </h2>
        {job.report ? (
          <div className="mt-4">
            <ReportMarkdown markdown={job.report.markdown} />
          </div>
        ) : null}
      </section>
    );
  }
  if (job.status === "DONE" && job.report) {
    return <ReportMarkdown markdown={job.report.markdown} />;
  }
  return <ReportProgress job={job} busy={polling} />;
}

/* -------------------------------------------------------------- failure --- */

function FailurePanel({ title, message }: { title: string; message: string }) {
  return (
    <section
      role="alert"
      className="flex items-start gap-2 rounded border border-solid border-danger bg-danger-soft px-4 py-4 text-sm text-danger"
    >
      <AlertTriangle size={20} className="mt-1 shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        <strong className="block font-body font-semibold">{title}</strong>
        <span className="mt-1 block break-words text-ink">{message}</span>
      </span>
    </section>
  );
}
