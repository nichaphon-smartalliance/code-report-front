"use client";

import { Anchor, Box } from "@mantine/core";
import { Header } from "./Header";
import { useI18n } from "@/context/i18n";

/**
 * The app shell (TASK-006 item 2): the header bar, the skip link and the main
 * region. The header itself lives in `./Header` (TASK-010 structural split);
 * TASK-011 rebuilt both Mantine-first and redesigned them with `hallmark`.
 *
 * The one structural change here: the header is sticky, so the main region is
 * the only thing that scrolls and the instrument bar stays on screen. The
 * content column keeps the shell measure and stays left-aligned.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();

  return (
    <Box className="flex min-h-screen flex-col" bg="var(--color-paper)">
      <Anchor
        href="#main"
        underline="never"
        c="var(--color-ink)"
        bg="var(--color-paper)"
        className="cr-focus sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-sticky focus:rounded focus:px-4 focus:py-3"
      >
        {t("app.skipToContent")}
      </Anchor>

      <Header />

      <Box
        component="main"
        id="main"
        className="mx-auto w-full max-w-shell flex-1 px-4 py-10 sm:px-8 sm:py-12"
      >
        {children}
      </Box>
    </Box>
  );
}
