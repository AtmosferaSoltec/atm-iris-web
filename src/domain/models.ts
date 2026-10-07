// Domain models shared by the whole app. Field names are the API contract's
// (docs/api-contract.md), so the API, the web and the consoles share one shape.

export type Id = string;

/* ---------------------------------------------------------------- Accounts */

export type Platform = "web" | "ios" | "windows";

/** `GET /auth/me` (contract §4). */
export type SessionView = {
  user: { id: Id; email: string; fullName: string };
  church: { id: Id; name: string; timezone: string };
  session: { id: Id; platform: Platform; deviceName: string | null };
};

/** What the web keeps of the session (inside the encrypted cookie, without the tokens). */
export type UserSession = {
  userId: Id;
  /** The API session of this browser, to tell it apart in "Dispositivos". */
  sessionId: Id;
  email: string;
  fullName: string;
  church: { id: Id; name: string; timezone: string };
};

export type DeviceSession = {
  id: Id;
  platform: Platform;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string;
  ipAddress: string | null;
  isCurrent: boolean;
};

/* ------------------------------------------------------------------ Church */

/** Church-wide feature switches. Letras is always on. */
export type ChurchModules = {
  bible: boolean;
  multimedia: boolean;
  timeControl: boolean;
};

export type ModuleKey = keyof ChurchModules;

/** Every module exists. What a church gets when the API doesn't say otherwise. */
export const ALL_MODULES: ChurchModules = { bible: true, multimedia: true, timeControl: true };

/**
 * The church's modules as it sees them: its own choice, minus what is switched off for all
 * of Iris (`availableModules`, contract §6).
 */
export function effectiveModules(chosen: ChurchModules, available: ChurchModules): ChurchModules {
  return {
    bible: chosen.bible && available.bible,
    multimedia: chosen.multimedia && available.multimedia,
    timeControl: chosen.timeControl && available.timeControl,
  };
}

/** Contract §6. One quota per church; the three sections add up to `usedBytes`. */
export type StorageUsage = {
  usedBytes: number;
  quotaBytes: number;
  breakdown: { musicBytes: number; backgroundBytes: number; mediaBytes: number };
};

export type Church = {
  id: Id;
  name: string;
  /** IANA zone. "Today", schedules and summaries are computed in it. */
  timezone: string;
  /** What the church sees on (contract §6): its choice, minus what Iris has switched off. */
  modules: ChurchModules;
  /** Modules that exist in Iris today. A module off here is not offered, not even in Ajustes. */
  availableModules: ChurchModules;
  storage: StorageUsage;
  createdAt: string;
  updatedAt: string;
};

export type Person = {
  id: Id;
  name: string;
  /** Blocks led in saved records, skipped ones excluded. */
  blockCount: number;
  createdAt: string;
  updatedAt: string;
};

/* ----------------------------------------------------------------- Services */

export type Schedule = {
  /** 1 = Sunday … 7 = Saturday, church local time. */
  weekday: number;
  hour: number;
  minute: number;
};

export type BlockTemplate = {
  id: Id;
  name: string;
  plannedMinutes: number;
};

export type ServiceType = {
  id: Id;
  name: string;
  /** "#RRGGBB", one of SERVICE_PALETTE. */
  color: string;
  schedule: Schedule | null;
  /** Empty when the service does not track time. Already in order. */
  blocks: BlockTemplate[];
  createdAt: string;
  updatedAt: string;
};

/* ------------------------------------------------------------------- Songs */

/** One projected screen of a song: optional section name + the text shown on the TV. */
export type SongSection = {
  id: Id;
  /** "Estrofa 1", "Coro"… Hidden when empty. */
  label: string | null;
  text: string;
};

export type Song = {
  id: Id;
  title: string;
  author: string;
  sections: SongSection[];
  createdAt: string;
  updatedAt: string;
};

export type SongSummary = {
  id: Id;
  title: string;
  author: string;
  sectionCount: number;
  firstLine: string | null;
  updatedAt: string;
};

/* ------------------------------------------------------------------- Media */

export type MediaKind = "image" | "video" | "audio";

export type MediaAsset = {
  id: Id;
  kind: MediaKind;
  title: string;
  description: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** Audio and video. */
  durationSeconds: number | null;
  /** Image and video. */
  width: number | null;
  height: number | null;
  /** Lyrics background (image or video); see `BACKGROUND_RULES`. */
  isBackground: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UploadTicket = {
  uploadId: Id;
  /** Signed PUT. */
  uploadUrl: string;
  /** Sent as is with the PUT (includes Content-Type). */
  headers: Record<string, string>;
  expiresAt: string;
};

/* ----------------------------------------------------------- Time records */

export type BlockRecordStatus = "completed" | "skipped" | "adjusted";

export type BlockRecord = {
  id: Id;
  name: string;
  plannedSeconds: number;
  actualSeconds: number;
  personId: Id | null;
  /** Name when the record was saved, so it stays readable after a rename or delete. */
  personName: string | null;
  status: BlockRecordStatus;
};

/** The saved timing of one service. Only times are stored, never the content used. */
export type ServiceRecord = {
  id: Id;
  /** Start of the first block, UTC. */
  date: string;
  serviceTypeId: Id;
  /** Copy, shown when the type is deleted. */
  serviceTypeName: string;
  blocks: BlockRecord[];
  createdAt: string;
  updatedAt: string;
};

/* ------------------------------------------------------------------ Lists */

export type PageMeta = { page: number; limit: number; total: number; totalPages: number };

export type Paginated<T> = { data: T[]; meta: PageMeta };
