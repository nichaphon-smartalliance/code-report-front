import type { Language } from "@/constant/text";
import { fetchMe, login as loginRequest, logout as logoutRequest } from "@/lib/api/api-main";
import type { SessionUser } from "@/types/api/main";

/**
 * What the app imports for auth. Thin wrappers over `lib/api/api-main.ts` —
 * they add no logic, no caching and no error translation, which is exactly the
 * point: the layer exists so a call site never reaches past it into the
 * transport (TASK-010 / SPEC-002 Decision 2).
 */

export function me(language: Language, signal?: AbortSignal): Promise<SessionUser> {
  return fetchMe(language, signal);
}

export function login(
  credentials: { username: string; password: string },
  language: Language,
): Promise<SessionUser> {
  return loginRequest(credentials, language);
}

export function logout(language: Language): Promise<void> {
  return logoutRequest(language);
}
