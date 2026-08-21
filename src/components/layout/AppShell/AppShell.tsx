"use client";

import { Header } from "./Header";
import { useI18n } from "@/context/i18n";

/**
 * The app shell (TASK-006 item 2): the header bar, the skip link and the main
 * region. The header itself lives in `./Header` (TASK-010 structural split).
 *
 * There is deliberately NO user menu beyond logout — no profile, no password
 * screen, no user administration, no report history (SPEC-001 "Frontend";
 * REQ-001 §10.3, §10.4, §12). Those are not missing; they do not exist.
 *
 * Icon set: lucide-react, and only lucide-react, everywhere in this app.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <a
        href="#main"
        className="cr-focus sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-sticky focus:rounded focus:bg-paper focus:px-4 focus:py-3 focus:text-ink"
      >
        {t("app.skipToContent")}
      </a>

      <Header />

      <main id="main" className="mx-auto w-full max-w-shell flex-1 px-4 py-10 sm:px-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
