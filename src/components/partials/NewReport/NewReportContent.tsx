"use client";

import { Box, Button, Text } from "@mantine/core";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { type Language } from "@/constant/text";
import { useI18n } from "@/context/i18n";
import { useDelayedFlag } from "@/hooks/common";
import { ApiError, NetworkError, VALIDATION_ERROR } from "@/lib/api/client";
import { formatIsoDate } from "@/lib/format";
import { takeRetryParams, writeRetryParams } from "@/lib/storage/retryParams";
import { reportPath } from "@/context/session";
import { createReport } from "@/services/report.service";
import type { CreateReportInput } from "@/types/api/main";
import {
  EXTRA_CONTEXT_MAX,
  isFieldName,
  MAX_SPAN_DAYS,
  type FieldErrors,
  type Mode,
  type Phase,
} from "./NewReport.config";
import { NewReportFields } from "./NewReportFields";
import { NewReportHeader } from "./NewReportHeader";

/**
 * The new-report form (TASK-007 / SPEC-001 "Frontend" 2), rebuilt Mantine-first
 * and redesigned by TASK-012 in the cobalt register.
 *
 * Structure note (FRONTEND-STANDARD §3.1): this screen is deliberately NOT the
 * login screen's shape. Login is a masthead + form diptych; this is a
 * **workbench** — an asymmetric working surface whose left column is a sheet of
 * four sections separated by hairlines that run the field measure, and whose
 * right column is one bordered run panel carrying the period readout and the
 * submit. It collapses to one column below `lg`. There is no three-equal-column
 * grid, no card wrapping the fields (the panel is the page's only contained
 * object, so there is no card-in-card), and no section eyebrow.
 *
 * What the redesign changed, beyond the control layer: the four sections were
 * four free-floating headings on one repeated `mb-10`; they are now ruled, and
 * their internal density varies with what the section is for. The rail was a
 * borderless top-ruled column; it is now a hairline-bordered panel whose period
 * is a mono tabular readout rather than another line of body text.
 *
 * TASK-010 shed the heading into `NewReportHeader` and the field column into
 * `NewReportFields`; the state, the validation and the submit stay here.
 *
 * The PAT is the sensitive thing here. It lives in component state, is sent in
 * one request body, and is wiped the moment the request succeeds. It is never
 * written to localStorage/sessionStorage, never put in a URL or query string,
 * and the key is absent from the body entirely when the toggle is off.
 */

