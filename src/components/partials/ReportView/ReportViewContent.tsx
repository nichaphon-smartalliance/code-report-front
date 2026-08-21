"use client";

import { WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MessageKey } from "@/constant/text";
import { useI18n } from "@/context/i18n";
import { HOME_PATH } from "@/context/session";
import { useReportJob } from "@/hooks/reports";
import { formatIsoDate } from "@/lib/format";
import { writeRetryParams } from "@/lib/storage/retryParams";
import type { ReportJob } from "@/types/api/main";
import { ReportResult } from "./ReportResult";

/**
 * The report view (TASK-008 / SPEC-001 "Frontend" 3).
 *
 * Structure note (FRONTEND-STANDARD §3.1): a **third** shape, deliberately
 * neither of the first two. Login is a narrow left-biased column; the new-report
 * form is an asymmetric fields+rail worksheet. This is a document: a wide run
 * ribbon of hairline-separated facts across the top, and one reading column
 * under it at a text measure. No rail, no card, no second column.
 *
 * TASK-010 shed the outcome area into `ReportResult` and the stage display into
 * `ReportProgress`; the ribbon and the polling wiring stay here.
 *
 * There is **no list of past runs** here and nowhere else in the app — no
 * history, no "recent reports" (REQ-001 §12).
 */
export function ReportViewContent({ jobId }: { jobId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const { job, loadError, offline, polling } = useReportJob(jobId);

  function handleTryAgain(failed: ReportJob) {
    // The PAT is not in `params` and is not written here — a retried private
    // run asks for the token again (TASK-008 item 5).
    writeRetryParams({
      repoUrl: failed.params.repoUrl,
      branch: failed.params.branch ?? "",
      author: failed.params.author ?? "",
      dateFrom: failed.params.dateFrom,
      dateTo: failed.params.dateTo,
      language: failed.params.language,
    });
    router.push(HOME_PATH);
  }

  return (
    <div>
      <h1 className="m-0 font-display text-2xl font-semibold text-ink">
        {t("reports.view.heading")}
      </h1>

      {job ? <RunRibbon job={job} /> : null}

      {offline ? (
        <p role="status" className="m-0 mt-6 flex items-start gap-2 text-sm text-muted">
          <WifiOff size={16} className="mt-1 shrink-0" aria-hidden="true" />
          <span>{t("reports.view.offline")}</span>
        </p>
      ) : null}

      <div className="mt-8">
        <ReportResult
          job={job}
          loadError={loadError}
          polling={polling}
          onTryAgain={handleTryAgain}
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- ribbon --- */

/**
 * What this run was asked to do, so the reader knows what they are looking at
 * (TASK-008 item 6). Values the user did not supply render as a labelled `—`;
 * nothing here is invented. **`pat` is not in the response and is not shown.**
 */
function RunRibbon({ job }: { job: ReportJob }) {
  const { t } = useI18n();
  const from = formatIsoDate(job.params.dateFrom);
  const to = formatIsoDate(job.params.dateTo);
  const period =
    from === null ? null : to === null || to === from ? from : `${from} – ${to}`;

  return (
    <dl className="cr-ribbon mt-6">
      <Fact label={t("reports.view.params.repo")} value={job.params.repoUrl} mono wide />
      <Fact label={t("reports.view.params.period")} value={period} mono />
      <Fact label={t("reports.view.params.branch")} value={job.params.branch ?? ""} mono />
      <Fact label={t("reports.view.params.author")} value={job.params.author ?? ""} mono />
      <Fact
        label={t("reports.view.params.language")}
        value={t(`header.language.${job.params.language}` as MessageKey)}
      />
      <Fact
        label={t("reports.view.params.commits")}
        value={
          typeof job.commitCount === "number" ? job.commitCount.toLocaleString("en-US") : null
        }
        mono
      />
    </dl>
  );
}

function Fact({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  wide?: boolean;
}) {
  const { t } = useI18n();
  const empty = value === null || value.trim() === "";
  return (
    <div className={wide ? "cr-ribbon__item cr-ribbon__item--wide" : "cr-ribbon__item"}>
      <dt className="m-0 text-xs text-muted">{label}</dt>
      <dd
        className={`cr-nums m-0 mt-1 break-words text-sm ${mono ? "font-mono" : "font-body"} ${
          empty ? "text-muted" : "text-ink"
        }`}
      >
        {empty ? t("reports.view.params.empty") : value}
      </dd>
    </div>
  );
}
