"use client";

import { Box, Button, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { AlertTriangle, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { LanguageSwitch } from "@/components/common";
import { useI18n } from "@/context/i18n";
import { EXPIRED_PARAM, HOME_PATH, useSession } from "@/context/session";
import { useDelayedFlag } from "@/hooks/common";
import { ApiError, NetworkError } from "@/lib/api/client";
import type { Phase } from "./Login.config";

/**
 * Login (TASK-006 item 3 / SPEC-001 "Frontend" 1), rebuilt Mantine-first and
 * redesigned by TASK-011 in the cobalt register.
 *
 * The structural change: the screen was one narrow left-biased column with the
 * product name stacked on top of the form. It is now an asymmetric masthead +
 * form pair split by a single vertical hairline from 48rem up, with the product
 * name demoted to a mono eyebrow beside the cobalt signal tick and the page
 * heading promoted to the display line. Below 48rem the two stack, masthead
 * first. It is deliberately not a centred card on a full-viewport hero.
 *
 * NO COPY CHANGED. Every string is the one the dictionary already held (Q14
 * closed the copy bundle); the only string this TASK touches anywhere is the
 * product name itself, `app.name` → `KnowCode` (REQ-001 Requirement 14 / Q12).
 *
 * There is no "forgot password" link and no "create account" link, here or
 * anywhere else in the app: the stakeholder creates accounts at installation
 * and resets passwords from outside the system (REQ-001 §10.2, §10.4 — board.md
 * Q7/Q9/Q10). A link to a flow that does not exist would be a spec violation.
 *
 * On a wrong password the typed values stay in the fields — retyping a username
 * you already got right is the tax bad login screens charge.
 */
export function LoginContent() {
  const { t } = useI18n();
  const session = useSession();
  const params = useSearchParams();
  const router = useRouter();

  const errorId = useId();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carried over from TASK-006's review: an already-authenticated user who
  // navigates to /login was still shown the login form. `session.login()` owns
  // the redirect after a submit; this covers arriving here with a live session.
  useEffect(() => {
    if (session.status === "authenticated" && phase === "idle") router.replace(HOME_PATH);
  }, [session.status, phase, router]);

  const expired = params.get(EXPIRED_PARAM) === "1" && phase === "idle" && !errorMessage;
  const busy = phase === "submitting";
  const showSpinner = useDelayedFlag(busy);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setPhase("submitting");
    setErrorMessage(null);
    try {
      await session.login({ username, password });
      setPhase("success");
    } catch (cause: unknown) {
      // SPEC-001: display the server's `message` as-is. Never compose error text
      // from a code. `NetworkError` means no server message exists at all.
      setErrorMessage(
        cause instanceof ApiError
          ? cause.message
          : cause instanceof NetworkError
            ? t("common.networkError")
            : t("common.networkError"),
      );
      setPhase("error");
    }
  }

  return (
    <Box className="flex min-h-screen flex-col" bg="var(--color-paper)">
      {/* The same flush hairline bar the signed-in shell carries, so the two
          screens read as one instrument rather than two designs. */}
      <Group
        className="mx-auto w-full max-w-shell border-0 border-b border-solid px-4 py-3 sm:px-8"
        justify="flex-end"
        style={{ borderBottomColor: "var(--color-rule)" }}
      >
        <LanguageSwitch />
      </Group>

      <Box className="mx-auto w-full max-w-shell flex-1 px-4 pb-20 pt-12 sm:px-8 sm:pt-20">
        <Box className="cr-signin">
          <Box className="cr-enter min-w-0">
            <Group gap="var(--space-3)" wrap="nowrap" className="mb-6">
              <span className="cr-tick" aria-hidden="true" />
              <Text
                component="p"
                className="m-0 truncate"
                ff="monospace"
                fz="0.8125rem"
                fw={500}
                lh={1}
                c="var(--color-ink)"
                style={{ letterSpacing: "0.14em" }}
              >
                {t("app.name")}
              </Text>
            </Group>

            <Title
              order={1}
              className="m-0"
              fz="clamp(2rem, 7vw, 3rem)"
              fw={600}
              lh={1.1}
              c="var(--color-ink)"
              style={{ letterSpacing: "-0.02em" }}
            >
              {t("login.heading")}
            </Title>
          </Box>

          <Box className="cr-signin__form min-w-0">
            <form onSubmit={handleSubmit} noValidate>
              <Stack gap="var(--space-5)">
                {expired ? (
                  <Text component="p" className="cr-notice" role="status">
                    <Clock size={16} className="cr-notice__icon" aria-hidden="true" />
                    <span>{t("login.sessionExpired")}</span>
                  </Text>
                ) : null}

                {/* `withAsterisk={false}` on both fields: the field stays
                    `required`, but Mantine's asterisk would put a character on
                    screen that the dictionary does not hold and that TASK-006's
                    labels never had (Q14 — the copy bundle is closed). */}
                <TextInput
                  name="username"
                  type="text"
                  label={t("login.username")}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  withAsterisk={false}
                  disabled={busy}
                  value={username}
                  onChange={(event) => setUsername(event.currentTarget.value)}
                  error={phase === "error"}
                  // Mantine owns `aria-describedby` on its inputs (it points at
                  // its own error/description slots and overwrites anything passed
                  // in — measured, not assumed). `aria-errormessage` is the ARIA
                  // 1.2 partner of `aria-invalid=true`, it survives, and it links
                  // the same alert the previous build linked with `describedby`.
                  aria-errormessage={errorMessage ? errorId : undefined}
                />

                {/* type=password, current-password, and never written to
                    localStorage/sessionStorage — it lives in component state
                    for the length of the submit and nowhere else.
                    Deliberately `TextInput type="password"` and NOT Mantine's
                    `PasswordInput` — see `## Questions` Q-FE-12: that component
                    always renders a reveal toggle, which is behaviour SPEC-002
                    does not have, a 28px hit target, and an English-only
                    `aria-label` baked into the library. */}
                <TextInput
                  name="password"
                  type="password"
                  label={t("login.password")}
                  autoComplete="current-password"
                  required
                  withAsterisk={false}
                  disabled={busy}
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  error={phase === "error"}
                  // Mantine owns `aria-describedby` on its inputs (it points at
                  // its own error/description slots and overwrites anything passed
                  // in — measured, not assumed). `aria-errormessage` is the ARIA
                  // 1.2 partner of `aria-invalid=true`, it survives, and it links
                  // the same alert the previous build linked with `describedby`.
                  aria-errormessage={errorMessage ? errorId : undefined}
                />

                {errorMessage ? (
                  // Never colour alone: the icon and the words carry it too.
                  <Text
                    component="p"
                    id={errorId}
                    role="alert"
                    className="cr-notice cr-notice--danger"
                  >
                    <AlertTriangle size={16} className="cr-notice__icon" aria-hidden="true" />
                    <span>
                      <strong>{t("login.errorTitle")}</strong>
                      {" — "}
                      {errorMessage}
                    </span>
                  </Text>
                ) : null}

                {/* The 8th and 7th states: the submit button itself carries the
                    error / success colour, exactly as the hand-rolled button
                    did via `data-state`. Both are project tokens, not Mantine's
                    own red and green. */}
                <Button
                  type="submit"
                  color={phase === "error" ? "danger" : phase === "success" ? "success" : "accent"}
                  fullWidth
                  disabled={busy}
                  loading={showSpinner}
                >
                  {busy ? t("login.submitting") : t("login.submit")}
                </Button>
              </Stack>
            </form>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
