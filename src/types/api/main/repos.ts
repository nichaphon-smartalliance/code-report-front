/**
 * `POST /api/repos/branches` and `POST /api/repos/committers` shapes, exactly as
 * SPEC-003 §"API / Interface Design" defines them (TASK-018; the endpoints are
 * TASK-017's).
 *
 * Both are **read-only inspections** of a remote: they write nothing, and they
 * sit behind the same session gate as `/api/reports`. Their error envelope is
 * SPEC-001's, so a failure is rendered from `error.message` verbatim and never
 * composed from a code.
 *
 * `pat` follows the same rule as the report body — **absent, not empty**, for a
 * public repository. It exists in these objects for the length of one `fetch`
 * and is never persisted anywhere (REQ-001 §11).
 */

export type BranchesInput = {
  repoUrl: string;
  pat?: string;
};

/** Short names (`refs/heads/` stripped), in git's own order. */
export type BranchesResponse = {
  branches: string[];
  /** `null` when the remote did not advertise one. */
  defaultBranch: string | null;
};

export type CommittersInput = {
  repoUrl: string;
  pat?: string;
  /** Required here, unlike `POST /api/reports`: the list has no meaning without it. */
  branch: string;
  dateFrom: string;
  dateTo: string;
};

/**
 * One person in the chosen branch + range.
 *
 * **`email` is always present and always a string (SPEC-003, Q-BE-19):** a
 * commit with no author e-mail arrives as `email: ""` — never an omitted key and
 * never `null`. So the value the form sends as `author` is one test,
 * `email === "" ? name : email`, with no second branch for `undefined`/`null`.
 */
export type Committer = {
  name: string;
  email: string;
  commits: number;
};

/** Sorted by `commits` descending, then `name` ascending. Merges excluded. */
export type CommittersResponse = {
  committers: Committer[];
};
