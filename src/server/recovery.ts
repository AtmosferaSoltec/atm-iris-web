import "server-only";
import { cookies } from "next/headers";
import { env } from "./env";
import { seal, unseal } from "./session-token";

// Carries the password-recovery flow between its 3 screens without putting the
// email or the code in the URL. Lives as long as the API's code (15 min).

const RECOVERY_COOKIE = "iris_recovery";
const TTL_MS = 15 * 60 * 1000;

export type RecoveryState = {
  email: string;
  /** Set once step 2 accepted it; step 3 sends it with the new password. */
  code?: string;
};

export async function saveRecovery(state: RecoveryState): Promise<void> {
  const expires = new Date(Date.now() + TTL_MS);
  const cookieStore = await cookies();
  cookieStore.set(RECOVERY_COOKIE, await seal(state, expires), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/recuperar",
    expires,
  });
}

export async function readRecovery(): Promise<RecoveryState | null> {
  const cookieStore = await cookies();
  return unseal<RecoveryState>(cookieStore.get(RECOVERY_COOKIE)?.value);
}

export async function clearRecovery(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({ name: RECOVERY_COOKIE, path: "/recuperar" });
}
