import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import type { AuthResult } from "./repositories/types";
import {
  decryptSession,
  encryptSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  type SessionPayload,
} from "./session-token";

// Session cookie for pages and Server Actions. proxy.ts keeps its tokens fresh.

export async function createSession(payload: SessionPayload): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await encryptSession(payload), sessionCookieOptions(payload));
}

/** Signs this browser in with what the API (or the mock) answered. */
export async function startSession(result: AuthResult): Promise<void> {
  await createSession({ ...result.session, tokens: result.tokens });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** The signed-in session for this request, or null. Memoized per render pass. */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  return decryptSession(cookieStore.get(SESSION_COOKIE)?.value);
});
