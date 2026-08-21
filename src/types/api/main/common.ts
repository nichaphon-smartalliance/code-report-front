/**
 * Shapes shared by every backend response. Moved verbatim from
 * `lib/api/client.ts` by TASK-010 — no field was added, removed or renamed.
 */

/** The SPEC-001 error envelope's inner object. */
export type ApiErrorBody = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};
