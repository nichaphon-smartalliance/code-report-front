import type { Language } from "@/lib/i18n/dictionaries";

/**
 * The ONE place that talks to the backend (TASK-006 item 5).
 *
 * Q-SA-5 default (TASK-006 `## Questions`): frontend and backend are served on
 * the same origin with `/api/*` proxied to the backend, so the base URL is a
 * path, not a hostname, and there is no CORS. If the stakeholder's deployment
 * turns out to be split-origin, this constant is the single edit.
 */
export const API_BASE_URL = process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "/api";

/** SPEC-001 "Error codes (single source of truth)". */
export const AUTH_REQUIRED = "AUTH_REQUIRED";
export const VALIDATION_ERROR = "VALIDATION_ERROR";

export type ApiErrorBody = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

/**
 * `message` is carried verbatim from the server. SPEC-001: the backend already
 * localises it via `Accept-Language`, and "the frontend never composes error
 * text from a code". Nothing in this app maps a code to a string.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields: Record<string, string> | undefined;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.fields = body.fields;
  }
}

/**
 * The request never left the browser (offline, DNS, proxy down). There is no
 * server `message` to show, so the caller supplies one from the dictionary.
 */
export class NetworkError extends Error {
  constructor() {
    super("network");
    this.name = "NetworkError";
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/**
 * SPEC-001: "any `401 AUTH_REQUIRED` from any call redirects to login with a
 * session-expired message". The session provider registers the redirect here so
 * every call in the app gets the behaviour without repeating it.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

export type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  language: Language;
  signal?: AbortSignal;
  /** Set on `GET /api/auth/me`, whose 401 is the normal "not logged in" answer. */
  expect401?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = "GET", body, language, signal, expect401 = false } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
    // Controls UI chrome and server error messages. The REPORT language is a
    // separate field in the POST body (SPEC-001) — they may differ.
    "Accept-Language": language,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      // The session is an HttpOnly cookie; the client never reads or stores it.
      credentials: "include",
      cache: "no-store",
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(signal ? { signal } : {}),
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new NetworkError();
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = toApiError(response.status, payload);
    if (error.status === 401 && error.code === AUTH_REQUIRED && !expect401) onUnauthorized?.();
    throw error;
  }

  return payload as T;
}

function toApiError(status: number, payload: unknown): ApiError {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "object" &&
    (payload as { error: unknown }).error !== null
  ) {
    const body = (payload as { error: Record<string, unknown> }).error;
    if (typeof body["code"] === "string" && typeof body["message"] === "string") {
      return new ApiError(status, {
        code: body["code"],
        message: body["message"],
        ...(isFieldMap(body["fields"]) ? { fields: body["fields"] } : {}),
      });
    }
  }
  // The response was not the SPEC-001 envelope at all (a proxy error page, say).
  // We have no server-authored message, so the caller falls back to the
  // dictionary's network string rather than inventing text for a code.
  throw new NetworkError();
}

function isFieldMap(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

/* ------------------------------------------------------------------ auth --- */

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
};

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
