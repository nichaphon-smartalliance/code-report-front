/** What the ReportView partial owns. The three state names were extracted
 *  verbatim from `ReportView.tsx` by TASK-010 and are unchanged. */
export type StageState = "done" | "current" | "pending";

/** The screen's display size, shared by the `h1` and the tick standing beside
 *  it so the tick stays cut to the cap height across the whole clamp. Same
 *  value the new-report head uses — one product, one heading voice
 *  (TASK-013). */
export const HEADING_SIZE = "clamp(1.5rem, 4vw, 2rem)";
