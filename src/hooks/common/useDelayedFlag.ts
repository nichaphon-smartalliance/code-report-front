"use client";

import { useEffect, useState } from "react";

/**
 * True only once `active` has been true for `delayMs`.
 *
 * Guards the "spinner that flashes" tell: a login against a warm backend
 * answers in well under 150ms, and a spinner that appears and vanishes inside
 * that window reads as a glitch rather than as progress. The button still goes
 * disabled immediately — only the spinner waits.
 */
export function useDelayedFlag(active: boolean, delayMs = 150): boolean {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const timer = window.setTimeout(() => setShown(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [active, delayMs]);

  return shown;
}
