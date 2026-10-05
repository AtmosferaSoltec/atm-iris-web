import "server-only";
import type { SessionTokens } from "../../session-token";
import { AuthError, type AuthResult, type AuthService } from "../types";
import { ApiError, createApiClient, type ApiClient } from "./client";

/** atm-iris-api `AuthResult` (docs/plans/01-auth.md). */
type ApiAuthResult = SessionTokens & {
  user: { id: string; email: string; fullName: string };
  church: { id: string; name: string };
  role: "owner" | "member";
};

/** API field names → web form field names. */
const FIELD_NAMES: Record<string, string> = { fullName: "leaderName" };

const WEB_CLIENT = { platform: "web", deviceName: "Navegador" } as const;

export function toAuthResult(result: ApiAuthResult): AuthResult {
  return {
    session: {
      userId: result.user.id,
      churchName: result.church.name,
      leaderName: result.user.fullName,
      email: result.user.email,
    },
    tokens: {
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.refreshTokenExpiresAt,
    },
  };
}

/** Every API failure becomes an AuthError the form can show. */
async function translated<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    const fieldErrors = error.errors
      ? Object.fromEntries(
          Object.entries(error.errors).map(([field, message]) => [
            FIELD_NAMES[field] ?? field,
            message,
          ]),
        )
      : undefined;
    throw new AuthError(error.code, error.message, fieldErrors);
  }
}

export function apiAuth(accessToken?: string, forwardedFor?: string): AuthService {
  const api: ApiClient = createApiClient({ accessToken, forwardedFor });

  return {
    signIn: (input) =>
      translated(async () =>
        toAuthResult(
          await api<ApiAuthResult>("/auth/sign-in", {
            method: "POST",
            body: { ...input, client: WEB_CLIENT },
          }),
        ),
      ),
    signUp: ({ leaderName, ...input }) =>
      translated(async () =>
        toAuthResult(
          await api<ApiAuthResult>("/auth/sign-up", {
            method: "POST",
            body: { ...input, fullName: leaderName, client: WEB_CLIENT },
          }),
        ),
      ),
    refresh: (refreshToken) =>
      translated(async () =>
        toAuthResult(
          await api<ApiAuthResult>("/auth/refresh", { method: "POST", body: { refreshToken } }),
        ),
      ),
    signOut: () => translated(() => api<void>("/auth/sign-out", { method: "POST" })),
    requestPasswordReset: (email) =>
      translated(() => api<void>("/auth/forgot-password", { method: "POST", body: { email } })),
    verifyResetCode: (email, code) =>
      translated(() =>
        api<void>("/auth/verify-reset-code", { method: "POST", body: { email, code } }),
      ),
    resetPassword: (input) =>
      translated(() => api<void>("/auth/reset-password", { method: "POST", body: input })),
  };
}
