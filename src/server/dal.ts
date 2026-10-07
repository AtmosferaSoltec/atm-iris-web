import "server-only";
import type { Route } from "next";
import { redirect } from "next/navigation";
import type { UserSession } from "@/domain/models";
import { ApiError } from "./repositories/api/errors";
import { getRepositories, type Repositories } from "./repositories";
import { deleteSession, getSession } from "./session";
import type { SessionTokens } from "./session-token";

// Data Access Layer: every page and Server Action goes through here,
// so authorization is checked next to the data, not only in proxy.ts.

export type AuthorizedContext = {
  session: UserSession;
  repos: Repositories;
  /** For actions that rewrite the cookie (profile, church name). */
  tokens?: SessionTokens;
};

/** Pages can't write cookies; this route handler clears the dead one and goes to /login. */
export const SESSION_EXPIRED_ROUTE = "/api/session/expired" as Route;

/**
 * A 401 on a data call means the session died after proxy.ts let the request
 * in (revoked from another device, password changed…). Back to the login.
 */
async function handleUnauthorized(): Promise<never> {
  try {
    await deleteSession();
  } catch {
    // Rendering a page: cookies are read-only here.
    redirect(SESSION_EXPIRED_ROUTE);
  }
  redirect("/login");
}

/** For pages: sends anonymous visitors to the login screen. */
export async function requireSession(): Promise<AuthorizedContext> {
  const context = await currentContext();
  if (!context) redirect("/login");
  return context;
}

/** For Server Actions: throws instead of redirecting mid-mutation. */
export async function authorize(): Promise<AuthorizedContext> {
  const context = await currentContext();
  if (!context)
    throw new ApiError(401, "UNAUTHORIZED", "Tu sesión expiró. Vuelve a iniciar sesión.");
  return context;
}

async function currentContext(): Promise<AuthorizedContext | null> {
  const payload = await getSession();
  if (!payload) return null;
  // Only public fields leave the server layer; the API tokens stay here.
  const { tokens, ...session } = payload;
  return {
    session,
    tokens,
    repos: getRepositories({
      session,
      accessToken: tokens?.accessToken,
      onUnauthorized: handleUnauthorized,
    }),
  };
}
