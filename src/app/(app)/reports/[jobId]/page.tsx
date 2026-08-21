import { RequireAuth } from "@/components/common";
import { ReportViewContent } from "@/components/partials/ReportView";

/**
 * The report view (TASK-008). The jobId lives in the URL, so a refresh mid-run
 * simply mounts this again and resumes polling the same run.
 *
 * In Next 16 `params` is a Promise; the page is a thin async server component
 * that awaits it and hands the id to the client boundary below (TASK-010).
 */
export default async function ReportPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return (
    <RequireAuth>
      <ReportViewContent jobId={jobId} />
    </RequireAuth>
  );
}
