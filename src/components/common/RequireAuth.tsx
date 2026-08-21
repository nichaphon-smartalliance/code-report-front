"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/context/i18n";
import { LOGIN_PATH, useSession } from "@/context/session";

/**
 * Guards every authenticated screen. While `GET /api/auth/me` is in flight we
 * render a quiet placeholder rather than a spinner that would flash for 40ms on
 * a warm session (hallmark "spinners that flash").
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();
  const { t } = useI18n();

  useEffect(() => {
    if (session.status === "anonymous") router.replace(LOGIN_PATH);
  }, [session.status, router]);

  if (session.status !== "authenticated") {
    return (
      <div className="min-h-screen px-4 py-12 sm:px-8">
        <p className="sr-only" role="status">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
