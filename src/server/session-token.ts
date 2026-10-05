import "server-only";
import { createHash } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import type { UserSession } from "@/domain/models";
import { env } from "./env";

// Encryption of the session cookie, shared by proxy.ts (which refreshes tokens)
// and session.ts (which reads them while rendering). No next/headers here, so
// both can use it.

export const SESSION_COOKIE = "iris_session";

/** API tokens. Absent with AUTH_SOURCE=mock. */
export type SessionTokens = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type SessionPayload = UserSession & { tokens?: SessionTokens };

/** Same idle window as the API's refresh token, so mock sessions behave alike. */
const MOCK_SESSION_DAYS = 60;

// A256GCM wants exactly 32 bytes; SESSION_SECRET is any string of 32+ characters.
const key = createHash("sha256").update(env.SESSION_SECRET).digest();

/** Encrypted (not just signed): nothing inside an Iris cookie is readable by the browser. */
export async function seal(payload: Record<string, unknown>, expiresAt: Date): Promise<string> {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .encrypt(key);
}

/** null when missing, tampered with or expired. */
export async function unseal<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, key);
    return payload as T;
  } catch {
    return null;
  }
}

export function encryptSession(payload: SessionPayload): Promise<string> {
  return seal(payload, sessionExpiry(payload));
}

export function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  return unseal<SessionPayload>(token);
}

/** The cookie lives exactly as long as the refresh token. */
export function sessionExpiry(payload: SessionPayload): Date {
  if (payload.tokens) return new Date(payload.tokens.refreshTokenExpiresAt);
  return new Date(Date.now() + MOCK_SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export function sessionCookieOptions(payload: SessionPayload) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: sessionExpiry(payload),
  };
}

/** Refresh a minute early so a request never reaches the API with a token that dies mid-flight. */
export function needsRefresh(payload: SessionPayload, now = Date.now()): boolean {
  if (!payload.tokens) return false;
  return new Date(payload.tokens.accessTokenExpiresAt).getTime() - now < 60_000;
}
