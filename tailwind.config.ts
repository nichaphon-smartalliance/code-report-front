import type { Config } from "tailwindcss";

/**
 * FRONTEND-STANDARD §1 — ONE token system.
 * Tailwind owns no colour or font values of its own: every entry below points at
 * a CSS custom property declared once in `src/app/globals.css`. The Mantine theme
 * (`src/lib/theme.ts`) points at the exact same properties. Changing a colour is
 * a one-line edit in globals.css and both systems follow.
 */
const config: Config = {
  // Mantine ships its own reset; a second one causes the two-system sprawl the
  // standard bans. Tailwind here is utilities only.
  corePlugins: { preflight: false },
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      paper: "var(--color-paper)",
      "paper-2": "var(--color-paper-2)",
      "paper-3": "var(--color-paper-3)",
      rule: "var(--color-rule)",
      "rule-strong": "var(--color-rule-strong)",
      neutral: "var(--color-neutral)",
      muted: "var(--color-muted)",
      ink: "var(--color-ink)",
      accent: "var(--color-accent)",
      "accent-strong": "var(--color-accent-strong)",
      "accent-ring": "var(--color-accent-ring)",
      "accent-soft": "var(--color-accent-soft)",
      danger: "var(--color-danger)",
      "danger-soft": "var(--color-danger-soft)",
      success: "var(--color-success)",
    },
    fontFamily: {
      display: "var(--font-display)",
      body: "var(--font-body)",
      mono: "var(--font-mono)",
    },
    // 4pt scale (FRONTEND-STANDARD §1).
    spacing: {
      "0": "0",
      "1": "var(--space-1)",
      "2": "var(--space-2)",
      "3": "var(--space-3)",
      "4": "var(--space-4)",
      "5": "var(--space-5)",
      "6": "var(--space-6)",
      "8": "var(--space-8)",
      "10": "var(--space-10)",
      "12": "var(--space-12)",
      "16": "var(--space-16)",
      "20": "var(--space-20)",
    },
    zIndex: {
      base: "var(--z-base)",
      raised: "var(--z-raised)",
      sticky: "var(--z-sticky)",
      overlay: "var(--z-overlay)",
      modal: "var(--z-modal)",
      toast: "var(--z-toast)",
    },
    extend: {
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      maxWidth: {
        measure: "62ch",
        form: "26rem",
        shell: "68rem",
        // A date field sized to `DD/MMM/YY` plus the native picker button —
        // a named width so no screen needs an arbitrary `max-w-[…]` value.
        date: "13rem",
      },
    },
  },
  plugins: [],
};

export default config;
