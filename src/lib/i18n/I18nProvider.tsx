"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  dictionaries,
  isLanguage,
  type Language,
  type MessageKey,
} from "./dictionaries";

const STORAGE_KEY = "cr.uiLanguage";

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
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) setLanguageState(stored);
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
