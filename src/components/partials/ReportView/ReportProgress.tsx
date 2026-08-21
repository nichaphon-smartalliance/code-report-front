"use client";

import { Check, ChevronRight, Circle } from "lucide-react";
import type { MessageKey } from "@/constant/text";
import { useI18n } from "@/context/i18n";
import { REPORT_STAGES, type ReportJob, type ReportStage } from "@/types/api/main";
import type { StageState } from "./ReportView.config";

/**
 * QUEUED / RUNNING (TASK-008 item 2). Restraint over motion: the stage list is
 * simply there, the bar moves only when the server says a stage changed, and
 * the one spinning thing on screen is the 14px spinner already in the system.
 *
 * Shed out of `ReportView.tsx` by TASK-010 — markup and logic moved verbatim.
 */
export function ReportProgress({ job, busy }: { job: ReportJob; busy: boolean }) {
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

function StageRow({ stage, state }: { stage: ReportStage; state: StageState }) {
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
