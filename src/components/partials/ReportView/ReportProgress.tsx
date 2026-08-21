"use client";

import { Box, Text, Title } from "@mantine/core";
import { Check, ChevronRight, Circle } from "lucide-react";
import type { MessageKey } from "@/constant/text";
import { useI18n } from "@/context/i18n";
import { REPORT_STAGES, type ReportJob, type ReportStage } from "@/types/api/main";
import type { StageState } from "./ReportView.config";

/**
 * QUEUED / RUNNING (TASK-008 item 2), redesigned by TASK-013 as the dossier's
 * **stage ledger**: the six stages numbered `1.0 … 6.0` down a mono left
 * margin, ruled rather than gapped, with the state word hard right.
 *
 * Restraint over motion is unchanged and is the reason the ledger looks like
 * this: the bar moves only when the server says a stage changed, the numerals
 * are static, and the one spinning thing on screen is still the 14px spinner
 * already in the system. The stage numerals are positions in `REPORT_STAGES` —
 * no dictionary key was added (freeze item 10).
 *
 * Shed out of `ReportView.tsx` by TASK-010; the six-stage logic below is
 * unchanged by the redesign.
 */
export function ReportProgress({ job, busy }: { job: ReportJob; busy: boolean }) {
  const { t } = useI18n();
  const total = job.progress?.total ?? REPORT_STAGES.length;
  const currentIndex = job.stage === null || job.stage === undefined ? -1 : REPORT_STAGES.indexOf(job.stage);
  const current = job.progress?.current ?? (currentIndex >= 0 ? currentIndex + 1 : 0);

  return (
    <Box component="section">
      <Title
        order={2}
        className="m-0 flex items-center gap-3"
        fz="1.125rem"
        fw={600}
        c="var(--color-ink)"
      >
        {busy ? (
          <Box component="span" className="cr-spinner" c="var(--color-accent)" aria-hidden="true" />
        ) : null}
        {t("reports.view.running.title")}
      </Title>
      <Text component="p" className="m-0 mt-2" fz="0.875rem" c="var(--color-muted)">
        {t("reports.view.running.hint")}
      </Text>

      <Text
        component="p"
        className="cr-nums m-0 mt-6"
        ff="monospace"
        fz="0.75rem"
        c="var(--color-muted)"
        style={{ letterSpacing: "0.06em" }}
        aria-live="polite"
      >
        {t("reports.view.progress.step")} {current} / {total}
      </Text>
      <Box
        className="cr-progress mt-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={t("reports.view.running.title")}
      >
        <span style={{ inlineSize: `${total > 0 ? (current / total) * 100 : 0}%` }} />
      </Box>

      <Box component="ol" className="cr-stages mt-6">
        {REPORT_STAGES.map((stage, index) => (
          <StageRow
            key={stage}
            stage={stage}
            index={index}
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
      </Box>
    </Box>
  );
}

function StageRow({
  stage,
  index,
  state,
}: {
  stage: ReportStage;
  index: number;
  state: StageState;
}) {
  const { t } = useI18n();
  return (
    <li data-state={state}>
      {/* The stage's position, in the numbered-workflow voice. It is a numeral,
          not copy: `1.0` reads the same in both languages and needs no key. */}
      <span className="cr-stages__num" aria-hidden="true">
        {index + 1}.0
      </span>
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
