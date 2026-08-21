import type { Committer } from "@/types/api/main";

/**
 * What the NewReport partial owns. Every declaration TASK-010 moved here came
 * verbatim from `NewReportForm.tsx` — no value changed. TASK-018 added the
 * period helpers, the list phase and the committer's `author` rule, and removed
 * `Mode` / `isMode` with the control they served.
 */

export const EXTRA_CONTEXT_MAX = 8000;
/** SPEC-001 validation: "range span ≤ 366 days". */
export const MAX_SPAN_DAYS = 366;

export type Phase = "idle" | "submitting" | "error" | "success";

/**
 * `Mode` / `isMode` lived here until TASK-018. The single-day / range switch was
 * deleted outright (REQ-004 Requirement 2), so the type had no reader left — the
 * period is now one range, and a single day is `dateFrom === dateTo`, which is
 * what the wire always said.
 */

/** How the branch list is doing. The rest of the form is locked unless "ready". */
export type ListPhase = "idle" | "loading" | "ready" | "empty" | "error";

/**
 * What the committer list sends as `author` (SPEC-003 Decision 2.3): the e-mail
 * when the entry has one, else the name. `--author` is matched as a fixed
 * string, and an address is the narrower needle.
 *
 * **One test, not two (Q-BE-19):** the backend always sends `email` as a string
 * and uses `""` for a commit with no author e-mail — never an omitted key, never
 * `null` — so there is no `undefined` branch to write.
 */
export function committerValue(committer: Committer): string {
  return committer.email === "" ? committer.name : committer.email;
}

/**
 * Today as the browser's own calendar day, `YYYY-MM-DD` (REQ-004 Requirement
 * 2a). Deliberately built from the local getters rather than `toISOString()`:
 * the latter converts to UTC first and shifts the answer by a day for most of
 * the evening in Asia/Bangkok.
 */
export function todayIso(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * `days` whole days before today, same local-calendar arithmetic. `0` is today.
 * Built by moving the date component, so month and year ends carry themselves.
 */
export function daysAgoIso(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() - days);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * The three relative presets (REQ-004 Requirement 3). Three and no more — a
 * preset row that needs scrolling is the same complaint again (TASK-018 §2).
 * Each one just sets the two dates; none of them submits anything.
 *
 * `back` is **inclusive of today**: "last 7 days" is today plus the six before
 * it, so the range the user gets contains seven calendar days — the reading the
 * words have. The wire values stay `YYYY-MM-DD` and the ≤366 rule is untouched.
 */
export const PERIOD_PRESETS = [
  { key: "today", labelKey: "reports.new.period.preset.today", back: 0 },
  { key: "last7", labelKey: "reports.new.period.preset.last7", back: 6 },
  { key: "last30", labelKey: "reports.new.period.preset.last30", back: 29 },
] as const;

/**
 * Where Mantine's `Input.Wrapper` puts each slot. Mantine's own default is
 * label → description → input → error; TASK-007's markup put the hint (and the
 * error that replaces it) UNDER the control, so the order is stated explicitly
 * rather than the screen silently moving every hint line (TASK-012).
 */
export const FIELD_WRAPPER_ORDER: ("label" | "input" | "description" | "error")[] = [
  "label",
  "input",
  "description",
  "error",
];

/** The POST body's own field names — what a `VALIDATION_ERROR.fields` map keys on. */
export const FIELD_NAMES = [
  "repoUrl",
  "pat",
  "branch",
  "author",
  "dateFrom",
  "dateTo",
  "extraContext",
  "language",
] as const;
export type FieldName = (typeof FIELD_NAMES)[number];
export type FieldErrors = Partial<Record<FieldName, string>>;

export function isFieldName(value: string): value is FieldName {
  return (FIELD_NAMES as readonly string[]).includes(value);
}

/*
 * `FieldIds` lived here until TASK-012. It existed so the hand-rolled `Field`
 * primitive could wire `htmlFor` / `aria-describedby` / the error id by hand.
 * Mantine's `Input.Wrapper` owns all three now, so the type had no reader left
 * and was removed with the controls that needed it.
 */
