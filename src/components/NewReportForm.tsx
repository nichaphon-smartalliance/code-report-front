"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  ApiError,
  createReport,
  NetworkError,
  VALIDATION_ERROR,
  type CreateReportInput,
} from "@/lib/api/client";
import { formatIsoDate } from "@/lib/format";
import { LANGUAGES, type Language, type MessageKey } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { takeRetryParams } from "@/lib/reports/retry";
import { reportPath } from "@/lib/session/SessionProvider";
import { useDelayedFlag } from "@/lib/useDelayedFlag";

/**
 * The new-report form (TASK-007 / SPEC-001 "Frontend" 2).
 *
 * Structure note (FRONTEND-STANDARD §3.1): this screen is deliberately NOT the
 * login screen's shape. Login is one narrow left-biased column; this is an
 * asymmetric two-column working surface — four labelled groups of unequal
 * density on the left, a narrow run rail on the right that echoes the period
 * and carries the submit. It collapses to one column below `lg`. There is no
 * three-equal-column grid, no card wrapping the fields, and no section eyebrow.
 *
 * The PAT is the sensitive thing here. It lives in component state, is sent in
 * one request body, and is wiped the moment the request succeeds. It is never
 * written to localStorage/sessionStorage, never put in a URL or query string,
 * and the key is absent from the body entirely when the toggle is off.
 */

const EXTRA_CONTEXT_MAX = 8000;
/** SPEC-001 validation: "range span ≤ 366 days". */
const MAX_SPAN_DAYS = 366;

type Mode = "day" | "range";
type Phase = "idle" | "submitting" | "error" | "success";

/** The POST body's own field names — what a `VALIDATION_ERROR.fields` map keys on. */
const FIELD_NAMES = [
  "repoUrl",
  "pat",
  "branch",
  "author",
  "dateFrom",
  "dateTo",
  "extraContext",
  "language",
] as const;
type FieldName = (typeof FIELD_NAMES)[number];
type FieldErrors = Partial<Record<FieldName, string>>;

function isFieldName(value: string): value is FieldName {
  return (FIELD_NAMES as readonly string[]).includes(value);
}

/**
 * The id a control points `aria-describedby` at: its error line when there is
 * one, otherwise its hint. `Field` below renders exactly one of the two under
 * the same ids, so the description a screen reader announces is always the line
 * that is actually on screen.
 */
function describedBy(id: string, error: string | undefined, hasHint: boolean): string | undefined {
  if (error) return `${id}-error`;
  return hasHint ? `${id}-hint` : undefined;
}

