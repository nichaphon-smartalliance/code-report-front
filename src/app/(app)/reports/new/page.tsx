import { RequireAuth } from "@/components/common";
import { NewReportContent } from "@/components/partials/NewReport";

/** The authenticated landing route: the new-report form (TASK-007). */
export default function NewReportPage() {
  return (
    <RequireAuth>
      <NewReportContent />
    </RequireAuth>
  );
}
