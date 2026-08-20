/**
 * The one date/time helper — FRONTEND-STANDARD §2 ("Dates DD/MMM/YY; times
 * HH:mm. One helper, everywhere."). Nothing else in the app formats a date.
 *
 * Timezone is Asia/Bangkok, confirmed by the stakeholder (board.md, Q-SA-1).
 *
 * OPEN (Q-FE-2, non-blocking, no date is rendered by TASK-006): the month
 * abbreviation and the year below are English/Gregorian in BOTH languages,
 * which is the literal reading of the standard. Whether the Thai UI should show
 * Thai month abbreviations and/or the Buddhist era is a stakeholder fact nobody
 * has stated, so it is asked rather than guessed. TASK-007/008 render dates and
 * need the answer first.
 */
const TIME_ZONE = "Asia/Bangkok";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function partsInBangkok(value: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const out: Record<string, string> = {};
  for (const part of formatter.formatToParts(value)) out[part.type] = part.value;
  return out;
}

/** `20/Aug/26` */
export function formatDate(value: Date): string {
  const p = partsInBangkok(value);
  const monthIndex = Number(p["month"]) - 1;
  const month = MONTHS[monthIndex] ?? p["month"] ?? "";
  return `${p["day"] ?? ""}/${month}/${(p["year"] ?? "").slice(-2)}`;
}

/**
 * `2026-08-20` -> `20/Aug/26`.
 *
 * The wire format for `dateFrom`/`dateTo` is a bare `YYYY-MM-DD` calendar date
 * with no instant and no zone (SPEC-001). Turning it into a `Date` to display it
 * would run it through the browser's timezone and can move it by a day, so this
 * reads the parts directly and converts nothing. Same output shape as
 * `formatDate`, and it lives here so Q-FE-2's answer stays a one-file change.
 *
 * Returns `null` for anything that is not a well-formed date string, so the
 * caller can show its own placeholder rather than a half-rendered date.
 */
export function formatIsoDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match as unknown as [string, string, string, string];
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return null;
  return `${day}/${monthName}/${year.slice(-2)}`;
}

/** `14:05` — 24h, no seconds. */
export function formatTime(value: Date): string {
  const p = partsInBangkok(value);
  return `${p["hour"] ?? ""}:${p["minute"] ?? ""}`;
}

/** `20/Aug/26 14:05` */
export function formatDateTime(value: Date): string {
  return `${formatDate(value)} ${formatTime(value)}`;
}
