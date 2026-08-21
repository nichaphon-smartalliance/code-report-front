"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HOME_PATH, LOGIN_PATH, useSession } from "@/context/session";

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

  // Colour comes from the token block via <body>; a Tailwind colour utility
  // here would be a second system (SPEC-002 Decision 3).
  return <div className="min-h-screen" />;
}
