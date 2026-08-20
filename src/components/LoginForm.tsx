"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { ApiError, NetworkError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { EXPIRED_PARAM, HOME_PATH, useSession } from "@/lib/session/SessionProvider";
import { useDelayedFlag } from "@/lib/useDelayedFlag";

type Phase = "idle" | "submitting" | "error" | "success";

/**
 * Login (TASK-006 item 3 / SPEC-001 "Frontend" 1).
 *
 * There is no "forgot password" link and no "create account" link, here or
 * anywhere else in the app: the stakeholder creates accounts at installation
 * and resets passwords from outside the system (REQ-001 §10.2, §10.4 — board.md
 * Q7/Q9/Q10). A link to a flow that does not exist would be a spec violation.
 *
 * On a wrong password the typed values stay in the fields — retyping a username
 * you already got right is the tax bad login screens charge.
 */
export function LoginForm() {
  const { t } = useI18n();
  const session = useSession();
  const params = useSearchParams();
  const router = useRouter();

  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carried over from TASK-006's review: an already-authenticated user who
  // navigates to /login was still shown the login form. `session.login()` owns
  // the redirect after a submit; this covers arriving here with a live session.
  useEffect(() => {
    if (session.status === "authenticated" && phase === "idle") router.replace(HOME_PATH);
  }, [session.status, phase, router]);

  const expired = params.get(EXPIRED_PARAM) === "1" && phase === "idle" && !errorMessage;
  const busy = phase === "submitting";
  const showSpinner = useDelayedFlag(busy);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setPhase("submitting");
    setErrorMessage(null);
    try {
      await session.login({ username, password });
      setPhase("success");
    } catch (cause: unknown) {
      // SPEC-001: display the server's `message` as-is. Never compose error text
      // from a code. `NetworkError` means no server message exists at all.
      setErrorMessage(
        cause instanceof ApiError
          ? cause.message
          : cause instanceof NetworkError
            ? t("common.networkError")
            : t("common.networkError"),
      );
      setPhase("error");
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex max-w-shell justify-end px-4 pt-4 sm:px-8">
        <LanguageSwitch />
      </div>

      {/* Biased left, sized to its content — not a full-viewport centred hero. */}
      <div className="mx-auto max-w-shell px-4 pb-20 pt-10 sm:px-8 sm:pt-16">
        <div className="cr-enter max-w-form">
          <p className="m-0 font-display text-3xl font-semibold leading-tight text-ink">
            {t("app.name")}
          </p>
          <hr className="my-6 h-px w-12 border-0 bg-accent" />

          <h1 className="m-0 mb-8 font-body text-base font-semibold tracking-wide text-muted">
            {t("login.heading")}
          </h1>

          {expired ? (
            <p
              className="m-0 mb-6 flex items-start gap-2 rounded border border-solid border-rule bg-paper-2 px-4 py-3 text-sm text-ink"
              role="status"
            >
              <Clock size={16} className="mt-1 shrink-0 text-muted" aria-hidden="true" />
              {t("login.sessionExpired")}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-5">
              <div className="cr-field" data-state={phase === "error" ? "error" : undefined}>
                <label htmlFor={usernameId}>{t("login.username")}</label>
                <input
                  id={usernameId}
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  disabled={busy}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  aria-invalid={phase === "error"}
                  aria-describedby={errorMessage ? errorId : undefined}
                />
              </div>

              <div className="cr-field" data-state={phase === "error" ? "error" : undefined}>
                <label htmlFor={passwordId}>{t("login.password")}</label>
                {/* type=password, current-password, and never written to
                    localStorage/sessionStorage — it lives in component state
                    for the length of the submit and nowhere else. */}
                <input
                  id={passwordId}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={busy}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={phase === "error"}
                  aria-describedby={errorMessage ? errorId : undefined}
                />
              </div>

              {errorMessage ? (
                <p
                  id={errorId}
                  role="alert"
                  className="m-0 flex items-start gap-2 rounded border border-solid border-danger bg-danger-soft px-4 py-3 text-sm text-danger"
                >
                  {/* Never colour alone: the icon and the words carry it too. */}
                  <AlertTriangle size={16} className="mt-1 shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">{t("login.errorTitle")}</strong>
                    {" — "}
                    {errorMessage}
                  </span>
                </p>
              ) : null}

              <div>
                <button
                  type="submit"
                  className="cr-btn cr-btn--primary w-full sm:w-auto"
                  disabled={busy}
                  data-loading={busy ? "true" : undefined}
                  data-state={phase === "error" || phase === "success" ? phase : undefined}
                >
                  {showSpinner ? <span className="cr-spinner" aria-hidden="true" /> : null}
                  {busy ? t("login.submitting") : t("login.submit")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
