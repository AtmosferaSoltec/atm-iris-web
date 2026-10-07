import type {
  Church,
  DeviceSession,
  Id,
  MediaAsset,
  MediaKind,
  Person,
  ServiceRecord,
  ServiceType,
  Song,
  UserSession,
} from "@/domain/models";
import { ApiError } from "../api/errors";
import { emptyChurchData, newChurch, sampleContent } from "./seed";

// In-memory stand-in for atm-iris-api. Every repository shares one world so a
// change on one screen shows up on the others. It resets when the server
// restarts; user and church ids are fixed so session cookies survive that.

export type MockUser = {
  id: Id;
  /** Each account belongs to one church. */
  churchId: Id;
  email: string;
  fullName: string;
  password: string;
};
export type MockDeviceSession = Omit<DeviceSession, "isCurrent"> & { userId: Id };
export type MockMedia = MediaAsset & { storageKey: string };
export type MockUpload = {
  id: Id;
  kind: MediaKind;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  expiresAt: string;
};
export type MockFile = { contentType: string; bytes: Uint8Array<ArrayBuffer> };

export type ChurchData = {
  church: Church;
  people: Person[];
  serviceTypes: ServiceType[];
  songs: Song[];
  media: MockMedia[];
  uploads: MockUpload[];
  records: ServiceRecord[];
};

export type MockWorld = {
  users: MockUser[];
  churches: ChurchData[];
  sessions: MockDeviceSession[];
  /** Uploaded bytes by storage key (src/app/api/mock-storage). */
  files: Map<string, MockFile>;
};

export const MOCK_PASSWORD = "vidanueva123";
export const MOCK_IDS = {
  pastor: "00000000-0000-4000-8000-000000000001",
  vidaNueva: "00000000-0000-4000-8000-0000000000c1",
} as const;

export function createWorld(now = new Date()): MockWorld {
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
  const users: MockUser[] = [
    {
      id: MOCK_IDS.pastor,
      churchId: MOCK_IDS.vidaNueva,
      email: "pastor@vidanueva.org",
      fullName: "Daniel Ruiz",
      password: MOCK_PASSWORD,
    },
  ];

  const vidaNueva: ChurchData = {
    ...emptyChurchData(newChurch(MOCK_IDS.vidaNueva, "Iglesia Vida Nueva", now)),
    ...sampleContent(now),
  };

  const sessions: MockDeviceSession[] = [
    {
      id: crypto.randomUUID(),
      userId: MOCK_IDS.pastor,
      platform: "ios",
      deviceName: "iPad de la sala",
      createdAt: daysAgo(40),
      lastUsedAt: daysAgo(3),
      ipAddress: "192.168.1.24",
    },
    {
      id: crypto.randomUUID(),
      userId: MOCK_IDS.pastor,
      platform: "windows",
      deviceName: "PC de proyección",
      createdAt: daysAgo(60),
      lastUsedAt: daysAgo(10),
      ipAddress: "192.168.1.31",
    },
  ];

  return {
    users,
    churches: [vidaNueva],
    sessions,
    files: new Map(),
  };
}

// Survives dev hot reloads (module re-evaluation).
const globalStore = globalThis as typeof globalThis & { __irisMockWorld?: MockWorld };

export function mockWorld(): MockWorld {
  globalStore.__irisMockWorld ??= createWorld();
  return globalStore.__irisMockWorld;
}

export function resetMockWorld(world: MockWorld = createWorld()): void {
  globalStore.__irisMockWorld = world;
}

/* ---------------------------------------------------------------- Helpers */

const LATENCY_MS = process.env.NODE_ENV === "test" ? 0 : 40;
export const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
export const clone = <T>(value: T): T => structuredClone(value);
export const now = () => new Date().toISOString();

export const notFound = () => new ApiError(404, "NOT_FOUND", "No encontramos lo que buscas.");

export function requireSignedIn(session: UserSession | undefined): UserSession {
  if (!session)
    throw new ApiError(401, "UNAUTHORIZED", "Tu sesión expiró. Vuelve a iniciar sesión.");
  return session;
}

/**
 * The session's church. When auth is real (AUTH_SOURCE=api) and data is
 * mocked, the API's church id is unknown here and the sample church stands in.
 */
export function churchOf(session: UserSession | undefined): ChurchData {
  const world = mockWorld();
  const signedIn = requireSignedIn(session);
  return world.churches.find((data) => data.church.id === signedIn.church.id) ?? world.churches[0];
}

export function sessionFor(world: MockWorld, user: MockUser, sessionId: Id): UserSession {
  const current = world.churches.find((data) => data.church.id === user.churchId);
  if (!current) {
    throw new ApiError(401, "UNAUTHORIZED", "Tu sesión expiró. Vuelve a iniciar sesión.");
  }
  return {
    userId: user.id,
    sessionId,
    email: user.email,
    fullName: user.fullName,
    church: { id: current.church.id, name: current.church.name, timezone: current.church.timezone },
  };
}