/** Whole days between two `YYYY-MM-DD` calendar dates. No timezone involved. */
function daysBetween(from: string, to: string): number {
  const parse = (value: string) => {
    const [y, m, d] = value.split("-").map(Number);
    return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

export function NewReportContent() {
  const { t, language } = useI18n();
  const router = useRouter();

  // The only id this screen still mints by hand. Every per-field id came from
  // the hand-rolled `Field` primitive and is Mantine's job now (TASK-012).
  const formErrorId = useId();

  const [repoUrl, setRepoUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [pat, setPat] = useState("");
  const [mode, setMode] = useState<Mode>("day");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branch, setBranch] = useState("");
  const [author, setAuthor] = useState("");
  // Seeded from the interface language as a starting point, then owned by the
  // user — the two are independent (SPEC-001), so changing the UI language
  // afterwards must not silently rewrite a choice already made here.
  const [reportLanguage, setReportLanguage] = useState<Language>(language);
  const [extraContext, setExtraContext] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * "Try again" from a FAILED run (TASK-008 item 5). The handoff carries the
   * run's own `params` and **nothing else** — there is no `pat` in it, so a
   * retried private run asks for the token again, which is the point.
   * Read once, after mount, so the server render and the first client render
   * agree.
   */
  useEffect(() => {
    const retry = takeRetryParams();
    if (retry === null) return;
    setRepoUrl(retry.repoUrl);
    setBranch(retry.branch);
    setAuthor(retry.author);
    setDateFrom(retry.dateFrom);
    setDateTo(retry.dateTo);
    setReportLanguage(retry.language);
    setMode(retry.dateFrom === retry.dateTo ? "day" : "range");
  }, []);

  const busy = phase === "submitting";
  const showSpinner = useDelayedFlag(busy);

  // In single-day mode the second field is hidden and mirrors the first: one
  // date mechanism, two presentations (TASK-007 item 3).
  const effectiveDateTo = mode === "day" ? dateFrom : dateTo;

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (repoUrl.trim() === "") errors.repoUrl = t("reports.new.error.repoUrlRequired");
    if (dateFrom === "") errors.dateFrom = t("reports.new.error.dateRequired");
    if (mode === "range" && dateTo === "") errors.dateTo = t("reports.new.error.dateRequired");

    if (dateFrom !== "" && effectiveDateTo !== "") {
      const span = daysBetween(dateFrom, effectiveDateTo);
      if (span < 0) errors.dateTo = t("reports.new.error.dateOrder");
      else if (span > MAX_SPAN_DAYS) errors.dateTo = t("reports.new.error.dateSpan");
    }

    if ([...extraContext].length > EXTRA_CONTEXT_MAX) {
      errors.extraContext = t("reports.new.error.extraContextTooLong");
    }
    return errors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setFormError(t("reports.new.error.checkFields"));
      setPhase("error");
      return;
    }

    setPhase("submitting");
    setFieldErrors({});
    setFormError(null);

    // The `pat`, `branch`, `author` and `extraContext` keys are OMITTED rather
    // than sent empty — a public run's payload has no `pat` key at all.
    const body: CreateReportInput = {
      repoUrl: repoUrl.trim(),
      dateFrom,
      dateTo: effectiveDateTo,
      language: reportLanguage,
      ...(isPrivate && pat !== "" ? { pat } : {}),
      ...(branch.trim() === "" ? {} : { branch: branch.trim() }),
      ...(author.trim() === "" ? {} : { author: author.trim() }),
      ...(extraContext.trim() === "" ? {} : { extraContext }),
    };

    try {
      const { jobId } = await createReport(body, language);
      // Wiped before we navigate: the token must not survive this screen.
      setPat("");
      setIsPrivate(false);
      setPhase("success");
      // The handoff back to this form (TASK-019 / Requirement 4a). The report
      // page rewrites the same payload the moment it has the job, so this is
      // not the only writer — it exists to close the window BEFORE the first
      // poll returns, where the page has no `params` to write from and a
      // reader going straight back would otherwise find an empty form.
      // Six values, the same six the run was submitted with. **No `pat`:** the
      // type has no such key and the token has just been wiped above.
      writeRetryParams({
        repoUrl: body.repoUrl,
        branch: body.branch ?? "",
        author: body.author ?? "",
        dateFrom: body.dateFrom,
        dateTo: body.dateTo,
        language: body.language,
      });
      // `push`, not `replace` (TASK-019 / REQ-004 Requirement 4): `replace`
      // overwrote this form's history entry, so the browser's own Back button
      // could not return to it and the report page was a dead end.
      router.push(reportPath(jobId));
    } catch (cause: unknown) {
      if (cause instanceof ApiError) {
        // SPEC-001: show the server's own `message`; never compose text from a
        // code. On VALIDATION_ERROR the `fields` map lands on the inputs.
        if (cause.code === VALIDATION_ERROR && cause.fields) {
          const mapped: FieldErrors = {};
          for (const [key, message] of Object.entries(cause.fields)) {
            if (isFieldName(key)) mapped[key] = message;
          }
          setFieldErrors(mapped);
        }
        setFormError(cause.message);
      } else if (cause instanceof NetworkError) {
        setFormError(t("common.networkError"));
      } else {
        setFormError(t("common.networkError"));
      }
      setPhase("error");
    }
  }

  /**
   * Codepoints, not UTF-16 code units (Sober's TASK-007 review, minor 3): an
   * emoji costs 2 units and 1 codepoint, so counting units could make the
   * client stricter than the server — the one direction client validation must
   * never take. Counting codepoints is never stricter under either reading.
   */
  const contextLength = [...extraContext].length;
  const counterOver = contextLength > EXTRA_CONTEXT_MAX;

  /**
   * Server field errors whose control is not on screen (minor 1): `language`
   * has no field of its own, and `pat` is unmounted while the toggle is off.
   * Without this they would vanish, leaving only the envelope message.
   */
  const orphanErrors = [
    ...(fieldErrors.language === undefined ? [] : [fieldErrors.language]),
    ...(!isPrivate && fieldErrors.pat !== undefined ? [fieldErrors.pat] : []),
  ];
  const fromDisplay = formatIsoDate(dateFrom);
  const toDisplay = formatIsoDate(effectiveDateTo);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <NewReportHeader />

      <Box className="cr-worksheet mt-8">
        {/* ------------------------------------------------------- fields --- */}
        <NewReportFields
          busy={busy}
          fieldErrors={fieldErrors}
          repoUrl={repoUrl}
          onRepoUrlChange={setRepoUrl}
          isPrivate={isPrivate}
          onIsPrivateChange={setIsPrivate}
          pat={pat}
          onPatChange={setPat}
          mode={mode}
          onModeChange={setMode}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          branch={branch}
          onBranchChange={setBranch}
          author={author}
          onAuthorChange={setAuthor}
          reportLanguage={reportLanguage}
          onReportLanguageChange={setReportLanguage}
          extraContext={extraContext}
          onExtraContextChange={setExtraContext}
          contextLength={contextLength}
          counterOver={counterOver}
        />

        {/* -------------------------------------------------- the run panel --- */}
        <Box component="aside" className="min-w-0 lg:sticky lg:top-10 lg:self-start">
          <Box className="cr-runpanel">
            <Text
              component="h2"
              className="m-0"
              fz="0.8125rem"
              fw={600}
              c="var(--color-muted)"
              style={{ letterSpacing: "0.01em" }}
            >
              {t("reports.new.summary.heading")}
            </Text>

            {/* The period is the one fact this panel exists to show, so it is
                set as a machine readout — mono, tabular, promoted in size —
                rather than as another line of body text. */}
            <Box component="dl" className="m-0 mt-4">
              <Text component="dt" className="m-0" fz="0.75rem" c="var(--color-muted)">
                {t("reports.new.summary.period")}
              </Text>
              <Text
                component="dd"
                className="cr-nums m-0 mt-2"
                ff="monospace"
                fz="1.125rem"
                lh={1.35}
                c="var(--color-ink)"
              >
                {fromDisplay === null
                  ? t("reports.new.summary.empty")
                  : mode === "day" || fromDisplay === toDisplay
                    ? fromDisplay
                    : toDisplay === null
                      ? fromDisplay
                      : `${fromDisplay} – ${toDisplay}`}
              </Text>
            </Box>

            {formError ? (
              // The same notice object the login screen uses: a hairline all the
              // way round, never a thick coloured left stripe (the TASK-011
              // audit's first critical). Icon and words carry the state too.
              <Text
                component="p"
                id={formErrorId}
                role="alert"
                className="cr-notice cr-notice--danger mt-5"
              >
                <AlertTriangle size={16} className="cr-notice__icon" aria-hidden="true" />
                <span>
                  <strong>{t("reports.new.errorTitle")}</strong>
                  {" — "}
                  {formError}
                  {orphanErrors.map((message) => (
                    <span key={message} className="mt-2 block">
                      {message}
                    </span>
                  ))}
                </span>
              </Text>
            ) : null}

            <Button
              type="submit"
              className="mt-5"
              color={phase === "error" ? "danger" : phase === "success" ? "success" : "accent"}
              fullWidth
              // Stays disabled through `success` as well: `router.push` is
              // async, and a second click in that window would start a SECOND
              // job — tokenless, because the PAT has just been cleared
              // (Sober's TASK-007 review, minor 2).
              disabled={busy || phase === "success" || counterOver}
              loading={showSpinner}
              aria-describedby={formError ? formErrorId : undefined}
            >
              {busy ? t("reports.new.submitting") : t("reports.new.submit")}
            </Button>
          </Box>
        </Box>
      </Box>
    </form>
  );
}
