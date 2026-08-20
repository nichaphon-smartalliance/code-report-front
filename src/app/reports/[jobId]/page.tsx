"use client";

import { use } from "react";
import { ReportView } from "@/components/ReportView";
import { RequireAuth } from "@/components/RequireAuth";

/**
 * The report view (TASK-008). The jobId lives in the URL, so a refresh mid-run
 * simply mounts this again and resumes polling the same run.
 */
export default function ReportPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  return (
    <RequireAuth>
      <ReportView jobId={jobId} />
    </RequireAuth>
  );
}
