import type { Language } from "@/constant/text";

/**
 * `POST /api/reports` and `GET /api/reports/:jobId` shapes, and the two
 * enumerations SPEC-001 defines for them. Moved verbatim from
 * `lib/api/client.ts` by TASK-010 — no value, key or comment was changed.
 */

/**
 * The `POST /api/reports` body, exactly as SPEC-001 defines it.
 *
 * `pat` is optional and **must be absent, not empty**, for a public repository —
 * the form omits the key entirely rather than sending `"pat": ""`. It exists in
 * this object for the length of one `fetch` and is never persisted anywhere
 * (REQ-001 §11; SPEC-001 Non-functional → PAT handling).
 *
 * `dateFrom`/`dateTo` are plain `YYYY-MM-DD` Gregorian strings taken straight
 * from the date inputs — the browser's timezone never touches them, and a
 * single day is `dateFrom === dateTo`.
 */
export type CreateReportInput = {
  repoUrl: string;
  pat?: string;
  branch?: string;
  author?: string;
  dateFrom: string;
  dateTo: string;
  extraContext?: string;
  language: Language;
};

/** SPEC-001 `GET /api/reports/:jobId` — `status`. */
export const REPORT_STATUSES = ["QUEUED", "RUNNING", "DONE", "NO_COMMITS", "FAILED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/**
 * The terminal statuses. `NO_COMMITS` is a **successful** outcome, not an error
 * (SPEC-001 "Error codes"; REQ-001 AC 5) — it is terminal for polling and
 * nothing more.
 */
export const TERMINAL_STATUSES: readonly ReportStatus[] = ["DONE", "NO_COMMITS", "FAILED"];

/** SPEC-001 `stage` — the seven-step worker, `null` before it starts. */
export const REPORT_STAGES = [
  "CLONING",
  "READING_CODEBASE",
  "READING_COMMITS",
  "AI_PROJECT",
  "AI_COMMITS",
  "AI_WRITING",
] as const;
export type ReportStage = (typeof REPORT_STAGES)[number];

/**
 * The run's own parameters, echoed back so the reader knows what they are
 * looking at. **`pat` is not in this response and must never be displayed** —
 * SPEC-001 marks the field "never `pat`", and this type has no such key.
 */
export type ReportParams = {
  repoUrl: string;
  branch?: string | null;
  author?: string | null;
  dateFrom: string;
  dateTo: string;
  language: Language;
};

export type ReportJob = {
  jobId: string;
  status: ReportStatus;
  stage?: ReportStage | null;
  progress?: { current: number; total: number } | null;
  params: ReportParams;
  commitCount?: number | null;
  /** Only when `status === "DONE"` (and the templated note when `NO_COMMITS`). */
  report?: { markdown: string; language: Language } | null;
  /** Only when `status === "FAILED"`. `message` is shown verbatim. */
  error?: { code: string; message: string } | null;
};
