"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { readStoredLanguage, useI18n } from "@/context/i18n";
// The 401 handler is transport wiring, not an endpoint, so it is registered on
// the client rather than wrapped by a service.
import { setUnauthorizedHandler } from "@/lib/api/client";
import { login as loginRequest, logout as logoutRequest, me } from "@/services/auth.service";
import type { SessionUser } from "@/types/api/main";

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/reports/new";
/** Where a started run is watched (TASK-008 owns the screen; this is its address). */
export const reportPath = (jobId: string): string => `/reports/${encodeURIComponent(jobId)}`;
/** Read by the login screen to show the "session expired" line. */
export const EXPIRED_PARAM = "expired";

type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: SessionUser };

type SessionValue = SessionState & {
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

/**
 * SPEC-001 Auth: the session is an HttpOnly `cr_session` cookie set by the
 * backend. The client never reads it, never stores it, and never holds a token
 * — it asks `GET /api/auth/me` who it is, and treats `401 AUTH_REQUIRED` from
 * ANY call as "the session ended, go to login".
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { language } = useI18n();
  const [state, setState] = useState<SessionState>({ status: "loading" });

  // The redirect must not re-fire for every in-flight request of a dead session.
  const redirecting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    // The stored preference, not the context value: this effect runs before the
    // provider above has read localStorage, so `language` is still the default
    // here and a `en` user's first server message would come back in Thai.
    me(readStoredLanguage(), controller.signal)
      .then((user) => setState({ status: "authenticated", user }))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setState({ status: "anonymous" });
      });
    return () => controller.abort();
    // Deliberately runs once with an empty dep list even though `language` is
    // read inside: `me` identifies the user, and the user does not change when
    // the UI language does. (There is no ESLint in this repo, so the old
    // `eslint-disable` line here disabled nothing and has been removed.)
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (redirecting.current) return;
      redirecting.current = true;
      setState({ status: "anonymous" });
      router.replace(`${LOGIN_PATH}?${EXPIRED_PARAM}=1`);
    });
    return () => setUnauthorizedHandler(null);
  }, [router]);

  const login = useCallback(
    async (credentials: { username: string; password: string }) => {
      const user = await loginRequest(credentials, language);
      redirecting.current = false;
      setState({ status: "authenticated", user });
      router.replace(HOME_PATH);
    },
    [language, router],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest(language);
    } finally {
      redirecting.current = false;
      setState({ status: "anonymous" });
      router.replace(LOGIN_PATH);
    }
  }, [language, router]);

  const value = useMemo<SessionValue>(() => ({ ...state, login, logout }), [state, login, logout]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}
