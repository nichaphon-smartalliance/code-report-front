import { createTheme, type MantineColorsTuple } from "@mantine/core";

/**
 * FRONTEND-STANDARD §1 — one token source.
 *
 * Mantine does not own a palette here. Every entry below is a pointer at a CSS
 * custom property declared once in `src/app/globals.css`, exactly like
 * `tailwind.config.ts`. That is what stops the "Mantine theme + a second
 * Tailwind colour scale" sprawl the standard names as our biggest sin.
 *
 * The tuple has ten slots because Mantine's type demands ten; we have one
 * accent, not ten, so the slots point at the four accent tokens we actually
 * defined. Reaching for a shade that is not in the token block means adding it
 * to globals.css first.
 */
const accent: MantineColorsTuple = [
  "var(--color-accent-soft)",
  "var(--color-accent-soft)",
  "var(--color-accent-soft)",
  "var(--color-accent-ring)",
  "var(--color-accent-ring)",
  "var(--color-accent-ring)",
  "var(--color-accent)",
  "var(--color-accent)",
  "var(--color-accent-strong)",
  "var(--color-accent-strong)",
];

export const theme = createTheme({
  colors: { accent },
  primaryColor: "accent",
  primaryShade: 6,
  // Keyboard-only ring, and globals.css makes it instant and un-transitioned.
  focusRing: "auto",
  fontFamily: "var(--font-body)",
  fontFamilyMonospace: "var(--font-mono)",
  headings: {
    fontFamily: "var(--font-display)",
    // Roman only — Mantine has no italic default, and nothing here adds one.
    fontWeight: "600",
  },
  defaultRadius: "var(--radius-md)",
  spacing: {
    xs: "var(--space-2)",
    sm: "var(--space-3)",
    md: "var(--space-4)",
    lg: "var(--space-6)",
    xl: "var(--space-8)",
  },
  other: {
    // The named z scale, so a Mantine portal never needs an arbitrary value.
    z: {
      base: "var(--z-base)",
      raised: "var(--z-raised)",
      sticky: "var(--z-sticky)",
      overlay: "var(--z-overlay)",
      modal: "var(--z-modal)",
      toast: "var(--z-toast)",
    },
  },
});
