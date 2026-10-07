import "server-only";
import type { DeviceSession, SessionView, UserSession } from "@/domain/models";
import type { SessionTokens } from "../../session-token";
import type { AuthResult, AuthService } from "../types";
import { createApiClient, segment, type ClientOptions } from "./client";

/** Contract §4 `AuthResult`. */
export type ApiAuthResult = SessionView & SessionTokens;

export const WEB_CLIENT = { platform: "web", deviceName: "Navegador" } as const;

export function toUserSession(view: SessionView): UserSession {
  return {
    userId: view.user.id,
    sessionId: view.session.id,
    email: view.user.email,
    fullName: view.user.fullName,
    church: {
      id: view.church.id,
      name: view.church.name,
      timezone: view.church.timezone,
    },
  };
}

export function toAuthResult(result: ApiAuthResult): AuthResult {
  return {
    session: toUserSession(result),
    tokens: {
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.refreshTokenExpiresAt,
    },
  };
}

export function apiAuth(options: ClientOptions = {}): AuthService {
  const api = createApiClient(options);
  const post = <T = void>(path: string, body?: unknown) => api<T>(path, { method: "POST", body });

  return {
    signIn: async (input) =>
      toAuthResult(await post<ApiAuthResult>("/auth/sign-in", { ...input, client: WEB_CLIENT })),
    signUp: async (input) =>
      toAuthResult(await post<ApiAuthResult>("/auth/sign-up", { ...input, client: WEB_CLIENT })),
    refresh: async (refreshToken) =>
      toAuthResult(await post<ApiAuthResult>("/auth/refresh", { refreshToken })),
    signOut: () => post("/auth/sign-out"),
    signOutAll: () => post("/auth/sign-out-all"),
    requestPasswordReset: (email) => post("/auth/forgot-password", { email }),
    verifyResetCode: (email, code) => post("/auth/verify-reset-code", { email, code }),
    resetPassword: (input) => post("/auth/reset-password", input),
    getSession: async () => toUserSession(await api<SessionView>("/auth/me")),
    updateProfile: async (fullName) =>
      toUserSession(await api<SessionView>("/auth/me", { method: "PATCH", body: { fullName } })),
    changePassword: (input) => post("/auth/change-password", input),
    listSessions: () => api<DeviceSession[]>("/auth/sessions"),
    revokeSession: (id) => api(`/auth/sessions/${segment(id)}`, { method: "DELETE" }),
  };
}
