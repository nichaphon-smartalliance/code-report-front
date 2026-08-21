"use client";

import { AlertTriangle } from "lucide-react";
import { LANGUAGES, type Language, type MessageKey } from "@/constant/text";
import { useI18n } from "@/context/i18n";
import {
  EXTRA_CONTEXT_MAX,
  type FieldErrors,
  type FieldIds,
  type Mode,
} from "./NewReport.config";

/**
 * The form's field column. Shed out of `NewReportForm.tsx` by TASK-010: the
 * JSX, the classes, the comments and the three local primitives below moved
 * verbatim, and the state they read is now handed in as props instead of being
 * closed over. No control, attribute or copy key was changed.
 */

export type NewReportFieldsProps = {
  ids: FieldIds;
  busy: boolean;
  fieldErrors: FieldErrors;
  repoUrl: string;
  onRepoUrlChange: (value: string) => void;
  isPrivate: boolean;
  onIsPrivateChange: (value: boolean) => void;
  pat: string;
  onPatChange: (value: string) => void;
  mode: Mode;
  onModeChange: (value: Mode) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  branch: string;
  onBranchChange: (value: string) => void;
  author: string;
  onAuthorChange: (value: string) => void;
  reportLanguage: Language;
  onReportLanguageChange: (value: Language) => void;
  extraContext: string;
  onExtraContextChange: (value: string) => void;
  contextLength: number;
  counterOver: boolean;
};

export function NewReportFields({
  ids,
  busy,
  fieldErrors,
  repoUrl,
  onRepoUrlChange,
  isPrivate,
  onIsPrivateChange,
  pat,
  onPatChange,
  mode,
  onModeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  branch,
  onBranchChange,
  author,
  onAuthorChange,
  reportLanguage,
  onReportLanguageChange,
  extraContext,
  onExtraContextChange,
  contextLength,
  counterOver,
}: NewReportFieldsProps) {
  const { t } = useI18n();

  return (
    <div className="min-w-0">
      <Group title={t("reports.new.section.repository")}>
        <Field id={ids.repoUrl} label={t("reports.new.repoUrl")} error={fieldErrors.repoUrl} hint={null}>
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
            onChange={(event) => onRepoUrlChange(event.target.value)}
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
              onIsPrivateChange(event.target.checked);
              // Turning the toggle off drops the token immediately rather
              // than leaving it in state where a later submit could send it.
              if (!event.target.checked) onPatChange("");
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
              onChange={(event) => onPatChange(event.target.value)}
              aria-invalid={fieldErrors.pat !== undefined}
              aria-describedby={describedBy(ids.pat, fieldErrors.pat, true)}
            />
          </Field>
        ) : null}
      </Group>

      <Group title={t("reports.new.section.period")}>
        <fieldset className="m-0 border-0 p-0">
          <legend className="cr-legend mb-2">{t("reports.new.mode.label")}</legend>
          <div className="cr-segmented">
            {(["day", "range"] as const).map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="period-mode"
                  value={value}
                  disabled={busy}
                  checked={mode === value}
                  onChange={() => onModeChange(value)}
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
                onChange={(event) => onDateFromChange(event.target.value)}
                aria-invalid={fieldErrors.dateFrom !== undefined}
                aria-describedby={describedBy(ids.dateFrom, fieldErrors.dateFrom, true)}
              />
            </Field>
          </div>

          {mode === "range" ? (
            <div className="min-w-0 sm:max-w-date sm:flex-1">
              <Field id={ids.dateTo} label={t("reports.new.date.to")} error={fieldErrors.dateTo} hint={null}>
                <input
                  id={ids.dateTo}
                  name="dateTo"
                  type="date"
                  className="cr-nums"
                  required
                  disabled={busy}
                  value={dateTo}
                  onChange={(event) => onDateToChange(event.target.value)}
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
                onChange={(event) => onBranchChange(event.target.value)}
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
                onChange={(event) => onAuthorChange(event.target.value)}
                aria-invalid={fieldErrors.author !== undefined}
                aria-describedby={describedBy(ids.author, fieldErrors.author, true)}
              />
            </Field>
          </div>
        </div>
      </Group>

      <Group title={t("reports.new.section.report")}>
        <fieldset className="m-0 border-0 p-0">
          <legend className="cr-legend mb-2">{t("reports.new.language.label")}</legend>
          <div className="cr-segmented">
            {LANGUAGES.map((code) => (
              <label key={code} title={t(`header.language.${code}` as MessageKey)}>
                <input
                  type="radio"
                  name="report-language"
                  value={code}
                  disabled={busy}
                  checked={reportLanguage === code}
                  onChange={() => onReportLanguageChange(code)}
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
            onChange={(event) => onExtraContextChange(event.target.value)}
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
  );
}

/* ------------------------------------------------------------ primitives --- */

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
