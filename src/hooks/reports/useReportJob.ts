"use client";

import { useEffect, useState } from "react";
import { readStoredLanguage } from "@/context/i18n";
import { ApiError, NetworkError } from "@/lib/api/client";
import { fetchReport } from "@/services/report.service";
import { TERMINAL_STATUSES, type ReportJob } from "@/types/api/main";
import type { ReportJobState } from "@/types/app/reports";

/**
 * Polling for one run (TASK-008 item 1 / SPEC-001 "Poll interval").
 *
 * 2 s, backing off to 5 s once the screen has been polling for 60 s. The clock
 * starts when this hook mounts, so a **refresh mid-run restarts at 2 s** — the
 * page has no memory of how long the job has been going and inventing one would
 * mean persisting state we were told not to keep (there is no history anywhere
 * in this app).
 *
 * Stops on any terminal status and on unmount. The `jobId` lives in the URL, so
 * a reload resumes polling the same run with no extra machinery.
 */
export const POLL_FAST_MS = 2_000;
export const POLL_SLOW_MS = 5_000;
export const POLL_BACKOFF_AFTER_MS = 60_000;

/** The hook's return shape moved to `types/app/reports` (TASK-010). */
export type { ReportJobState };

export function useReportJob(jobId: string): ReportJobState {
  const [job, setJob] = useState<ReportJob | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [offline, setOffline] = useState(false);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const stop = () => {
      stopped = true;
      setPolling(false);
    };

    const schedule = () => {
      if (stopped) return;
      const elapsed = Date.now() - startedAt;
      timer = setTimeout(tick, elapsed >= POLL_BACKOFF_AFTER_MS ? POLL_SLOW_MS : POLL_FAST_MS);
    };

    const tick = async () => {
      try {
        // `Accept-Language` is read per request from the stored preference:
        // the first poll leaves before the i18n provider's own mount effect has
        // read it, and the language only decides which language the SERVER
        // writes its message in. Switching it mid-run must not restart the loop.
        const next = await fetchReport(jobId, readStoredLanguage(), controller.signal);
        if (stopped) return;
        setJob(next);
        setOffline(false);
        setLoadError(null);
        if (TERMINAL_STATUSES.includes(next.status)) stop();
        else schedule();
      } catch (cause: unknown) {
        if (stopped) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        if (cause instanceof NetworkError) {
          // Transient by nature (offline, proxy restart). Keep the last known
          // job on screen and keep trying rather than declaring the run dead.
          setOffline(true);
          schedule();
          return;
        }
        if (cause instanceof ApiError) {
          // A 401 has already been turned into a redirect by the client module;
          // anything else (404 for someone else's job, 500) is final for this
          // screen, and its `message` is the server's own text.
          setLoadError(cause);
          stop();
          return;
        }
        setLoadError(null);
        stop();
      }
    };

    void tick();

    return () => {
      stopped = true;
      controller.abort();
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [jobId]);

  return { job, loadError, offline, polling };
}
