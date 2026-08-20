import "@mantine/core/styles.css";
import "./globals.css";

import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Thai, Trirong } from "next/font/google";
import { Providers } from "./providers";

/**
 * Two faces plus a mono — hallmark's 2+1 discipline; a one-font page is a
 * template page. Trirong is a serif with a full Thai character set, so the
 * display voice survives the language switch instead of falling back to a
 * different face when the UI is Thai.
 *
 * These are the ONLY font declarations in the app. Everything else references
 * `--font-display` / `--font-body` / `--font-mono` from the token block.
 */
const display = Trirong({
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
  title: "Code Report",
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
      <body className="font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
