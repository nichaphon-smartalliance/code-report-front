import type { Language } from "@/constant/text";
import {
  fetchBranches as fetchBranchesRequest,
  fetchCommitters as fetchCommittersRequest,
} from "@/lib/api/api-main";
import type {
  BranchesInput,
  BranchesResponse,
  CommittersInput,
  CommittersResponse,
} from "@/types/api/main";

/** What the app imports for repository inspection. Thin wrappers — see
 *  `report.service.ts`; a component never calls `apiRequest` itself. */

export function fetchBranches(
  input: BranchesInput,
  language: Language,
  signal?: AbortSignal,
): Promise<BranchesResponse> {
  return fetchBranchesRequest(input, language, signal);
}

export function fetchCommitters(
  input: CommittersInput,
  language: Language,
  signal?: AbortSignal,
): Promise<CommittersResponse> {
  return fetchCommittersRequest(input, language, signal);
}
