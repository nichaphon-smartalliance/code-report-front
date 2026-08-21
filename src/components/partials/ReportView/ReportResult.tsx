"use client";

import { Box, Button, Text, Title } from "@mantine/core";
import { AlertTriangle, CircleCheck } from "lucide-react";
import { ReportMarkdown } from "@/components/common";
import { useI18n } from "@/context/i18n";
import type { ApiError } from "@/lib/api/client";
import type { ReportJob } from "@/types/api/main";
import { ReportProgress } from "./ReportProgress";

/**
 * The run's outcome area: the load error, the FAILED panel with its "try
 * again", the NO_COMMITS note, the finished report, or the stage ledger.
 *
 * Shed out of `ReportView.tsx` by TASK-010 — the branch order and the copy keys
 * are unchanged. TASK-013 rebuilt the two controls it owns out of
 * `@mantine/core` (`Button`) and moved the failure panel onto the shared
 * `.cr-notice--danger` object the other two screens already use, so the app has
 * one danger surface rather than three.
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
      <Text component="p" className="sr-only" role="status">
        {t("common.loading")}
      </Text>
    );
  }
  if (job.status === "FAILED") {
    return (
      <>
        <FailurePanel
          title={t("reports.view.failed.title")}
          message={job.error?.message ?? t("common.networkError")}
        />
        <Button type="button" color="accent" className="mt-6" onClick={() => onTryAgain(job)}>
          {t("reports.view.tryAgain")}
        </Button>
      </>
    );
  }
  if (job.status === "NO_COMMITS") {
    return (
      <Box component="section">
        {/* A successful run that found nothing — never an error state
            (REQ-001 AC 5). Success colour, a check icon and its own words,
            against the danger notice's border, icon and words above. */}
        <Title
          order={2}
          className="m-0 flex items-start gap-2"
          fz="1.125rem"
          fw={600}
          c="var(--color-ink)"
        >
          <Box
            component="span"
            className="mt-1 flex shrink-0"
            c="var(--color-success)"
            aria-hidden="true"
          >
            <CircleCheck size={20} />
          </Box>
          {t("reports.view.noCommits.title")}
        </Title>
        {job.report ? (
          <Box className="mt-4">
            <ReportMarkdown markdown={job.report.markdown} />
          </Box>
        ) : null}
      </Box>
    );
  }
  if (job.status === "DONE" && job.report) {
    return <ReportMarkdown markdown={job.report.markdown} />;
  }
  return <ReportProgress job={job} busy={polling} />;
}

/* -------------------------------------------------------------- failure --- */

/**
 * The failure surface. It is the app's shared `.cr-notice--danger` object —
 * a hairline all the way round on the danger tint, never a thick coloured left
 * stripe — with the icon and the words carrying the state alongside the colour.
 * The server's own `message` is shown verbatim (SPEC-001); nothing here is
 * composed from an error code.
 */
function FailurePanel({ title, message }: { title: string; message: string }) {
  return (
    <Text component="p" role="alert" className="cr-notice cr-notice--danger">
      <AlertTriangle size={20} className="cr-notice__icon" aria-hidden="true" />
      <span className="min-w-0">
        <strong className="block">{title}</strong>
        <Text component="span" className="mt-1 block break-words" c="var(--color-ink)">
          {message}
        </Text>
      </span>
    </Text>
  );
}
