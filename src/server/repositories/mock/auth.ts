import type { UserSession } from "@/domain/models";
import { ApiError } from "../api/errors";
import type { AuthResult, AuthService } from "../types";
import { emptyChurchData, newChurch } from "./seed";
import {
  clone,
  delay,
  MOCK_IDS,
  mockWorld,
  now,
  requireSignedIn,
  sessionFor,
  type MockUser,
  type MockWorld,
} from "./world";

/** In mock mode every recovery code is this one, and it is printed in the server log. */
export const MOCK_RESET_CODE = "123456";

const RESET_CODE_INVALID = () =>
  new ApiError(
    400,
    "RESET_CODE_INVALID",
    "El código no es válido o ya venció. Solicita uno nuevo.",
  );

/** Opens a device session for `user`, signed into the church of the account. */
export function startMockSession(world: MockWorld, user: MockUser): AuthResult {
  const id = crypto.randomUUID();
  world.sessions.push({
    id,
    userId: user.id,
    platform: "web",
    deviceName: "Navegador",
    createdAt: now(),
    lastUsedAt: now(),
    ipAddress: "127.0.0.1",
  });
  return { session: sessionFor(world, user, id) };
}

function currentUser(world: MockWorld, session: UserSession): MockUser {
  const user = world.users.find((candidate) => candidate.id === session.userId);
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Tu sesión expiró. Vuelve a iniciar sesión.");
  // The world resets on restart while the cookie lives on: bring this device back.
  if (!world.sessions.some((device) => device.id === session.sessionId)) {
    world.sessions.push({
      id: session.sessionId,
      userId: user.id,
      platform: "web",
      deviceName: "Navegador",
      createdAt: now(),
      lastUsedAt: now(),
      ipAddress: "127.0.0.1",
    });
  }
  return user;
}

/**
 * Like the iPad demo, any email signs in: the seeded account
 * (pastor@vidanueva.org) as itself and any other as the pastor. "error@…" simulates bad credentials.
 */
export function mockAuth(session?: UserSession): AuthService {
  return {
    async signIn({ email }) {
      await delay();
      if (email.startsWith("error@")) {
        throw new ApiError(
          401,
          "INVALID_CREDENTIALS",
          "El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.",
        );
      }
      const world = mockWorld();
      const user =
        world.users.find((candidate) => candidate.email === email) ??
        world.users.find((candidate) => candidate.id === MOCK_IDS.pastor)!;
      return startMockSession(world, user);
    },

    async signUp({ churchName, fullName, email, password }) {
      await delay();
      const world = mockWorld();
      if (email.startsWith("existe@") || world.users.some((user) => user.email === email)) {
        throw new ApiError(
          409,
          "EMAIL_TAKEN",
          "Ya existe una cuenta con ese correo. Intenta iniciar sesión.",
          { email: "Ya existe una cuenta con ese correo." },
        );
      }
      const church = newChurch(crypto.randomUUID(), churchName, new Date());
      const user: MockUser = {
        id: crypto.randomUUID(),
        churchId: church.id,
        email,
        fullName,
        password,
      };
      world.users.push(user);
      world.churches.push(emptyChurchData(church));
      return startMockSession(world, user);
    },

    async refresh() {
      // Mock sessions carry no tokens, so there is never anything to refresh.
      throw new ApiError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Tu sesión expiró. Vuelve a iniciar sesión.",
      );
    },

    async signOut() {
      await delay();
      if (!session) return;
      const world = mockWorld();
      world.sessions = world.sessions.filter((device) => device.id !== session.sessionId);
    },

    async signOutAll() {
      await delay();
      const signedIn = requireSignedIn(session);
      const world = mockWorld();
      world.sessions = world.sessions.filter((device) => device.userId !== signedIn.userId);
    },

    async requestPasswordReset(email) {
      await delay();
      console.info(`[auth mock] Código de recuperación para ${email}: ${MOCK_RESET_CODE}`);
    },

    async verifyResetCode(_email, code) {
      await delay();
      if (code !== MOCK_RESET_CODE) throw RESET_CODE_INVALID();
    },

    async resetPassword({ email, code, password }) {
      await delay();
      if (code !== MOCK_RESET_CODE) throw RESET_CODE_INVALID();
      const world = mockWorld();
      const user = world.users.find((candidate) => candidate.email === email);
      if (user) {
        user.password = password;
        world.sessions = world.sessions.filter((device) => device.userId !== user.id);
      }
    },

    async getSession() {
      await delay();
      const signedIn = requireSignedIn(session);
      const world = mockWorld();
      return sessionFor(world, currentUser(world, signedIn), signedIn.sessionId);
    },

    async updateProfile(fullName) {
      await delay();
      const signedIn = requireSignedIn(session);
      const world = mockWorld();
      const user = currentUser(world, signedIn);
      user.fullName = fullName;
      return sessionFor(world, user, signedIn.sessionId);
    },

    async changePassword({ currentPassword, password }) {
      await delay();
      const signedIn = requireSignedIn(session);
      const world = mockWorld();
      const user = currentUser(world, signedIn);
      if (currentPassword !== user.password) {
        throw new ApiError(
          400,
          "INVALID_CURRENT_PASSWORD",
          "La contraseña actual no es correcta.",
          {
            currentPassword: "La contraseña actual no es correcta.",
          },
        );
      }
      user.password = password;
      world.sessions = world.sessions.filter(
        (device) => device.userId !== user.id || device.id === signedIn.sessionId,
      );
    },

    async listSessions() {
      await delay();
      const signedIn = requireSignedIn(session);
      const world = mockWorld();
      currentUser(world, signedIn);
      return clone(
        world.sessions
          .filter((device) => device.userId === signedIn.userId)
          .map(({ userId: _userId, ...device }) => ({
            ...device,
            isCurrent: device.id === signedIn.sessionId,
          }))
          .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt)),
      );
    },

    async revokeSession(id) {
      await delay();
      const signedIn = requireSignedIn(session);
      const world = mockWorld();
      const device = world.sessions.find(
        (candidate) => candidate.id === id && candidate.userId === signedIn.userId,
      );
      if (!device) throw new ApiError(404, "NOT_FOUND", "No encontramos esa sesión.");
      world.sessions = world.sessions.filter((candidate) => candidate.id !== id);
    },
  };
}
