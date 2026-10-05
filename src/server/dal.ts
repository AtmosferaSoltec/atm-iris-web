import "server-only";
import { redirect } from "next/navigation";
import type { UserSession } from "@/domain/models";
import { getRepositories, type Repositories } from "./repositories";
import { getSession } from "./session";

// Data Access Layer: every page and Server Action goes through here,
// so authorization is checked next to the data, not only in proxy.ts.

export type AuthorizedContext = { session: UserSession; repos: Repositories };

/** For pages: sends anonymous visitors to the login screen. */
export async function requireSession(): Promise<AuthorizedContext> {
  const context = await currentContext();
  if (!context) redirect("/login");
  return context;
}

/** For Server Actions: throws instead of redirecting mid-mutation. */
export async function authorize(): Promise<AuthorizedContext> {
  const context = await currentContext();
  if (!context) throw new Error("Unauthorized");
  return context;
}

async function currentContext(): Promise<AuthorizedContext | null> {
  const payload = await getSession();
  if (!payload) return null;
  // Only public fields leave the server layer; the API tokens stay here.
  const { userId, churchName, leaderName, email, tokens } = payload;
  return {
    session: { userId, churchName, leaderName, email },
    repos: getRepositories(tokens?.accessToken),
  };
}
