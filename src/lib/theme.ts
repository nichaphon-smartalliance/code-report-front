import {
  Button,
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
  SegmentedControl,
  TextInput,
} from "@mantine/core";

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
  // Slot 7 is what Mantine uses for a filled control's HOVER (primaryShade + 1).
  // TASK-011 is the first TASK that actually renders a Mantine control, and with
  // slot 7 equal to slot 6 the primary button had no hover state at all.
  "var(--color-accent-strong)",
  "var(--color-accent-strong)",
  "var(--color-accent-strong)",
];

/**
 * The two meaning colours, as Mantine palettes, so a control that has to say
 * "this failed" / "this worked" does it with OUR danger and success tokens
 * instead of Mantine's built-in `red` and `green`. Same pointer discipline as
 * `accent`: no value is defined here. Colour is never the only cue — every use
 * still pairs with an icon or a word (FRONTEND-STANDARD §2).
 */
const danger: MantineColorsTuple = [
  "var(--color-danger-soft)",
  "var(--color-danger-soft)",
  "var(--color-danger-soft)",
  "var(--color-danger)",
  "var(--color-danger)",
  "var(--color-danger)",
  "var(--color-danger)",
  "var(--color-danger)",
  "var(--color-danger)",
  "var(--color-danger)",
];

const success: MantineColorsTuple = [
  "var(--color-success)",
  "var(--color-success)",
  "var(--color-success)",
  "var(--color-success)",
  "var(--color-success)",
  "var(--color-success)",
  "var(--color-success)",
  "var(--color-success)",
  "var(--color-success)",
  "var(--color-success)",
];

export const theme = createTheme({
  colors: { accent, danger, success },
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
  /**
   * Project defaults for the Mantine primitives this app renders (SPEC-002
   * Decision 3 — "where the project applies a real default"). There is exactly
   * ONE such default and it is a size, not a colour: the 44px hit-target floor
   * from FRONTEND-STANDARD §3 gate 2, which Mantine's `md` (42px) misses. It is
   * expressed as `var(--control-h)`, so the value still lives in globals.css and
   * this file stays a pointer.
   */
  components: {
    Button: Button.extend({
      defaultProps: { size: "md" },
      styles: { root: { height: "var(--control-h)" } },
    }),
    TextInput: TextInput.extend({
      defaultProps: { size: "md" },
      styles: { input: { height: "var(--control-h)" } },
    }),
    SegmentedControl: SegmentedControl.extend({
      defaultProps: { size: "md" },
      styles: {
        // Mantine's floating indicator hard-codes `ease`; our motion rule is
        // exponential ease-out only. The duration already follows
        // `--sc-transition-duration` (re-pointed at our token in globals.css).
        indicator: { transitionTimingFunction: "var(--ease-out)" },
        label: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "var(--control-h)",
          minWidth: "var(--control-h)",
          paddingBlock: 0,
        },
      },
    }),
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

/**
 * TASK-011 — the other half of "one token system".
 *
 * `theme.colors` only covers palettes. Mantine also ships a set of SEMANTIC
 * variables (`--mantine-color-text`, `-body`, `-default-border`, `-placeholder`,
 * `-error`, the `gray` ramp, `white`, `black`) which every Mantine component
 * reads, and which default to Mantine's own greys, its own red and literal
 * `#fff` / `#000`. Left alone they would be exactly the second colour system
 * FRONTEND-STANDARD §1 calls our biggest sin — invisible in the source, visible
 * on screen.
 *
 * So each one is re-pointed at a property from `globals.css`. No value is
 * defined here; this stays a pointer file, and there is no `#fff`/`#000` in the
 * app even inside Mantine's own stylesheet.
 */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-white": "var(--color-paper)",
    "--mantine-color-black": "var(--color-ink)",
    "--mantine-color-text": "var(--color-ink)",
    "--mantine-color-body": "var(--color-paper)",
    "--mantine-color-bright": "var(--color-ink)",
    "--mantine-color-dimmed": "var(--color-muted)",
    "--mantine-color-placeholder": "var(--color-muted)",
    "--mantine-color-anchor": "var(--color-accent)",
    "--mantine-color-error": "var(--color-danger)",
    "--mantine-color-success": "var(--color-success)",
    "--mantine-color-default": "var(--color-paper)",
    "--mantine-color-default-hover": "var(--color-paper-3)",
    "--mantine-color-default-color": "var(--color-ink)",
    "--mantine-color-default-border": "var(--color-rule-strong)",
    "--mantine-color-disabled": "var(--color-paper-3)",
    "--mantine-color-disabled-color": "var(--color-neutral)",
    "--mantine-color-disabled-border": "var(--color-rule)",
    // The grey ramp components reach for directly (segmented-control ground,
    // subtle-button hover, dividers). Nine slots, five tokens — we have one
    // neutral ramp, not two.
    "--mantine-color-gray-0": "var(--color-paper-2)",
    "--mantine-color-gray-1": "var(--color-paper-2)",
    "--mantine-color-gray-2": "var(--color-paper-3)",
    "--mantine-color-gray-3": "var(--color-rule)",
    // gray-4 is what Mantine's `--input-bd` resolves to. It is a UI boundary and
    // must clear 3:1, so it points at `rule-strong` (3.5:1), not at the
    // decorative `rule` (1.4:1). Measured, not assumed — see the TASK notes.
    "--mantine-color-gray-4": "var(--color-rule-strong)",
    "--mantine-color-gray-5": "var(--color-rule-strong)",
    "--mantine-color-gray-6": "var(--color-neutral)",
    "--mantine-color-gray-7": "var(--color-muted)",
    "--mantine-color-gray-8": "var(--color-muted)",
    "--mantine-color-gray-9": "var(--color-ink)",
  },
  dark: {},
});
