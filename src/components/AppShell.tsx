"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "@/lib/session/SessionProvider";
import { useDelayedFlag } from "@/lib/useDelayedFlag";

/**
 * The app shell (TASK-006 item 2): product name, UI language switch, logout.
 *
 * There is deliberately NO user menu beyond logout — no profile, no password
 * screen, no user administration, no report history (SPEC-001 "Frontend";
 * REQ-001 §10.3, §10.4, §12). Those are not missing; they do not exist.
 *
 * Icon set: lucide-react, and only lucide-react, everywhere in this app.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const session = useSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const showSpinner = useDelayedFlag(loggingOut);

  const user = session.status === "authenticated" ? session.user : null;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await session.logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <a
        href="#main"
        className="cr-focus sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-sticky focus:rounded focus:bg-paper focus:px-4 focus:py-3 focus:text-ink"
      >
        {t("app.skipToContent")}
      </a>

      <header className="border-0 border-b border-solid border-b-rule bg-paper-2">
        <div className="mx-auto flex max-w-shell flex-wrap items-center gap-4 px-4 py-4 sm:px-8">
          <div className="mr-auto min-w-0">
            <p className="m-0 font-display text-lg font-semibold leading-none text-ink">
              {t("app.name")}
            </p>
            {user ? (
              <p className="cr-nums m-0 mt-2 truncate font-mono text-xs leading-none text-muted">
                {user.displayName}
              </p>
            ) : null}
          </div>

          <LanguageSwitch />

          <button
            type="button"
            className="cr-btn cr-btn--quiet"
            onClick={handleLogout}
            disabled={loggingOut}
            data-loading={loggingOut ? "true" : undefined}
          >
            {showSpinner ? (
              <span className="cr-spinner" aria-hidden="true" />
            ) : (
              <LogOut size={16} aria-hidden="true" />
            )}
            {t("header.logout")}
          </button>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-shell flex-1 px-4 py-10 sm:px-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
