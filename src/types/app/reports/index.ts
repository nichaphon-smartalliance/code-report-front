import type { Language } from "@/constant/text";
import type { ApiError } from "@/lib/api/client";
import type { ReportJob } from "@/types/api/main";

/**
 * Frontend-only domain types for the report screens — shapes the backend never
 * sees. Moved verbatim by TASK-010 from `lib/reports/retry.ts` (`RetryParams`)
 * and `lib/reports/useReportJob.ts` (`ReportJobState`).
 */

/**
 * The handoff payload for both ways back to the form — "try again" (TASK-008)
 * and plain Back (TASK-019 / REQ-004 Requirement 4a). There is no `pat` key in
 * this type and none in the response it is built from (SPEC-001: `params` is
 * "never `pat`"), so the token cannot travel this way even by accident.
 *
 * `extraContext` is the **seventh** key, added by TASK-018 for REQ-004
 * Requirement 4b (Q-SA-20 = "เก็บด้วย"). It is the one value here the API cannot
 * supply: `GET /api/reports/:jobId` returns `params` with six keys and this is
 * not one of them, so only the form-side writer can populate it — see
 * `lib/storage/retryParams.ts`.
 */
export type RetryParams = {
  repoUrl: string;
  branch: string;
  author: string;
  dateFrom: string;
  dateTo: string;
  language: Language;
  extraContext: string;
};

/**
 * What the report page can write: the six keys it can actually source from
 * `job.params`. `extraContext` is deliberately absent — the page has no value
 * for it, and the writer that takes this shape preserves whatever the form
 * already stored.
 */
export type RunRetryParams = Omit<RetryParams, "extraContext">;

export type ReportJobState = {
  job: ReportJob | null;
  /** The run could not be loaded at all — a server error, shown verbatim. */
  loadError: ApiError | null;
  /** The browser could not reach the server; polling keeps trying. */
  offline: boolean;
  polling: boolean;
};
