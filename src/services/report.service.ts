import type { Language } from "@/constant/text";
import { createReport as createReportRequest, fetchReport as fetchReportRequest } from "@/lib/api/api-main";
import type { CreateReportInput, ReportJob } from "@/types/api/main";

/** What the app imports for reports. Thin wrappers — see `auth.service.ts`. */

export function createReport(
  input: CreateReportInput,
  language: Language,
): Promise<{ jobId: string }> {
  return createReportRequest(input, language);
}

export function fetchReport(
  jobId: string,
  language: Language,
  signal?: AbortSignal,
): Promise<ReportJob> {
  return fetchReportRequest(jobId, language, signal);
}
