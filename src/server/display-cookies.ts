import "server-only";
import { cookies } from "next/headers";
import { env } from "./env";

// A TV keeps its link in two httpOnly cookies, so no script on the page can read them:
// while pairing, which code it is waiting on; once linked, its token (contract §18).

const TOKEN_COOKIE = "iris_display";
const PAIRING_COOKIE = "iris_display_pairing";
const YEAR_SECONDS = 365 * 24 * 60 * 60;

const options = (maxAge: number) => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function displayToken(): Promise<string | null> {
  return (await cookies()).get(TOKEN_COOKIE)?.value ?? null;
}

export async function saveDisplayToken(token: string): Promise<void> {
  (await cookies()).set(TOKEN_COOKIE, token, options(YEAR_SECONDS));
}

export async function forgetDisplay(): Promise<void> {
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE);
  jar.delete(PAIRING_COOKIE);
}

export async function pendingPairing(): Promise<{ id: string; secret: string } | null> {
  const value = (await cookies()).get(PAIRING_COOKIE)?.value;
  const [id, secret] = value?.split(":") ?? [];
  return id && secret ? { id, secret } : null;
}

export async function savePendingPairing(id: string, secret: string): Promise<void> {
  (await cookies()).set(PAIRING_COOKIE, `${id}:${secret}`, options(10 * 60));
}

export async function clearPendingPairing(): Promise<void> {
  (await cookies()).delete(PAIRING_COOKIE);
}