/** Whole days between two `YYYY-MM-DD` calendar dates. No timezone involved. */
function daysBetween(from: string, to: string): number {
  const parse = (value: string) => {
    const [y, m, d] = value.split("-").map(Number);
    return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

export function NewReportForm() {
  const { t, language } = useI18n();
  const router = useRouter();

  const ids = {
    repoUrl: useId(),
    pat: useId(),
    dateFrom: useId(),
    dateTo: useId(),
    branch: useId(),
    author: useId(),
    extraContext: useId(),
    formError: useId(),
  };

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
      router.replace(reportPath(jobId));
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
      <h1 className="m-0 font-display text-2xl font-semibold text-ink">
        {t("reports.new.heading")}
      </h1>

      <div className="cr-worksheet mt-8">
        {/* ------------------------------------------------------- fields --- */}
        <div className="min-w-0">
          <Group title={t("reports.new.section.repository")}>
            <Field
              id={ids.repoUrl}
              label={t("reports.new.repoUrl")}
              error={fieldErrors.repoUrl}
              hint={null}
            >
              <input
                id={ids.repoUrl}
                name="repoUrl"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder={t("reports.new.repoUrl.placeholder")}
                required
                disabled={busy}
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                aria-invalid={fieldErrors.repoUrl !== undefined}
                aria-describedby={describedBy(ids.repoUrl, fieldErrors.repoUrl, false)}
              />
            </Field>

            <label className="cr-check">
              <input
                type="checkbox"
                name="private"
                disabled={busy}
                checked={isPrivate}
                onChange={(event) => {
                  setIsPrivate(event.target.checked);
                  // Turning the toggle off drops the token immediately rather
                  // than leaving it in state where a later submit could send it.
                  if (!event.target.checked) setPat("");
                }}
              />
              {t("reports.new.private")}
            </label>

            {isPrivate ? (
              <Field
                id={ids.pat}
                label={t("reports.new.pat")}
                error={fieldErrors.pat}
                hint={t("reports.new.pat.hint")}
              >
                {/*
                  type=password + autoComplete="off": the browser must not offer
                  to remember this, and it is never written to localStorage or
                  sessionStorage — grep this repo, there is no such write.
                */}
                <input
                  id={ids.pat}
                  name="pat"
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={busy}
                  value={pat}
                  onChange={(event) => setPat(event.target.value)}
                  aria-invalid={fieldErrors.pat !== undefined}
                  aria-describedby={describedBy(ids.pat, fieldErrors.pat, true)}
                />
              </Field>
            ) : null}
          </Group>

          <Group title={t("reports.new.section.period")}>
            <fieldset className="m-0 border-0 p-0">
              <legend className="cr-legend mb-2">
                {t("reports.new.mode.label")}
              </legend>
              <div className="cr-segmented">
                {(["day", "range"] as const).map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="period-mode"
                      value={value}
                      disabled={busy}
                      checked={mode === value}
                      onChange={() => setMode(value)}
                    />
                    <span>{t(`reports.new.mode.${value}` as MessageKey)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-5 sm:flex-row sm:gap-4">
              <div className="min-w-0 sm:max-w-date sm:flex-1">
                <Field
                  id={ids.dateFrom}
                  label={mode === "day" ? t("reports.new.date.day") : t("reports.new.date.from")}
                  error={fieldErrors.dateFrom}
                  hint={t("reports.new.date.hint")}
                >
                  {/*
                    A native date input: its value IS the `YYYY-MM-DD` we send,
                    so nothing is parsed into a Date and nothing passes through
                    the browser's timezone (TASK-007 item 3).
                  */}
                  <input
                    id={ids.dateFrom}
                    name="dateFrom"
                    type="date"
                    className="cr-nums"
                    required
                    disabled={busy}
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    aria-invalid={fieldErrors.dateFrom !== undefined}
                    aria-describedby={describedBy(ids.dateFrom, fieldErrors.dateFrom, true)}
                  />
                </Field>
              </div>

              {mode === "range" ? (
                <div className="min-w-0 sm:max-w-date sm:flex-1">
                  <Field
                    id={ids.dateTo}
                    label={t("reports.new.date.to")}
                    error={fieldErrors.dateTo}
                    hint={null}
                  >
                    <input
                      id={ids.dateTo}
                      name="dateTo"
                      type="date"
                      className="cr-nums"
                      required
                      disabled={busy}
                      value={dateTo}
                      onChange={(event) => setDateTo(event.target.value)}
                      aria-invalid={fieldErrors.dateTo !== undefined}
                      aria-describedby={describedBy(ids.dateTo, fieldErrors.dateTo, false)}
                    />
                  </Field>
                </div>
              ) : null}
            </div>

            {/* In single-day mode the range error has no field of its own. */}
            {mode === "day" && fieldErrors.dateTo ? (
              <FieldError id={`${ids.dateTo}-error`} message={fieldErrors.dateTo} />
            ) : null}
          </Group>

          <Group title={t("reports.new.section.filters")} optionalLabel={t("common.optional")}>
            <div className="flex flex-col gap-5 sm:flex-row sm:gap-4">
              <div className="min-w-0 flex-1">
                <Field
                  id={ids.branch}
                  label={t("reports.new.branch")}
                  error={fieldErrors.branch}
                  hint={t("reports.new.branch.hint")}
                >
                  {/* Free text — no repo-discovered dropdown (REQ-001 §4.6). */}
                  <input
                    id={ids.branch}
                    name="branch"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={busy}
                    value={branch}
                    onChange={(event) => setBranch(event.target.value)}
                    aria-invalid={fieldErrors.branch !== undefined}
                    aria-describedby={describedBy(ids.branch, fieldErrors.branch, true)}
                  />
                </Field>
              </div>
              <div className="min-w-0 flex-1">
                <Field
                  id={ids.author}
                  label={t("reports.new.author")}
                  error={fieldErrors.author}
                  hint={t("reports.new.author.hint")}
                >
                  <input
                    id={ids.author}
                    name="author"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={busy}
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                    aria-invalid={fieldErrors.author !== undefined}
                    aria-describedby={describedBy(ids.author, fieldErrors.author, true)}
                  />
                </Field>
              </div>
            </div>
          </Group>

          <Group title={t("reports.new.section.report")}>
            <fieldset className="m-0 border-0 p-0">
              <legend className="cr-legend mb-2">
                {t("reports.new.language.label")}
              </legend>
              <div className="cr-segmented">
                {LANGUAGES.map((code) => (
                  <label key={code} title={t(`header.language.${code}` as MessageKey)}>
                    <input
                      type="radio"
                      name="report-language"
                      value={code}
                      disabled={busy}
                      checked={reportLanguage === code}
                      onChange={() => setReportLanguage(code)}
                    />
                    <span>{t(`header.language.${code}.short` as MessageKey)}</span>
                  </label>
                ))}
              </div>
              <p className="m-0 mt-2 text-xs text-muted">{t("reports.new.language.hint")}</p>
            </fieldset>

            <Field
              id={ids.extraContext}
              label={t("reports.new.extraContext")}
              error={fieldErrors.extraContext}
              hint={t("reports.new.extraContext.hint")}
            >
              <textarea
                id={ids.extraContext}
                name="extraContext"
                rows={6}
                disabled={busy}
                value={extraContext}
                onChange={(event) => setExtraContext(event.target.value)}
                aria-invalid={fieldErrors.extraContext !== undefined || counterOver}
                aria-describedby={describedBy(ids.extraContext, fieldErrors.extraContext, true)}
              />
              {/* Live counter, inside the field so it sits on the field's own
                  gap rather than needing a negative margin. `aria-live=polite`
                  keeps it from being announced on every keystroke. */}
              <p
                className={`cr-nums m-0 text-xs ${counterOver ? "font-semibold text-danger" : "text-muted"}`}
                aria-live="polite"
              >
                {contextLength.toLocaleString("en-US")} /{" "}
                {EXTRA_CONTEXT_MAX.toLocaleString("en-US")} {t("reports.new.extraContext.counter")}
              </p>
            </Field>
          </Group>
        </div>

        {/* --------------------------------------------------- the run rail --- */}
        <aside className="min-w-0 lg:sticky lg:top-10 lg:self-start">
          <div className="border-0 border-t border-solid border-t-rule-strong pt-4">
            <h2 className="m-0 font-body text-sm font-semibold tracking-wide text-muted">
              {t("reports.new.summary.heading")}
            </h2>

            <dl className="m-0 mt-4">
              <dt className="m-0 text-xs text-muted">{t("reports.new.summary.period")}</dt>
              <dd className="cr-nums m-0 mt-1 font-mono text-sm text-ink">
                {fromDisplay === null
                  ? t("reports.new.summary.empty")
                  : mode === "day" || fromDisplay === toDisplay
                    ? fromDisplay
                    : toDisplay === null
                      ? fromDisplay
                      : `${fromDisplay} – ${toDisplay}`}
              </dd>
            </dl>

            {formError ? (
              <p
                id={ids.formError}
                role="alert"
                className="m-0 mt-5 flex items-start gap-2 rounded border border-solid border-danger bg-danger-soft px-4 py-3 text-sm text-danger"
              >
                {/* Never colour alone — icon and words carry the state too. */}
                <AlertTriangle size={16} className="mt-1 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">{t("reports.new.errorTitle")}</strong>
                  {" — "}
                  {formError}
                  {orphanErrors.map((message) => (
                    <span key={message} className="mt-2 block">
                      {message}
                    </span>
                  ))}
                </span>
              </p>
            ) : null}

            <button
              type="submit"
              className="cr-btn cr-btn--primary mt-5 w-full"
              // Stays disabled through `success` as well: `router.replace` is
              // async, and a second click in that window would start a SECOND
              // job — tokenless, because the PAT has just been cleared
              // (Sober's TASK-007 review, minor 2).
              disabled={busy || phase === "success" || counterOver}
              data-loading={busy ? "true" : undefined}
              data-state={phase === "error" || phase === "success" ? phase : undefined}
              aria-describedby={formError ? ids.formError : undefined}
            >
              {showSpinner ? <span className="cr-spinner" aria-hidden="true" /> : null}
              {busy ? t("reports.new.submitting") : t("reports.new.submit")}
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------ primitives --- */

/**
 * A labelled group. The heading sits directly above its content in the same
 * column — never a tag-left/header-right two-column section head, which is a
 * named anti-pattern. Density varies by position rather than being uniform.
 */
function Group({
  title,
  optionalLabel,
  children,
}: {
  title: string;
  optionalLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 last:mb-0">
      <h2 className="m-0 mb-5 flex items-baseline gap-2 font-display text-base font-semibold text-ink">
        {title}
        {optionalLabel ? (
          <span className="font-body text-xs font-normal text-muted">({optionalLabel})</span>
        ) : null}
      </h2>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint: string | null;
  error: string | undefined;
  children: React.ReactNode;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className="cr-field" data-state={error ? "error" : undefined}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <FieldError id={errorId} message={error} />
      ) : hint ? (
        <p id={hintId} className="m-0 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="m-0 flex items-start gap-2 text-xs text-danger">
      <AlertTriangle size={14} className="mt-1 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
