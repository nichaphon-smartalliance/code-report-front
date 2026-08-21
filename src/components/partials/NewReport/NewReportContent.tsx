"use client";

import { Box, Button, Text } from "@mantine/core";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { type Language } from "@/constant/text";
import { useI18n } from "@/context/i18n";
import { useDelayedFlag } from "@/hooks/common";
import { ApiError, NetworkError, VALIDATION_ERROR } from "@/lib/api/client";
import { formatIsoDate } from "@/lib/format";
import { takeRetryParams, writeRetryParams } from "@/lib/storage/retryParams";
import { reportPath } from "@/context/session";
import { fetchBranches, fetchCommitters } from "@/services/repo.service";
import { createReport } from "@/services/report.service";
import type { Committer, CreateReportInput } from "@/types/api/main";
import {
  committerValue,
  EXTRA_CONTEXT_MAX,
  isFieldName,
  MAX_SPAN_DAYS,
  todayIso,
  type FieldErrors,
  type ListPhase,
  type Phase,
} from "./NewReport.config";
import { NewReportFields } from "./NewReportFields";
import { NewReportHeader } from "./NewReportHeader";

/**
 * The new-report form (TASK-007 / SPEC-001 "Frontend" 2), rebuilt Mantine-first
 * and redesigned by TASK-012 in the cobalt register, and **re-shaped by TASK-018
 * (SPEC-003 / REQ-004 Requirements 1, 1a, 2, 2a, 3, 4a, 4b, 6)**.
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
 * What TASK-018 changed, and why the state below grew: branch and committer are
 * no longer free text. Each is a `Select` fed by an **explicit** load action —
 * never a fetch on keystroke or blur, because each load is a real request
 * against a real remote and the user should not be charged for one they did not
 * ask for (SPEC-003 Decision 2.2). **Nothing past the repository section is
 * usable until the branch list has loaded** (Requirement 1a / Q27): there is no
 * typed-branch escape hatch, and a failure leaves the form locked with the
 * server's own message. The single-day / range switch is gone outright
 * (Requirement 2); the period is one range, pre-filled today → today.
 *
 * TASK-010 shed the heading into `NewReportHeader` and the field column into
 * `NewReportFields`; the state, the validation and the submit stay here.
 *
 * The PAT is the sensitive thing here. It lives in component state, is sent in
 * the bodies of the requests that need it (submit, and now each list load —
 * SPEC-003 Non-functional states that consequence), and is wiped the moment the
 * report request succeeds. It is never written to localStorage/sessionStorage,
 * never put in a URL or query string, and the key is absent from every body
 * entirely when the toggle is off.
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branch, setBranch] = useState("");
  const [author, setAuthor] = useState("");
  // Seeded from the interface language as a starting point, then owned by the
  // user — the two are independent (SPEC-001), so changing the UI language
  // afterwards must not silently rewrite a choice already made here.
  const [reportLanguage, setReportLanguage] = useState<Language>(language);
  const [extraContext, setExtraContext] = useState("");

  const [branches, setBranches] = useState<string[]>([]);
  const [branchPhase, setBranchPhase] = useState<ListPhase>("idle");
  const [branchLoadError, setBranchLoadError] = useState<string | null>(null);

  const [committers, setCommitters] = useState<Committer[]>([]);
  const [committerPhase, setCommitterPhase] = useState<ListPhase>("idle");
  const [committerLoadError, setCommitterLoadError] = useState<string | null>(null);

  /**
   * A branch or committer restored from the handoff is a **string, not
   * evidence** that the branch still exists (SPEC-003 4a ∩ 1a, and the TASK-019
   * review made the case real: the handoff can arrive at a form reached by a
   * route that is not "back"). So a restored value waits here and is applied
   * only after its list has loaded and only if it is in that list. The form
   * stays locked until then, and submit stays gated on a loaded list.
   */
  const pendingBranch = useRef<string | null>(null);
  const pendingAuthor = useRef<string | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * One mount effect, two jobs, in this order.
   *
   * 1. **The period opens today → today** (Requirement 2a). It runs after mount
   *    rather than as `useState` initialisers because "today" is the browser's
   *    calendar day: computing it during the server render would produce a
   *    different string and a hydration mismatch.
   * 2. **The handoff back from a report page** (TASK-008 item 5's "try again",
   *    and since TASK-019 every way back). It carries the run's own parameters
   *    and **no `pat`**, so a private run asks for the token again — which is
   *    the point. `takeRetryParams` removes it as it reads it, so this prefills
   *    exactly once. Reading it here, after mount, keeps the server render and
   *    the first client render in agreement.
   */
  useEffect(() => {
    const today = todayIso();
    setDateFrom(today);
    setDateTo(today);

    const retry = takeRetryParams();
    if (retry === null) return;
    setRepoUrl(retry.repoUrl);
    setDateFrom(retry.dateFrom);
    setDateTo(retry.dateTo);
    setReportLanguage(retry.language);
    // Requirement 4b (Q-SA-20): the free-text box comes back too. No response
    // carries this value — only the form-side writer can produce it.
    setExtraContext(retry.extraContext);
    // Not applied yet: these two wait for their lists (see the refs above).
    pendingBranch.current = retry.branch === "" ? null : retry.branch;
    pendingAuthor.current = retry.author === "" ? null : retry.author;
  }, []);

  const busy = phase === "submitting";
  const showSpinner = useDelayedFlag(busy);

  /**
   * The gate (Requirement 1a): everything below the repository section is
   * unavailable until a **non-empty** branch list has loaded. `empty` and
   * `error` are both locked states with their own line — there is nowhere to
   * type a branch in either.
   */
  const unlocked = branchPhase === "ready" && branches.length > 0;

  /** The committer list is range-scoped, so it needs a branch and valid dates. */
  const datesUsable =
    dateFrom !== "" &&
    dateTo !== "" &&
    daysBetween(dateFrom, dateTo) >= 0 &&
    daysBetween(dateFrom, dateTo) <= MAX_SPAN_DAYS;
  const canLoadCommitters = unlocked && branch !== "" && datesUsable;

  /**
   * A loaded list belongs to **one repository and one credential**. Changing
   * either drops it and re-locks the form: a stale list is worse than none,
   * because it is silently about a different repository.
   */
  function invalidateBranches() {
    setBranches([]);
    setBranchPhase("idle");
    setBranchLoadError(null);
    setBranch("");
    invalidateCommitters();
  }

  /** The committer list is scoped to branch + range as well (Decision 2.1). */
  function invalidateCommitters() {
    setCommitters([]);
    setCommitterPhase("idle");
    setCommitterLoadError(null);
    setAuthor("");
  }

  function handleRepoUrlChange(value: string) {
    setRepoUrl(value);
    invalidateBranches();
  }

  function handleIsPrivateChange(checked: boolean) {
    setIsPrivate(checked);
    // Turning the toggle off drops the token immediately rather than leaving it
    // in state where a later request could send it.
    if (!checked) setPat("");
    invalidateBranches();
  }

  function handlePatChange(value: string) {
    setPat(value);
    invalidateBranches();
  }

  function handleBranchChange(value: string) {
    setBranch(value);
    invalidateCommitters();
  }

  function handleDateFromChange(value: string) {
    setDateFrom(value);
    invalidateCommitters();
  }

  function handleDateToChange(value: string) {
    setDateTo(value);
    invalidateCommitters();
  }

  function handlePreset(from: string, to: string) {
    setDateFrom(from);
    setDateTo(to);
    invalidateCommitters();
  }

  /** The token travels in the body, and only when there is one to send. */
  function patBody(): { pat?: string } {
    return isPrivate && pat !== "" ? { pat } : {};
  }

  /**
   * SPEC-001: show the server's own `message`; never compose text from a code.
   * On `VALIDATION_ERROR` the `fields` map lands on the inputs as well, exactly
   * as the submit path does it.
   */
  function listError(cause: unknown, onMessage: (message: string) => void) {
    if (cause instanceof ApiError) {
      if (cause.code === VALIDATION_ERROR && cause.fields) {
        const mapped: FieldErrors = {};
        for (const [key, message] of Object.entries(cause.fields)) {
          if (isFieldName(key)) mapped[key] = message;
        }
        setFieldErrors(mapped);
      }
      onMessage(cause.message);
    } else if (cause instanceof NetworkError) {
      onMessage(t("common.networkError"));
    } else {
      onMessage(t("common.networkError"));
    }
  }

  async function handleLoadBranches() {
    if (branchPhase === "loading" || busy) return;
    if (repoUrl.trim() === "") {
      setFieldErrors({ repoUrl: t("reports.new.error.repoUrlRequired") });
      return;
    }
    setBranchPhase("loading");
    setBranchLoadError(null);
    setFieldErrors({});
    try {
      const result = await fetchBranches(
        { repoUrl: repoUrl.trim(), ...patBody() },
        language,
      );
      setBranches(result.branches);
      if (result.branches.length === 0) {
        setBranchPhase("empty");
        return;
      }
      setBranchPhase("ready");
      // A restored branch is applied only if the repository still has it;
      // otherwise the server's own default is the honest starting point.
      const restored = pendingBranch.current;
      pendingBranch.current = null;
      if (restored !== null && result.branches.includes(restored)) {
        setBranch(restored);
        return;
      }
      if (result.defaultBranch !== null && result.branches.includes(result.defaultBranch)) {
        setBranch(result.defaultBranch);
      }
    } catch (cause: unknown) {
      setBranches([]);
      setBranch("");
      setBranchPhase("error");
      listError(cause, setBranchLoadError);
    }
  }

  async function handleLoadCommitters() {
    if (committerPhase === "loading" || busy || !canLoadCommitters) return;
    setCommitterPhase("loading");
    setCommitterLoadError(null);
    try {
      const result = await fetchCommitters(
        { repoUrl: repoUrl.trim(), ...patBody(), branch, dateFrom, dateTo },
        language,
      );
      setCommitters(result.committers);
      if (result.committers.length === 0) {
        setCommitterPhase("empty");
        return;
      }
      setCommitterPhase("ready");
      const restored = pendingAuthor.current;
      pendingAuthor.current = null;
      if (restored !== null && result.committers.some((c) => committerValue(c) === restored)) {
        setAuthor(restored);
      }
    } catch (cause: unknown) {
      setCommitters([]);
      setAuthor("");
      setCommitterPhase("error");
      listError(cause, setCommitterLoadError);
    }
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (repoUrl.trim() === "") errors.repoUrl = t("reports.new.error.repoUrlRequired");
    if (dateFrom === "") errors.dateFrom = t("reports.new.error.dateRequired");
    if (dateTo === "") errors.dateTo = t("reports.new.error.dateRequired");

    if (dateFrom !== "" && dateTo !== "") {
      const span = daysBetween(dateFrom, dateTo);
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
    // Requirement 1a again, this time as a guard rather than a disabled
    // attribute: a form submit can also arrive from the Enter key.
    if (!unlocked || branch === "") return;

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

    // The `pat`, `author` and `extraContext` keys are OMITTED rather than sent
    // empty — a public run's payload has no `pat` key at all, and "everyone"
    // sends no `author` key (REQ-001's accepted empty-author behaviour).
    // `branch` is always present now: submit is gated on a chosen one.
    const body: CreateReportInput = {
      repoUrl: repoUrl.trim(),
      dateFrom,
      dateTo,
      language: reportLanguage,
      ...patBody(),
      branch,
      ...(author === "" ? {} : { author }),
      ...(extraContext.trim() === "" ? {} : { extraContext }),
    };

    try {
      const { jobId } = await createReport(body, language);
      // Wiped before we navigate: the token must not survive this screen.
      setPat("");
      setIsPrivate(false);
      setPhase("success");
      // The handoff back to this form (TASK-019 / REQ-004 Requirement 4a). The
      // report page rewrites the six keys it can source the moment it has the
      // job, so this is not the only writer — it exists to close the window
      // BEFORE the first poll returns, where the page has no `params` to write
      // from and a reader going straight back would otherwise find an empty
      // form.
      // **Seven values now.** `extraContext` (Requirement 4b) is the one key no
      // response carries, so this writer is the ONLY one that can produce it —
      // and `writeRunRetryParams` on the report page preserves it rather than
      // overwriting it with a blank.
      // **No `pat`:** the type has no such key and the token has just been
      // wiped above.
      writeRetryParams({
        repoUrl: body.repoUrl,
        branch: body.branch ?? "",
        author: body.author ?? "",
        dateFrom: body.dateFrom,
        dateTo: body.dateTo,
        language: body.language,
        extraContext: body.extraContext ?? "",
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
  const toDisplay = formatIsoDate(dateTo);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <NewReportHeader />

      <Box className="cr-worksheet mt-8">
        {/* ------------------------------------------------------- fields --- */}
        <NewReportFields
          busy={busy}
          unlocked={unlocked}
          fieldErrors={fieldErrors}
          repoUrl={repoUrl}
          onRepoUrlChange={handleRepoUrlChange}
          isPrivate={isPrivate}
          onIsPrivateChange={handleIsPrivateChange}
          pat={pat}
          onPatChange={handlePatChange}
          branches={branches}
          branchPhase={branchPhase}
          branchLoadError={branchLoadError}
          onLoadBranches={handleLoadBranches}
          dateFrom={dateFrom}
          onDateFromChange={handleDateFromChange}
          dateTo={dateTo}
          onDateToChange={handleDateToChange}
          onPreset={handlePreset}
          branch={branch}
          onBranchChange={handleBranchChange}
          author={author}
          onAuthorChange={setAuthor}
          committers={committers}
          committerPhase={committerPhase}
          committerLoadError={committerLoadError}
          canLoadCommitters={canLoadCommitters}
          onLoadCommitters={handleLoadCommitters}
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
                  : toDisplay === null || toDisplay === fromDisplay
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
              // **And until a branch has been chosen from a loaded list**
              // (REQ-004 Requirement 1a / Q27 — there is no typed fallback).
              disabled={busy || phase === "success" || counterOver || !unlocked || branch === ""}
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
