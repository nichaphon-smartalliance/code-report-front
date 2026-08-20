"use client";

import { DEFAULT_LANGUAGE, isLanguage, type Language } from "@/lib/i18n/dictionaries";

/**
 * The "try again" handoff (TASK-008 item 5): a FAILED run sends the reader back
 * to the form with the same parameters prefilled — **except the PAT, which is
 * never re-populated**.
 *
 * There is no `pat` key in this type and none in the response it is built from
 * (SPEC-001: `params` is "never `pat`"), so the token cannot travel this way
 * even by accident.
 *
 * Why `sessionStorage` and not the URL: a query string would put the repository
 * URL and the author's email address in the address bar, in history and in any
 * shared link. This is a one-tab, one-hop handoff — written on the click, read
 * once on the form's next mount, and removed as it is read.
 */
const RETRY_KEY = "cr.retryParams";

export type RetryParams = {
  repoUrl: string;
  branch: string;
  author: string;
  dateFrom: string;
  dateTo: string;
  language: Language;
};

export function writeRetryParams(params: RetryParams): void {
  try {
    window.sessionStorage.setItem(RETRY_KEY, JSON.stringify(params));
  } catch {
    // Storage disabled or full: the form simply opens empty. Not worth a
    // message — the user still has every field in front of them.
  }
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
    };
  } catch {
    return null;
  }
}
