"use client";

import { MantineProvider } from "@mantine/core";
import { I18nProvider } from "@/context/i18n";
import { SessionProvider } from "@/context/session";
import { cssVariablesResolver, theme } from "@/lib/theme";

/**
 * Order matters: the session provider reads the current UI language to send as
 * `Accept-Language`, so i18n wraps it.
 */
export function UIProvider({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="light"
      cssVariablesResolver={cssVariablesResolver}
    >
      <I18nProvider>
        <SessionProvider>{children}</SessionProvider>
      </I18nProvider>
    </MantineProvider>
  );
}
