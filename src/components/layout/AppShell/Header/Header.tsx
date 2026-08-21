"use client";

import { Box, Button, Group, Text } from "@mantine/core";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { LanguageSwitch } from "@/components/common";
import { useI18n } from "@/context/i18n";
import { useSession } from "@/context/session";
import { useDelayedFlag } from "@/hooks/common";

/**
 * The shell's header bar (TASK-006 item 2), rebuilt Mantine-first and
 * redesigned by TASK-011 in the cobalt register.
 *
 * What changed from the hand-rolled bar: it is now a sticky instrument bar
 * whose single hairline STOPS at the content measure rather than running the
 * full viewport width — that one detail is what keeps it off hallmark's "AI
 * nav" fingerprint, and it is described again at the element itself below; the
 * product name carries the cobalt
 * signal tick; and the signed-in identity moved out from under the wordmark to
 * the right of the bar, set as a bordered mono chip rather than a caption.
 *
 * The name it carries is `KnowCode` (REQ-001 Requirement 14, folded into this
 * TASK) — the same Latin string in both UI languages.
 *
 * There is deliberately NO user menu beyond logout — no profile, no password
 * screen, no user administration, no report history (SPEC-001 "Frontend";
 * REQ-001 §10.3, §10.4, §12). Those are not missing; they do not exist.
 *
 * Type and colour come from Mantine style props (`ff` / `fz` / `fw` / `c`),
 * which resolve to the same tokens as everything else; Tailwind here carries
 * layout and spacing only (SPEC-002 Decision 3).
 *
 * Icon set: lucide-react, and only lucide-react, everywhere in this app.
 */
export function Header() {
  const { t } = useI18n();
  const session = useSession();
  const [loggingOut, setLoggingOut] = useState(false);
  // Unchanged from TASK-006: the spinner appears only if the request is slow
  // enough to be worth reporting, so it never flashes on a warm connection.
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
    <Box component="header" className="sticky top-0 z-sticky" bg="var(--color-paper)">
      {/* The hairline stops at the content measure instead of running the full
          viewport width. That one detail is what keeps this off hallmark's "AI
          nav" fingerprint (wordmark hard-left + controls hard-right + full-bleed
          bar + hairline underneath); it also happens to be true to what the bar
          is — this app has ZERO navigation destinations, so it is an instrument
          readout, not a nav. (Caught by the TASK-011 audit.) */}
      <Group
        className="mx-auto max-w-shell border-0 border-b border-solid px-4 py-3 sm:px-8"
        justify="space-between"
        wrap="nowrap"
        gap="var(--space-4)"
        style={{ borderBottomColor: "var(--color-rule)" }}
      >
        <Group gap="var(--space-3)" wrap="nowrap" className="min-w-0">
          <span className="cr-tick" aria-hidden="true" />
          <Text
            component="p"
            className="m-0 truncate"
            ff="heading"
            fz="1.125rem"
            fw={600}
            lh={1}
            c="var(--color-ink)"
            style={{ letterSpacing: "-0.01em" }}
          >
            {t("app.name")}
          </Text>
        </Group>

        <Group gap="var(--space-3)" wrap="nowrap">
          {user ? (
            // A bordered mono chip, not a caption: the signed-in identity is a
            // fact the instrument reports, and hairlines carry structure here.
            // Hidden below 640px, where it gets its own row instead of turning
            // a four-item bar into three ragged lines.
            <Text
              component="span"
              className="cr-nums hidden truncate rounded border border-solid px-3 py-1 sm:inline-block"
              ff="monospace"
              fz="0.75rem"
              c="var(--color-muted)"
              style={{ borderColor: "var(--color-rule)", maxWidth: "14rem" }}
            >
              {user.displayName}
            </Text>
          ) : null}

          <LanguageSwitch />

          <Button
            variant="subtle"
            color="accent"
            onClick={handleLogout}
            disabled={loggingOut}
            loading={showSpinner}
            leftSection={<LogOut size={16} aria-hidden="true" />}
          >
            {t("header.logout")}
          </Button>
        </Group>
      </Group>

      {user ? (
        <Box
          className="mx-auto max-w-shell border-0 border-b border-solid px-4 py-2 sm:hidden"
          style={{ borderBottomColor: "var(--color-rule)" }}
        >
          <Text
            component="p"
            className="cr-nums m-0 truncate"
            ff="monospace"
            fz="0.75rem"
            lh={1.4}
            c="var(--color-muted)"
          >
            {user.displayName}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}
