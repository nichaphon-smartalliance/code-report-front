"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  dictionaries,
  isLanguage,
  type Language,
  type MessageKey,
} from "@/constant/text";

const STORAGE_KEY = "cr.uiLanguage";

/**
 * The stored UI preference, read outside React (TASK-006 minor, carried into
 * TASK-008 by Sober).
 *
 * The provider deliberately reads localStorage in an effect so the server HTML
 * and the first client render agree — which means that during the very first
 * commit `language` is still the default, and any request fired from a child's
 * mount effect (child effects run before the provider's) would go out with
 * `Accept-Language: th` even for a user whose preference is `en`. That is the
 * language the SERVER writes its error messages in, so it is visible the moment
 * a server message is rendered on first paint.
 *
 * `setLanguage` writes this key on every switch, so this function and the
 * context value never disagree after mount.
 */
export function readStoredLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

type I18nValue = {
  language: Language;
  setLanguage: (next: Language) => void;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

/**
 * The UI language. It is a display preference, not a credential — persisting it
 * in localStorage is fine and is the only thing this app ever writes there.
 * (The session is an HttpOnly cookie the client cannot read; no token, password
 * or PAT is ever stored — SPEC-001 Non-functional.)
 *
 * It is read after mount, never during render, so the server-rendered HTML and
 * the first client render agree.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLanguageState(readStoredLanguage());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback((key: MessageKey) => dictionaries[language][key], [language]);

  const value = useMemo<I18nValue>(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
