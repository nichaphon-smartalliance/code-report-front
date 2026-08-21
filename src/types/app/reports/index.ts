import type { Language } from "@/constant/text";
import type { ApiError } from "@/lib/api/client";
import type { ReportJob } from "@/types/api/main";

/**
 * Frontend-only domain types for the report screens — shapes the backend never
 * sees. Moved verbatim by TASK-010 from `lib/reports/retry.ts` (`RetryParams`)
 * and `lib/reports/useReportJob.ts` (`ReportJobState`).
 */

/**
 * The "try again" handoff payload. There is no `pat` key in this type and none
 * in the response it is built from (SPEC-001: `params` is "never `pat`"), so
 * the token cannot travel this way even by accident.
 */
export type RetryParams = {
  repoUrl: string;
  branch: string;
  author: string;
  dateFrom: string;
  dateTo: string;
  language: Language;
};

export type ReportJobState = {
  job: ReportJob | null;
  /** The run could not be loaded at all — a server error, shown verbatim. */
  loadError: ApiError | null;
  /** The browser could not reach the server; polling keeps trying. */
  offline: boolean;
  polling: boolean;
};
