/**
 * What the NewReport partial owns. Every declaration below was moved verbatim
 * from `NewReportForm.tsx` by TASK-010 — no value changed.
 */

export const EXTRA_CONTEXT_MAX = 8000;
/** SPEC-001 validation: "range span ≤ 366 days". */
export const MAX_SPAN_DAYS = 366;

export type Mode = "day" | "range";
export type Phase = "idle" | "submitting" | "error" | "success";

export function isMode(value: string): value is Mode {
  return value === "day" || value === "range";
}

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
