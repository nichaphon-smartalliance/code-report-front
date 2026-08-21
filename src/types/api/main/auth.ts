/**
 * `GET /api/auth/me` / `POST /api/auth/login` shapes. Moved verbatim from
 * `lib/api/client.ts` by TASK-010.
 */

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
};
