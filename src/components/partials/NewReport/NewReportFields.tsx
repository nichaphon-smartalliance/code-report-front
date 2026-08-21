"use client";

import {
  Box,
  Button,
  Checkbox,
  Group,
  SegmentedControl,
  Select,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { AlertTriangle } from "lucide-react";
import { LANGUAGES, type Language, type MessageKey } from "@/constant/text";
import { useI18n } from "@/context/i18n";
import type { Committer } from "@/types/api/main";
import {
  committerValue,
  daysAgoIso,
  EXTRA_CONTEXT_MAX,
  FIELD_WRAPPER_ORDER,
  PERIOD_PRESETS,
  todayIso,
  type FieldErrors,
  type ListPhase,
} from "./NewReport.config";

/**
 * The form's field column, rebuilt Mantine-first and redesigned by TASK-012 in
 * the cobalt register the shell and login already speak, and re-shaped by
 * TASK-018 (SPEC-003 §"Flow — the re-shaped form").
 *
 * Every control is a `@mantine/core` component — no native input, select,
 * textarea, label or button element is written on this screen at all
 * (SPEC-002 Decision 3 rule 2). The three local primitives TASK-010 moved here
 * (`Field`, `FieldError`, `describedBy`) are gone with the native controls they
 * wrapped: Mantine's `Input.Wrapper` owns the label/description/error slots and
 * their `aria-describedby` wiring, so re-implementing them would be a second
 * system.
 *
 * **What TASK-018 re-shaped, and the field order it follows** (Requirement 1a is
 * a *screen* rule, so the order is part of the requirement): repository URL →
 * private toggle + token → load branches → branch `Select` → period → committer
 * → extra context, language, submit. The branch therefore sits in the repository
 * section, not in "Filters": it is what the rest of the form is gated on, and a
 * gate below the thing it gates is not a gate.
 *
 * Everything from the period down is disabled until that list has loaded
 * (`unlocked`). There is deliberately **no typed-branch fallback** anywhere on
 * this screen (Q27), and on a failure the only text shown is the server's own.
 *
 * NO EXISTING COPY CHANGED. The keys added here are the twelve the stakeholder
 * approved as authored (Q-SA-19); the two typing hints and the period-mode keys
 * went with the controls that read them.
 *
 * The one deliberate a11y carry-over: an error line is announced, so the error
 * node passed to Mantine carries `role="alert"` and an icon. Danger is never
 * hue alone.
 */

export type NewReportFieldsProps = {
  busy: boolean;
  /** The branch list has loaded and is non-empty (REQ-004 Requirement 1a). */
  unlocked: boolean;
  fieldErrors: FieldErrors;
  repoUrl: string;
  onRepoUrlChange: (value: string) => void;
  isPrivate: boolean;
  onIsPrivateChange: (value: boolean) => void;
  pat: string;
  onPatChange: (value: string) => void;
  branches: string[];
  branchPhase: ListPhase;
  /** The server's own `message`, never composed from a code (SPEC-001). */
  branchLoadError: string | null;
  onLoadBranches: () => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onPreset: (from: string, to: string) => void;
  branch: string;
  onBranchChange: (value: string) => void;
  author: string;
  onAuthorChange: (value: string) => void;
  committers: Committer[];
  committerPhase: ListPhase;
  committerLoadError: string | null;
  canLoadCommitters: boolean;
  onLoadCommitters: () => void;
  reportLanguage: Language;
  onReportLanguageChange: (value: Language) => void;
  extraContext: string;
  onExtraContextChange: (value: string) => void;
  contextLength: number;
  counterOver: boolean;
};

export function NewReportFields({
  busy,
  unlocked,
  fieldErrors,
  repoUrl,
  onRepoUrlChange,
  isPrivate,
  onIsPrivateChange,
  pat,
  onPatChange,
  branches,
  branchPhase,
  branchLoadError,
  onLoadBranches,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onPreset,
  branch,
  onBranchChange,
  author,
  onAuthorChange,
  committers,
  committerPhase,
  committerLoadError,
  canLoadCommitters,
  onLoadCommitters,
  reportLanguage,
  onReportLanguageChange,
  extraContext,
  onExtraContextChange,
  contextLength,
  counterOver,
}: NewReportFieldsProps) {
  const { t } = useI18n();

  const branchLoading = branchPhase === "loading";
  const committerLoading = committerPhase === "loading";

  /** "Everyone" is the empty value, and it sends no `author` key at all. */
  const committerData = [
    { value: "", label: t("reports.new.author.everyone") },
    ...committers.map((entry) => ({
      value: committerValue(entry),
      // The person and their commit count, composed from the data rather than
      // from a new dictionary string.
      label: `${entry.name} · ${entry.commits.toLocaleString("en-US")}`,
    })),
  ];

  return (
    <Box className="min-w-0">
      {/* ------------------------------------------------------ repository --- */}
      <Section title={t("reports.new.section.repository")}>
        <Box className="cr-sheet__fields cr-sheet__fields--airy">
          <TextInput
            name="repoUrl"
            type="url"
            inputMode="url"
            label={t("reports.new.repoUrl")}
            placeholder={t("reports.new.repoUrl.placeholder")}
            autoComplete="off"
            spellCheck={false}
            required
            withAsterisk={false}
            disabled={busy}
            value={repoUrl}
            onChange={(event) => onRepoUrlChange(event.currentTarget.value)}
            error={fieldError(fieldErrors.repoUrl)}
            inputWrapperOrder={FIELD_WRAPPER_ORDER}
          />

          {/* The whole label row is the hit target, not just the 20px box —
              measured, because a bare Mantine `Checkbox` gives a 20px target
              and the floor is 44 (FRONTEND-STANDARD §3 gate 2). The old
              hand-rolled `.cr-check` did this by making the row the label; the
              same move, expressed through Mantine's own Styles API. */}
          <Group>
            <Checkbox
              name="private"
              label={t("reports.new.private")}
              styles={{
                body: { alignItems: "center" },
                label: {
                  display: "flex",
                  alignItems: "center",
                  minHeight: "var(--control-h)",
                  cursor: "pointer",
                },
                input: { cursor: "pointer" },
              }}
              disabled={busy}
              checked={isPrivate}
              onChange={(event) => onIsPrivateChange(event.currentTarget.checked)}
            />
          </Group>

          {isPrivate ? (
            // `TextInput type="password"`, not Mantine's `PasswordInput` — the
            // same call TASK-011 made on the login screen and Sober upheld
            // (Q-FE-12): `PasswordInput` forces a reveal toggle SPEC-002 does
            // not specify, a 28px hit target, and an English-only `aria-label`
            // baked into the library.
            // It is never written to localStorage or sessionStorage — grep this
            // repo, there is no such write.
            <TextInput
              name="pat"
              type="password"
              label={t("reports.new.pat")}
              description={fieldErrors.pat === undefined ? t("reports.new.pat.hint") : undefined}
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
              value={pat}
              onChange={(event) => onPatChange(event.currentTarget.value)}
              error={fieldError(fieldErrors.pat)}
              inputWrapperOrder={FIELD_WRAPPER_ORDER}
            />
          ) : null}

          {/* One deliberate action, never a fetch on keystroke or blur: each
              load is a real request against a real remote (SPEC-003 Decision
              1 / 2.2). */}
          <Group align="flex-end" gap="var(--space-3)" className="flex-col items-stretch sm:flex-row">
            <Box className="min-w-0 flex-1">
              <Select
                name="branch"
                label={t("reports.new.branch")}
                placeholder={t("reports.new.branch.select")}
                // Not editable and not creatable: there is no typed-branch
                // fallback on this screen at all (Requirement 1a, Q27).
                searchable={false}
                allowDeselect={false}
                disabled={busy || !unlocked}
                data={branches}
                value={branch === "" ? null : branch}
                onChange={(value) => onBranchChange(value ?? "")}
                error={fieldError(fieldErrors.branch)}
                inputWrapperOrder={FIELD_WRAPPER_ORDER}
              />
            </Box>
            <Button
              type="button"
              variant="default"
              disabled={busy}
              loading={branchLoading}
              onClick={onLoadBranches}
            >
              {branchLoading ? t("reports.new.branch.loading") : t("reports.new.branch.load")}
            </Button>
          </Group>

          {/* Three locked states, three different lines — and the failure line
              is the SERVER's, never one of ours (SPEC-001). */}
          {branchLoadError !== null ? (
            <Notice message={branchLoadError} danger />
          ) : branchPhase === "empty" ? (
            <Notice message={t("reports.new.branch.empty")} danger />
          ) : !unlocked ? (
            <Notice message={t("reports.new.branch.locked")} />
          ) : null}
        </Box>
      </Section>

      {/* ---------------------------------------------------------- period --- */}
      <Section title={t("reports.new.section.period")}>
        <Box className="cr-sheet__fields">
          {/* One range, pre-filled today → today (Requirement 2/2a). The
              single-day / range switch is gone outright — a single day is
              simply the same date twice, which is what the wire always said. */}
          <Box className="flex flex-col gap-5 sm:flex-row sm:gap-4">
            <Box className="min-w-0 sm:max-w-date sm:flex-1">
              {/*
                A date input, wearing Mantine's `Input` chrome: its value IS the
                `YYYY-MM-DD` we send, so nothing is parsed into a Date and
                nothing passes through the browser's timezone (TASK-007 item 3).
                On `@mantine/dates` — and why it is not here — see `## Questions`
                Q-FE-16 in TASK-012.
              */}
              <TextInput
                name="dateFrom"
                type="date"
                classNames={{ input: "cr-nums" }}
                label={t("reports.new.date.from")}
                description={
                  fieldErrors.dateFrom === undefined ? t("reports.new.date.hint") : undefined
                }
                required
                withAsterisk={false}
                disabled={busy || !unlocked}
                value={dateFrom}
                onChange={(event) => onDateFromChange(event.currentTarget.value)}
                error={fieldError(fieldErrors.dateFrom)}
                inputWrapperOrder={FIELD_WRAPPER_ORDER}
              />
            </Box>

            <Box className="min-w-0 sm:max-w-date sm:flex-1">
              <TextInput
                name="dateTo"
                type="date"
                classNames={{ input: "cr-nums" }}
                label={t("reports.new.date.to")}
                required
                withAsterisk={false}
                disabled={busy || !unlocked}
                value={dateTo}
                onChange={(event) => onDateToChange(event.currentTarget.value)}
                error={fieldError(fieldErrors.dateTo)}
                inputWrapperOrder={FIELD_WRAPPER_ORDER}
              />
            </Box>
          </Box>

          {/* Three relative presets and no more (Requirement 3). Each one only
              sets the two dates above; none of them submits anything. */}
          <Group gap="var(--space-2)">
            {PERIOD_PRESETS.map((preset) => (
              <Button
                key={preset.key}
                type="button"
                variant="default"
                size="xs"
                disabled={busy || !unlocked}
                onClick={() => onPreset(daysAgoIso(preset.back), todayIso())}
              >
                {t(preset.labelKey as MessageKey)}
              </Button>
            ))}
          </Group>
        </Box>
      </Section>

      {/* --------------------------------------------------------- filters --- */}
      <Section title={t("reports.new.section.filters")} optionalLabel={t("common.optional")}>
        {/* The optional section is the tightest on the sheet — density varies by
            what the section is for, it is not one padding value repeated. */}
        <Box className="cr-sheet__fields cr-sheet__fields--tight">
          {/* The committer list is a clone, so it is never fetched
              automatically (SPEC-003 Decision 2.2) — and it needs a branch and
              a valid range, so the action is unavailable until it has both. */}
          <Group align="flex-end" gap="var(--space-3)" className="flex-col items-stretch sm:flex-row">
            <Box className="min-w-0 flex-1">
              <Select
                name="author"
                label={t("reports.new.author")}
                searchable={false}
                allowDeselect={false}
                disabled={busy || !unlocked}
                data={committerData}
                value={author}
                onChange={(value) => onAuthorChange(value ?? "")}
                error={fieldError(fieldErrors.author)}
                inputWrapperOrder={FIELD_WRAPPER_ORDER}
              />
            </Box>
            <Button
              type="button"
              variant="default"
              disabled={busy || !canLoadCommitters}
              loading={committerLoading}
              onClick={onLoadCommitters}
            >
              {committerLoading ? t("reports.new.author.loading") : t("reports.new.author.load")}
            </Button>
          </Group>

          {committerLoadError !== null ? (
            <Notice message={committerLoadError} danger />
          ) : committerPhase === "empty" ? (
            <Notice message={t("reports.new.author.empty")} />
          ) : null}
        </Box>
      </Section>

      {/* ---------------------------------------------------------- report --- */}
      <Section title={t("reports.new.section.report")}>
        <Box className="cr-sheet__fields">
          <Box component="fieldset" className="m-0 border-0 p-0">
            <Box component="legend" className="cr-legend mb-2">
              {t("reports.new.language.label")}
            </Box>
            <SegmentedControl
              className="cr-seg"
              name="report-language"
              disabled={busy || !unlocked}
              value={reportLanguage}
              onChange={(value) => {
                if (isLanguageValue(value)) onReportLanguageChange(value);
              }}
              data={LANGUAGES.map((code) => ({
                value: code,
                // The full language name stays on `title`, exactly as TASK-007
                // had it — a supplement to the visible TH/EN, never the only cue.
                label: (
                  <span title={t(`header.language.${code}` as MessageKey)}>
                    {t(`header.language.${code}.short` as MessageKey)}
                  </span>
                ),
              }))}
            />
            <Text component="p" className="m-0 mt-2" fz="0.75rem" c="var(--color-muted)">
              {t("reports.new.language.hint")}
            </Text>
          </Box>

          <Textarea
            name="extraContext"
            label={t("reports.new.extraContext")}
            description={
              fieldErrors.extraContext === undefined
                ? t("reports.new.extraContext.hint")
                : undefined
            }
            rows={6}
            resize="vertical"
            disabled={busy || !unlocked}
            value={extraContext}
            onChange={(event) => onExtraContextChange(event.currentTarget.value)}
            error={fieldError(fieldErrors.extraContext)}
            aria-invalid={fieldErrors.extraContext !== undefined || counterOver}
            inputWrapperOrder={FIELD_WRAPPER_ORDER}
          />
          {/* Live counter. `aria-live=polite` keeps it from being announced on
              every keystroke; over the limit it gains weight as well as colour,
              because hue is never the only cue. */}
          <Text
            component="p"
            className="cr-nums m-0"
            fz="0.75rem"
            fw={counterOver ? 600 : 400}
            c={counterOver ? "var(--color-danger)" : "var(--color-muted)"}
            aria-live="polite"
          >
            {contextLength.toLocaleString("en-US")} /{" "}
            {EXTRA_CONTEXT_MAX.toLocaleString("en-US")} {t("reports.new.extraContext.counter")}
          </Text>
        </Box>
      </Section>
    </Box>
  );
}

/* ------------------------------------------------------------ primitives --- */

/** `Language` is the i18n contract, so the narrowing lives with the values. */
function isLanguageValue(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

/**
 * What Mantine's `error` slot receives. `undefined` keeps the slot closed (and
 * `aria-invalid` off); a message arrives with its icon and is announced, so the
 * state is never carried by colour alone (FRONTEND-STANDARD §2).
 */
function fieldError(message: string | undefined) {
  if (message === undefined) return undefined;
  return (
    <span className="cr-fielderror" role="alert">
      <AlertTriangle size={14} className="cr-fielderror__icon" aria-hidden="true" />
      <span>{message}</span>
    </span>
  );
}

/**
 * A line about the state of a list — the locked/empty explanations, and the
 * server's own failure message shown verbatim. The same notice object the rest
 * of the app uses: a hairline all the way round, an icon and words beside the
 * surface, never a colour on its own and never a thick coloured left stripe.
 */
function Notice({ message, danger = false }: { message: string; danger?: boolean }) {
  return (
    <Text
      component="p"
      role={danger ? "alert" : "status"}
      className={danger ? "cr-notice cr-notice--danger" : "cr-notice"}
    >
      <AlertTriangle size={16} className="cr-notice__icon" aria-hidden="true" />
      <span>{message}</span>
    </Text>
  );
}

/**
 * A section of the sheet. TASK-007 gave each of the four an identical `mb-10`
 * and a free-floating heading; the redesign separates them with a hairline that
 * runs the field measure and sets the heading directly under it — the heading
 * stays in the same column as its content, never a tag-left / header-right
 * two-column section head, which is a named hard ban.
 */
function Section({
  title,
  optionalLabel,
  children,
}: {
  title: string;
  optionalLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Box component="section" className="cr-sheet__section">
      <Group gap="var(--space-2)" align="baseline" className="mb-5">
        <Title order={2} fz="1rem" fw={600} c="var(--color-ink)">
          {title}
        </Title>
        {optionalLabel ? (
          <Text component="span" fz="0.75rem" c="var(--color-muted)">
            ({optionalLabel})
          </Text>
        ) : null}
      </Group>
      {children}
    </Box>
  );
}
