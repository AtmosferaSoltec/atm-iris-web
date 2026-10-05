import type {
  Church,
  DeviceSession,
  Id,
  Invitation,
  MediaAsset,
  MediaKind,
  Permission,
  Person,
  Role,
  ServiceRecord,
  ServiceType,
  Song,
  UserSession,
} from "@/domain/models";
import { can, ROLE_PERMISSIONS } from "@/lib/permissions";
import { compareNames } from "@/lib/text";
import { ApiError } from "../api/errors";
import { emptyChurchData, newChurch, sampleContent, sampleSongs } from "./seed";

// In-memory stand-in for atm-iris-api. Every repository shares one world so a
// change on one screen shows up on the others. It resets when the server
// restarts; user and church ids are fixed so session cookies survive that.

export type MockUser = { id: Id; email: string; fullName: string; password: string };
export type MockMembership = { id: Id; userId: Id; role: Role; joinedAt: string };
export type MockInvitation = Invitation & { churchId: Id; token: string };
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
  members: MockMembership[];
  invitations: MockInvitation[];
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
  /** `sign-in` enters the last church used (contract §5). */
  lastChurch: Record<Id, Id>;
  /** Uploaded bytes by storage key (src/app/api/mock-storage). */
  files: Map<string, MockFile>;
};

export const MOCK_PASSWORD = "vidanueva123";
export const MOCK_IDS = {
  pastor: "00000000-0000-4000-8000-000000000001",
  admin: "00000000-0000-4000-8000-000000000002",
  operator: "00000000-0000-4000-8000-000000000003",
  vidaNueva: "00000000-0000-4000-8000-0000000000c1",
  betania: "00000000-0000-4000-8000-0000000000c2",
} as const;

export function createWorld(now = new Date()): MockWorld {
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
  const users: MockUser[] = [
    { id: MOCK_IDS.pastor, email: "pastor@vidanueva.org", fullName: "Daniel Ruiz" },
    { id: MOCK_IDS.admin, email: "admin@vidanueva.org", fullName: "Ana Torres" },
    { id: MOCK_IDS.operator, email: "operador@vidanueva.org", fullName: "Carlos Pérez" },
  ].map((user) => ({ ...user, password: MOCK_PASSWORD }));

  const vidaNueva: ChurchData = {
    ...emptyChurchData(newChurch(MOCK_IDS.vidaNueva, "Iglesia Vida Nueva", now), [
      { id: crypto.randomUUID(), userId: MOCK_IDS.pastor, role: "owner", joinedAt: daysAgo(400) },
      { id: crypto.randomUUID(), userId: MOCK_IDS.admin, role: "admin", joinedAt: daysAgo(200) },
      {
        id: crypto.randomUUID(),
        userId: MOCK_IDS.operator,
        role: "operator",
        joinedAt: daysAgo(30),
      },
    ]),
    ...sampleContent(now),
  };
  vidaNueva.invitations.push({
    id: crypto.randomUUID(),
    churchId: MOCK_IDS.vidaNueva,
    token: "invitacion-de-prueba",
    email: "sofia@vidanueva.org",
    role: "operator",
    invitedBy: { id: MOCK_IDS.pastor, fullName: "Daniel Ruiz" },
    createdAt: daysAgo(2),
    expiresAt: new Date(now.getTime() + 5 * 86_400_000).toISOString(),
  });

  // A second church, so the church switcher has somewhere to go.
  const betania: ChurchData = emptyChurchData(newChurch(MOCK_IDS.betania, "Iglesia Betania", now), [
    { id: crypto.randomUUID(), userId: MOCK_IDS.pastor, role: "admin", joinedAt: daysAgo(90) },
  ]);
  betania.songs = sampleSongs(now, ["Sublime gracia", "Castillo fuerte"]);

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
    churches: [vidaNueva, betania],
    sessions,
    lastChurch: {},
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

const LATENCY_MS = process.env.NODE_ENV === "test" ? 0 : 250;
export const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
export const clone = <T>(value: T): T => structuredClone(value);
export const now = () => new Date().toISOString();

export const notFound = () => new ApiError(404, "NOT_FOUND", "No encontramos lo que buscas.");

export function requireSignedIn(session: UserSession | undefined): UserSession {
  if (!session)
    throw new ApiError(401, "UNAUTHORIZED", "Tu sesión expiró. Vuelve a iniciar sesión.");
  return session;
}

export function requirePermission(session: UserSession | undefined, permission: Permission): void {
  if (!can(requireSignedIn(session), permission)) {
    throw new ApiError(403, "FORBIDDEN", "Tu rol no permite hacer esto.");
  }
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

export function sessionFor(
  world: MockWorld,
  user: MockUser,
  churchId: Id,
  sessionId: Id,
): UserSession {
  const memberships = world.churches.flatMap((data) =>
    data.members
      .filter((member) => member.userId === user.id)
      .map((member) => ({ id: data.church.id, name: data.church.name, role: member.role })),
  );
  const current = world.churches.find((data) => data.church.id === churchId);
  const membership = memberships.find((church) => church.id === churchId);
  if (!current || !membership) {
    throw new ApiError(
      403,
      "NO_CHURCH_ACCESS",
      "Tu cuenta no tiene acceso a ninguna iglesia activa.",
    );
  }
  return {
    userId: user.id,
    sessionId,
    email: user.email,
    fullName: user.fullName,
    church: { id: current.church.id, name: current.church.name, timezone: current.church.timezone },
    role: membership.role,
    permissions: [...ROLE_PERMISSIONS[membership.role]],
    churches: memberships.sort((a, b) => compareNames(a.name, b.name)),
  };
}
