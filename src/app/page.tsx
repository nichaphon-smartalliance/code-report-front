"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HOME_PATH, LOGIN_PATH, useSession } from "@/lib/session/SessionProvider";

/**
 * The entry point has no content of its own: it waits for `GET /api/auth/me`
 * and sends the visitor to the report form or to login.
 */
export default function IndexPage() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.status === "authenticated") router.replace(HOME_PATH);
    else if (session.status === "anonymous") router.replace(LOGIN_PATH);
  }, [session.status, router]);

  return <div className="min-h-screen bg-paper" />;
}
