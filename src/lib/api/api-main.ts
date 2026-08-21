import type { Language } from "@/constant/text";
import { apiRequest } from "@/lib/api/client";
import type {
  BranchesInput,
  BranchesResponse,
  CommittersInput,
  CommittersResponse,
  CreateReportInput,
  ReportJob,
  SessionUser,
} from "@/types/api/main";

/**
 * One typed function per backend endpoint. "main" is the backend this app has —
 * the skill's `api-<service>.ts` convention with exactly one service.
 *
 * Every declaration below was moved verbatim from the original
 * `lib/api/client.ts` by TASK-010: same path, same method, same body, same
 * return shape.
 */

/* ------------------------------------------------------------------ auth --- */

export async function fetchMe(language: Language, signal?: AbortSignal): Promise<SessionUser> {
  const data = await apiRequest<{ user: SessionUser }>("/auth/me", {
    language,
    expect401: true,
    ...(signal ? { signal } : {}),
  });
  return data.user;
}

export async function login(
  credentials: { username: string; password: string },
  language: Language,
): Promise<SessionUser> {
  const data = await apiRequest<{ user: SessionUser }>("/auth/login", {
    method: "POST",
    body: credentials,
    language,
    // A 401 here is INVALID_CREDENTIALS, shown inline — not a session timeout.
    expect401: true,
  });
  return data.user;
}

export async function logout(language: Language): Promise<void> {
  await apiRequest<void>("/auth/logout", { method: "POST", language });
}

/* --------------------------------------------------------------- reports --- */

export async function createReport(
  input: CreateReportInput,
  language: Language,
): Promise<{ jobId: string }> {
  return apiRequest<{ jobId: string }>("/reports", {
    method: "POST",
    body: input,
    language,
  });
}

export async function fetchReport(
  jobId: string,
  language: Language,
  signal?: AbortSignal,
): Promise<ReportJob> {
  return apiRequest<ReportJob>(`/reports/${encodeURIComponent(jobId)}`, {
    language,
    ...(signal ? { signal } : {}),
  });
}

/* ------------------------------------------------- repository inspection --- */

/**
 * SPEC-003 / TASK-017. Both are POSTs even though they only read: the request
 * carries a `pat`, and a token must never travel in a URL or a query string
 * (REQ-001 §11 — the same reason `createReport` is a POST).
 */

export async function fetchBranches(
  input: BranchesInput,
  language: Language,
  signal?: AbortSignal,
): Promise<BranchesResponse> {
  return apiRequest<BranchesResponse>("/repos/branches", {
    method: "POST",
    body: input,
    language,
    ...(signal ? { signal } : {}),
  });
}

export async function fetchCommitters(
  input: CommittersInput,
  language: Language,
  signal?: AbortSignal,
): Promise<CommittersResponse> {
  return apiRequest<CommittersResponse>("/repos/committers", {
    method: "POST",
    body: input,
    language,
    ...(signal ? { signal } : {}),
  });
}
