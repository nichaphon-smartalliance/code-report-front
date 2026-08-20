"use client";

import { AlertTriangle, Check, ChevronRight, Circle, CircleCheck, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReportMarkdown } from "@/components/ReportMarkdown";
import { REPORT_STAGES, type ReportJob, type ReportStage } from "@/lib/api/client";
import { formatIsoDate } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { writeRetryParams } from "@/lib/reports/retry";
import { useReportJob } from "@/lib/reports/useReportJob";
import { HOME_PATH } from "@/lib/session/SessionProvider";

/**
 * The report view (TASK-008 / SPEC-001 "Frontend" 3).
 *
 * Structure note (FRONTEND-STANDARD §3.1): a **third** shape, deliberately
 * neither of the first two. Login is a narrow left-biased column; the new-report
 * form is an asymmetric fields+rail worksheet. This is a document: a wide run
 * ribbon of hairline-separated facts across the top, and one reading column
 * under it at a text measure. No rail, no card, no second column.
 *
 * There is **no list of past runs** here and nowhere else in the app — no
 * history, no "recent reports" (REQ-001 §12).
 */
export function ReportView({ jobId }: { jobId: string }) {
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
        <p
          role="status"
          className="m-0 mt-6 flex items-start gap-2 text-sm text-muted"
        >
          <WifiOff size={16} className="mt-1 shrink-0" aria-hidden="true" />
          <span>{t("reports.view.offline")}</span>
        </p>
      ) : null}

      <div className="mt-8">
        {loadError ? (
          <FailurePanel title={t("reports.view.failed.title")} message={loadError.message} />
        ) : job === null ? (
          <p className="sr-only" role="status">
            {t("common.loading")}
          </p>
        ) : job.status === "FAILED" ? (
          <>
            <FailurePanel
              title={t("reports.view.failed.title")}
              message={job.error?.message ?? t("common.networkError")}
            />
            <button
              type="button"
              className="cr-btn cr-btn--primary mt-6"
              onClick={() => handleTryAgain(job)}
            >
              {t("reports.view.tryAgain")}
            </button>
          </>
        ) : job.status === "NO_COMMITS" ? (
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
        ) : job.status === "DONE" && job.report ? (
          <ReportMarkdown markdown={job.report.markdown} />
        ) : (
          <RunProgress job={job} busy={polling} />
        )}
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

/* ------------------------------------------------------------- progress --- */

/**
 * QUEUED / RUNNING (TASK-008 item 2). Restraint over motion: the stage list is
 * simply there, the bar moves only when the server says a stage changed, and
 * the one spinning thing on screen is the 14px spinner already in the system.
 */
function RunProgress({ job, busy }: { job: ReportJob; busy: boolean }) {
  const { t } = useI18n();
  const total = job.progress?.total ?? REPORT_STAGES.length;
  const currentIndex = job.stage === null || job.stage === undefined ? -1 : REPORT_STAGES.indexOf(job.stage);
  const current = job.progress?.current ?? (currentIndex >= 0 ? currentIndex + 1 : 0);

  return (
    <section>
      <h2 className="m-0 flex items-center gap-3 font-display text-lg font-semibold text-ink">
        {busy ? <span className="cr-spinner text-accent" aria-hidden="true" /> : null}
        {t("reports.view.running.title")}
      </h2>
      <p className="m-0 mt-2 text-sm text-muted">{t("reports.view.running.hint")}</p>

      <p className="cr-nums m-0 mt-6 font-mono text-xs text-muted" aria-live="polite">
        {t("reports.view.progress.step")} {current} / {total}
      </p>
      <div
        className="cr-progress mt-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={t("reports.view.running.title")}
      >
        <span style={{ inlineSize: `${total > 0 ? (current / total) * 100 : 0}%` }} />
      </div>

      <ol className="cr-stages mt-6">
        {REPORT_STAGES.map((stage, index) => (
          <StageRow
            key={stage}
            stage={stage}
            state={
              currentIndex < 0
                ? "pending"
                : index < currentIndex
                  ? "done"
                  : index === currentIndex
                    ? "current"
                    : "pending"
            }
          />
        ))}
      </ol>
    </section>
  );
}

function StageRow({ stage, state }: { stage: ReportStage; state: "done" | "current" | "pending" }) {
  const { t } = useI18n();
  return (
    <li data-state={state}>
      {/* State is never carried by colour alone: an icon and a word carry it too. */}
      {state === "done" ? (
        <Check size={16} aria-hidden="true" />
      ) : state === "current" ? (
        <ChevronRight size={16} aria-hidden="true" />
      ) : (
        <Circle size={16} aria-hidden="true" />
      )}
      <span>{t(`reports.view.stage.${stage}` as MessageKey)}</span>
      <span className="cr-stages__state">{t(`reports.view.state.${state}` as MessageKey)}</span>
    </li>
  );
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
