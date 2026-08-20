"use client";

import { MantineProvider } from "@mantine/core";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { SessionProvider } from "@/lib/session/SessionProvider";
import { theme } from "@/lib/theme";

/**
 * Order matters: the session provider reads the current UI language to send as
 * `Accept-Language`, so i18n wraps it.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <I18nProvider>
        <SessionProvider>{children}</SessionProvider>
      </I18nProvider>
    </MantineProvider>
  );
}
