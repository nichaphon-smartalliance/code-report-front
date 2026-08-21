"use client";

import { Box, Button, Group, Text, Title } from "@mantine/core";
import { ArrowLeft, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { MessageKey } from "@/constant/text";
import { useI18n } from "@/context/i18n";
import { HOME_PATH } from "@/context/session";
import { useReportJob } from "@/hooks/reports";
import { formatIsoDate } from "@/lib/format";
import { writeRetryParams } from "@/lib/storage/retryParams";
import type { ReportJob } from "@/types/api/main";
import { ReportResult } from "./ReportResult";
import { HEADING_SIZE } from "./ReportView.config";

/**
 * The report view (TASK-008 / SPEC-001 "Frontend" 3), rebuilt Mantine-first and
 * redesigned by TASK-013 in the cobalt register.
 *
 * Structure note (FRONTEND-STANDARD §3.1): a **third** shape, deliberately
 * neither of the other two. Login is a masthead + form diptych; the new-report
 * form is an asymmetric fields+rail workbench. This is a **run dossier**
 * (hallmark macrostructure *Narrative Workflow*): a ruled spec sheet of what the
 * run was asked to do, then the six stages as a numbered ledger, then the
 * outcome. No rail, no card, no second column.
 *
 * What the redesign changed. The facts were a wrap-ribbon of loose label/value
 * chips and the screen as a whole was a *document* — which is the one
 * macrostructure this theme explicitly refuses, and it was also untrue four
 * fifths of the time: the page is prose only in its final state. The facts are
 * now a hairline-ruled label/value sheet at the instrument-panel voice, the
 * heading carries the cobalt signal tick the other two screens carry, and the
 * stages are numbered `1.0 … 6.0` with the accent spent on exactly one row —
 * the one the run is on.
 *
 * NO COPY CHANGED. Every string is the one the dictionary already held
 * (freeze item 10 / Q14); the stage numerals are derived from the position of
 * `REPORT_STAGES`, not from a new dictionary key.
 *
 * TASK-010 shed the outcome area into `ReportResult` and the stage display into
 * `ReportProgress`; the sheet and the polling wiring stay here.
 *
 * There is **no list of past runs** here and nowhere else in the app — no
 * history, no "recent reports" (REQ-001 §12).
 */
export function ReportViewContent({ jobId }: { jobId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const { job, loadError, offline, polling } = useReportJob(jobId);

  /**
   * The handoff back to the form (TASK-019 / REQ-004 Requirement 4a), written
   * **when this page has the job** rather than on a click.
   *
   * Why here and not at the affordance: Requirement 4a is about *going back*,
   * not about which control was used. The browser's own Back button remounts
   * the form fresh and never runs a handler of ours, so writing the handoff on
   * a click can only fill the form for the one path that has a click. Written
   * here, every path back — browser Back, the back control, the "try again"
   * control, or opening the form again by any means — reads the same payload,
   * and `takeRetryParams` still removes it as it is read.
   *
   * The PAT is not in `params`, is not in `RetryParams` and is not written
   * here: a private repository asks for its token again (SPEC-002 freeze
   * item 6 / REQ-001's PAT rules).
   */
  const repoUrl = job?.params.repoUrl;
  const branch = job?.params.branch ?? "";
  const author = job?.params.author ?? "";
  const dateFrom = job?.params.dateFrom;
  const dateTo = job?.params.dateTo;
  const reportLanguage = job?.params.language;

  // Depends on the six VALUES, not on `job`: polling replaces the job object
  // every 2 s while `params` never changes, so this writes once per run rather
  // than once per poll.
  useEffect(() => {
    if (repoUrl === undefined || dateFrom === undefined || dateTo === undefined) return;
    if (reportLanguage === undefined) return;
    writeRetryParams({
      repoUrl,
      branch,
      author,
      dateFrom,
      dateTo,
      language: reportLanguage,
    });
  }, [repoUrl, branch, author, dateFrom, dateTo, reportLanguage]);

  function handleTryAgain() {
    // The handoff is already on disk (the effect above), so this only
    // navigates. Kept as its own control with its own words: "try again" and
    // "back to the form" mean different things on a failed run.
    router.push(HOME_PATH);
  }

  return (
    <Box>
      {/* Present in every state — QUEUED, RUNNING, DONE, NO_COMMITS, FAILED.
          During a RUNNING run this is the only way off the screen, which is
          the complaint REQ-004 Requirement 4 is about. It is the shell's own
          subtle-accent control object (the header's logout uses the same one);
          nothing about the run dossier is restructured. */}
      <Button
        type="button"
        variant="subtle"
        color="accent"
        className="-ml-3 mb-4"
        onClick={() => router.push(HOME_PATH)}
        leftSection={<ArrowLeft size={16} aria-hidden="true" />}
      >
        {t("reports.view.back")}
      </Button>

      <Group gap="var(--space-3)" wrap="nowrap" align="center">
        {/* The same 0.85em tick the shell header, the login masthead and the
            new-report head carry — carrying the heading's own size here keeps
            it cut to the cap height across the whole clamp. */}
        <Box component="span" className="cr-tick" fz={HEADING_SIZE} aria-hidden="true" />
        <Title order={1} className="m-0" fz={HEADING_SIZE} fw={600} lh={1.15} c="var(--color-ink)">
          {t("reports.view.heading")}
        </Title>
      </Group>

      {job ? <RunSheet job={job} /> : null}

      {offline ? (
        // The same notice object login and the new-report form use: a hairline
        // all the way round, an icon and words beside the surface — never a
        // colour on its own, and never a thick coloured left stripe.
        <Text component="p" role="status" className="cr-notice mt-6">
          <WifiOff size={16} className="cr-notice__icon" aria-hidden="true" />
          <span>{t("reports.view.offline")}</span>
        </Text>
      ) : null}

      <Box className="mt-8">
        <ReportResult
          job={job}
          loadError={loadError}
          polling={polling}
          onTryAgain={handleTryAgain}
        />
      </Box>
    </Box>
  );
}

/* ----------------------------------------------------------------- sheet --- */

/**
 * What this run was asked to do, so the reader knows what they are looking at
 * (TASK-008 item 6). Values the user did not supply render as a labelled `—`;
 * nothing here is invented. **`pat` is not in the response and is not shown.**
 *
 * The repository URL is the first row rather than a spanning one: in a ruled
 * sheet the long value simply takes the height it needs, so the ribbon's
 * `--wide` special case has nothing left to solve.
 */
function RunSheet({ job }: { job: ReportJob }) {
  const { t } = useI18n();
  const from = formatIsoDate(job.params.dateFrom);
  const to = formatIsoDate(job.params.dateTo);
  const period =
    from === null ? null : to === null || to === from ? from : `${from} – ${to}`;

  return (
    <Box component="dl" className="cr-runsheet mt-6">
      <Fact label={t("reports.view.params.repo")} value={job.params.repoUrl} mono />
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
    </Box>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  const { t } = useI18n();
  const empty = value === null || value.trim() === "";
  return (
    <Box className="cr-runsheet__row">
      {/* The label column is the machine-readout voice: mono, small, tracked
          out, and the same object on every row (cobalt's "mono labels"). */}
      <Text
        component="dt"
        className="m-0"
        ff="monospace"
        fz="0.75rem"
        lh={1.5}
        c="var(--color-muted)"
        style={{ letterSpacing: "0.06em" }}
      >
        {label}
      </Text>
      <Text
        component="dd"
        className="cr-nums m-0 break-words"
        ff={mono ? "monospace" : undefined}
        fz="0.875rem"
        lh={1.5}
        c={empty ? "var(--color-muted)" : "var(--color-ink)"}
      >
        {empty ? t("reports.view.params.empty") : value}
      </Text>
    </Box>
  );
}
