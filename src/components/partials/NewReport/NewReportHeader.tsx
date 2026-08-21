"use client";

import { Box, Group, Title } from "@mantine/core";
import { useI18n } from "@/context/i18n";

/**
 * The screen's heading, redesigned by TASK-012.
 *
 * It was a plain `text-2xl` line floating above the form. It now carries the
 * cobalt **signal tick** — the same object the shell header and the login
 * masthead carry, which is what makes three screens read as one product — and
 * sits on a hairline that runs the full working measure, so the sheet below it
 * starts against a drawn edge rather than against nothing.
 *
 * The copy key is unchanged (`reports.new.heading`); Q14's bundle is closed.
 */
const HEADING_SIZE = "clamp(1.5rem, 4vw, 2rem)";

export function NewReportHeader() {
  const { t } = useI18n();
  return (
    <Box className="cr-sheet__head">
      <Group gap="var(--space-3)" wrap="nowrap" align="center">
        {/* `.cr-tick` is 0.85em tall, so it is cut to whatever line it stands
            beside. Carrying the heading's own size here is what keeps it at the
            heading's cap height across the whole clamp. */}
        <Box component="span" className="cr-tick" fz={HEADING_SIZE} aria-hidden="true" />
        <Title order={1} className="m-0" fz={HEADING_SIZE} fw={600} lh={1.15} c="var(--color-ink)">
          {t("reports.new.heading")}
        </Title>
      </Group>
    </Box>
  );
}
