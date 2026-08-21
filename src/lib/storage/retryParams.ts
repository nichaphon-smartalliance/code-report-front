"use client";

import { DEFAULT_LANGUAGE, isLanguage } from "@/constant/text";
import type { RetryParams, RunRetryParams } from "@/types/app/reports";

/**
 * The handoff back to the form: a FAILED run's "try again" (TASK-008 item 5)
 * and, since TASK-019, every way back from the report page — with the same
 * parameters prefilled **except the PAT, which is never re-populated**.
 *
 * There is no `pat` key in this type and none in the response it is built from
 * (SPEC-001: `params` is "never `pat`"), so the token cannot travel this way
 * even by accident.
 *
 * Why `sessionStorage` and not the URL: a query string would put the repository
 * URL and the author's email address in the address bar, in history and in any
 * shared link. This is a one-tab, one-hop handoff — **written by the form on
 * submit and rewritten by the report page as soon as it has the job** (neither
 * is on a click: browser Back never runs a handler of ours), read once on the
 * form's next mount, and removed as it is read.
 */
const RETRY_KEY = "cr.retryParams";

/** The payload's shape moved to `types/app/reports` (TASK-010); re-exported
 *  here so the storage module stays the one import a call site needs. */
export type { RetryParams, RunRetryParams };

/**
 * The **form-side** writer: it owns all seven keys, including `extraContext`,
 * which is the only value no server response carries.
 */
export function writeRetryParams(params: RetryParams): void {
  try {
    window.sessionStorage.setItem(RETRY_KEY, JSON.stringify(params));
  } catch {
    // Storage disabled or full: the form simply opens empty. Not worth a
    // message — the user still has every field in front of them.
  }
}

/**
 * The **report-page** writer (TASK-018 / Requirement 4b). It rewrites the six
 * keys it can source from `job.params` and **preserves the stored
 * `extraContext`**, because `GET /api/reports/:jobId` has no such field: a
 * plain `setItem` of six keys would silently wipe the free-text box the form
 * put there, and the wipe would only show up after the first poll.
 *
 * Read-merge-write, and the read is deliberately NOT `takeRetryParams` — that
 * one removes the payload as it reads it.
 */
export function writeRunRetryParams(params: RunRetryParams): void {
  let extraContext = "";
  try {
    const raw = window.sessionStorage.getItem(RETRY_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        const stored = (parsed as Record<string, unknown>)["extraContext"];
        if (typeof stored === "string") extraContext = stored;
      }
    }
  } catch {
    // Unreadable or unparseable: fall through with an empty box rather than
    // refusing to write the six keys we do have.
  }
  writeRetryParams({ ...params, extraContext });
}

/** Reads and immediately removes the handoff, so it prefills exactly once. */
export function takeRetryParams(): RetryParams | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(RETRY_KEY);
    window.sessionStorage.removeItem(RETRY_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const value = parsed as Record<string, unknown>;
    const text = (key: string): string =>
      typeof value[key] === "string" ? (value[key] as string) : "";
    const language = value["language"];
    return {
      repoUrl: text("repoUrl"),
      branch: text("branch"),
      author: text("author"),
      dateFrom: text("dateFrom"),
      dateTo: text("dateTo"),
      language: isLanguage(language) ? language : DEFAULT_LANGUAGE,
      // `text()` coerces a missing key to `""`, so a payload written before
      // TASK-018 restores an empty box rather than failing.
      extraContext: text("extraContext"),
    };
  } catch {
    return null;
  }
}
