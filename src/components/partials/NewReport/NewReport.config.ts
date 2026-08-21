/**
 * What the NewReport partial owns. Every declaration below was moved verbatim
 * from `NewReportForm.tsx` by TASK-010 — no value changed.
 */

export const EXTRA_CONTEXT_MAX = 8000;
/** SPEC-001 validation: "range span ≤ 366 days". */
export const MAX_SPAN_DAYS = 366;

export type Mode = "day" | "range";
export type Phase = "idle" | "submitting" | "error" | "success";

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

/** The ids the form's controls point `htmlFor` / `aria-describedby` at. */
export type FieldIds = {
  repoUrl: string;
  pat: string;
  dateFrom: string;
  dateTo: string;
  branch: string;
  author: string;
  extraContext: string;
};
