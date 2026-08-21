"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { LanguageSwitch } from "@/components/common";
import { useI18n } from "@/context/i18n";
import { useSession } from "@/context/session";
import { useDelayedFlag } from "@/hooks/common";

/**
 * The shell's header bar (TASK-006 item 2): product name, UI language switch,
 * logout. Shed out of `AppShell.tsx` by TASK-010 — the markup and the logout
 * handler moved verbatim; nothing was restyled or reworded.
 */
export function Header() {
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
  );
}
