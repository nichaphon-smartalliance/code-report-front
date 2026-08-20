"use client";

import { NewReportForm } from "@/components/NewReportForm";
import { RequireAuth } from "@/components/RequireAuth";

/** The authenticated landing route: the new-report form (TASK-007). */
export default function NewReportPage() {
  return (
    <RequireAuth>
      <NewReportForm />
    </RequireAuth>
  );
}
