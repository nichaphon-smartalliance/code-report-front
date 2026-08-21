import "@mantine/core/styles.css";
import "./globals.css";

import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans_Thai } from "next/font/google";
import { UIProvider } from "@/components/providers";

/**
 * Two faces plus a mono — hallmark's 2+1 discipline; a one-font page is a
 * template page.
 *
 * TASK-011 moved the display face from Trirong (serif) to Chakra Petch, a
 * squared mechanical grotesk: cobalt's register is the instrument panel, and a
 * transitional serif is the wrong voice for it. The pick is constrained by
 * something cobalt's own font list cannot satisfy — this UI is Thai + English,
 * and Space Grotesk has no Thai. Chakra Petch carries BOTH scripts, so the
 * display voice survives the language switch instead of falling back to a
 * different face when the UI is Thai.
 *
 * These are the ONLY font declarations in the app. Everything else references
 * `--font-display` / `--font-body` / `--font-mono` from the token block.
 */
const display = Chakra_Petch({
  subsets: ["latin", "thai"],
  weight: ["500", "600"],
  style: ["normal"], // roman only — no italic face is even loaded
  variable: "--font-face-display",
  display: "swap",
});

const body = IBM_Plex_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600"],
  variable: "--font-face-body",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-face-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // REQ-001 Requirement 14 / Q12: the on-screen product name is `KnowCode`, in
  // both UI languages. Nothing outside the UI string is renamed.
  title: "KnowCode",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The three `--font-face-*` variables MUST sit on <html>, not <body>:
    // `--font-display` / `--font-body` / `--font-mono` are declared on :root, and
    // a custom property's nested var() is substituted where the property is
    // DECLARED. Put the faces on <body> and every one of those tokens resolves
    // to a guaranteed-invalid value on :root, silently dropping both faces.
    //
    // `lang` starts at the default (th) and the language switch updates it.
    <html
      lang="th"
      {...mantineHtmlProps}
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      {/* The body face is applied from the token block (globals.css @layer
          base), not by a Tailwind font utility. */}
      <body>
        <UIProvider>{children}</UIProvider>
      </body>
    </html>
  );
}
