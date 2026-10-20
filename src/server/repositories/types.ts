import type {
  BibleChapter,
  Church,
  DeviceSession,
  Display,
  Id,
  MediaAsset,
  MediaKind,
  Paginated,
  Person,
  PlanItemKind,
  RecordStatus,
  Schedule,
  ServicePlanItem,
  ServiceRecord,
  ServiceType,
  Song,
  SongSummary,
  UploadTicket,
  UserSession,
  YoutubeVideo,
} from "@/domain/models";
import type { SessionTokens } from "../session-token";

// Data contracts. `mock/` implements them in memory; `api/` against atm-iris-api.
// Screens never know which one is active (see ./index.ts). Both throw ApiError
// (./api/errors.ts) with the contract's codes.

/* -------------------------------------------------------------------- Auth */

export type SignInInput = { email: string; password: string };
export type SignUpInput = {
  churchName: string;
  fullName: string;
  email: string;
  password: string;
};
export type ResetPasswordInput = {
  email: string;
  code: string;
  password: string;
  passwordConfirmation: string;
};
export type ChangePasswordInput = {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
};

/** `tokens` only exists when auth goes through the API. */
export type AuthResult = { session: UserSession; tokens?: SessionTokens };

export interface AuthService {
  signIn(input: SignInInput): Promise<AuthResult>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  /** Trades a refresh token for a new pair. Throws ApiError when the session is over. */
  refresh(refreshToken: string): Promise<AuthResult>;
  /** Ends the current device's session (the bound access token). */
  signOut(): Promise<void>;
  /** Ends every session of the account, this one included. */
  signOutAll(): Promise<void>;
  /** Step 1 of 3. Never reveals whether the email has an account. */
  requestPasswordReset(email: string): Promise<void>;
  /** Step 2 of 3. */
  verifyResetCode(email: string, code: string): Promise<void>;
  /** Step 3 of 3. Closes every session of the account. */
  resetPassword(input: ResetPasswordInput): Promise<void>;
  getSession(): Promise<UserSession>;
  updateProfile(fullName: string): Promise<UserSession>;
  /** Closes the account's other sessions. */
  changePassword(input: ChangePasswordInput): Promise<void>;
  listSessions(): Promise<DeviceSession[]>;
  /** Revoking the current one equals signing out. */
  revokeSession(id: Id): Promise<void>;
}

/* ------------------------------------------------------------------ Church */

export interface ChurchRepository {
  get(): Promise<Church>;
  update(input: { name?: string; timezone?: string }): Promise<Church>;
  /** How the lyrics look on every console (contract §6). Throws VALIDATION_FAILED. */
  setProjection(input: Church["projection"]): Promise<Church>;
}

export interface PeopleRepository {
  /** By name, without deleted ones. */
  list(): Promise<Person[]>;
  /** Throws PERSON_NAME_TAKEN. */
  create(name: string): Promise<Person>;
  rename(id: Id, name: string): Promise<Person>;
  /** Records keep id + name; templates forget the suggested leader. */
  delete(id: Id): Promise<void>;
}

export type BlockTemplateInput = {
  id?: Id;
  name: string;
  plannedMinutes: number;
};

export type ServiceTypeInput = {
  name: string;
  schedule: Schedule | null;
  blocks: BlockTemplateInput[];
};

export interface ServiceTypeRepository {
  /** By name. */
  list(): Promise<ServiceType[]>;
  get(id: Id): Promise<ServiceType | null>;
  /** Throws SERVICE_TYPE_NAME_TAKEN. */
  create(input: ServiceTypeInput): Promise<ServiceType>;
  /** Full replacement (PUT). */
  update(id: Id, input: ServiceTypeInput): Promise<ServiceType>;
  /** Saved time records outlive the type. */
  delete(id: Id): Promise<void>;
}

/* ------------------------------------------------------------------- Songs */

/** Lyrics, a track or both; never neither (contract §10). */
export type SongInput = {
  title: string;
  author: string;
  /** Empty when the song is only a track. */
  sections: { label: string | null; text: string }[];
  /** An uploaded audio; replacing or clearing it deletes the previous one. */
  audioId: Id | null;
  /** Or the track on YouTube (never both). */
  youtubeId: string | null;
  /** Its background; omitted on an update, it stays as it was. Null clears it. */
  backgroundId?: Id | null;
};

export type SongSort = "title" | "-updatedAt";

export type SongListQuery = {
  search?: string;
  page?: number;
  limit?: number;
  sort?: SongSort;
  /** Only the archived songs; without it, the library's. */
  archived?: boolean;
};

export interface SongRepository {
  list(query?: SongListQuery): Promise<Paginated<SongSummary>>;
  get(id: Id): Promise<Song | null>;
  create(input: SongInput): Promise<Song>;
  update(id: Id, input: SongInput): Promise<Song>;
  delete(id: Id): Promise<void>;
  /** Out of the library; its uploaded track is deleted, the lyrics and a YouTube track stay. */
  archive(id: Id): Promise<Song>;
  /** Back in the library. An uploaded track that was deleted has to be uploaded again. */
  unarchive(id: Id): Promise<Song>;
}

/* ------------------------------------------------------------------- Media */

export type MediaListQuery = {
  /** One kind or several (`["image", "video"]`). */
  kind?: MediaKind | readonly MediaKind[];
  search?: string;
  isBackground?: boolean;
  /** `true`: only the console's sound effects; `false`: everything else. */
  isSound?: boolean;
  page?: number;
  limit?: number;
};

export type CreateUploadInput = {
  kind: MediaKind;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export type ConfirmUploadInput = {
  uploadId: Id;
  title: string;
  description?: string | null;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
  isBackground?: boolean;
  /** An audio saved as a sound effect, with the icon chosen for it. */
  soundIcon?: string | null;
};

export type MediaPatch = { title?: string; description?: string | null; isBackground?: boolean };

export interface MediaRepository {
  /** Most recent first. */
  list(query?: MediaListQuery): Promise<Paginated<MediaAsset>>;
  get(id: Id): Promise<MediaAsset | null>;
  /** Checks type, size and quota before anything travels. */
  createUpload(input: CreateUploadInput): Promise<UploadTicket>;
  /** Throws UPLOAD_NOT_FOUND when the file never reached the storage. */
  confirm(input: ConfirmUploadInput): Promise<MediaAsset>;
  update(id: Id, patch: MediaPatch): Promise<MediaAsset>;
  delete(id: Id): Promise<void>;
  /** Signed GET, valid for an hour. */
  downloadUrl(id: Id): Promise<{ url: string; expiresAt: string }>;
}

/* ----------------------------------------------------------------- YouTube */

export type YoutubeVideoInput = { videoId: string; title: string; author: string };

export interface YoutubeVideoRepository {
  /** Newest first. */
  list(): Promise<YoutubeVideo[]>;
  get(id: Id): Promise<YoutubeVideo | null>;
  /** The same video saved twice gives back the one already there. */
  create(input: YoutubeVideoInput): Promise<YoutubeVideo>;
  /** Also takes it out of the service plan. */
  delete(id: Id): Promise<void>;
}

/* -------------------------------------------------------------------- Plan */

export type CreateServicePlanItemInput = { kind: PlanItemKind; refId: Id };

export interface ServicePlanRepository {
  /** In order. */
  list(): Promise<ServicePlanItem[]>;
  /** Throws VALIDATION_FAILED (`errors.refId`) if the song/media/video doesn't exist. */
  add(input: CreateServicePlanItemInput): Promise<ServicePlanItem>;
  /** Reorders; the rest shift to make room. */
  move(id: Id, position: number): Promise<void>;
  remove(id: Id): Promise<void>;
  clear(): Promise<void>;
}

/* ------------------------------------------------------------------- Bible */

/** The Bible's text (contract §13): the same for every church. */
export interface BibleRepository {
  /** Null when the translation, book or chapter does not exist. */
  chapter(code: string, bookId: string, chapter: number): Promise<BibleChapter | null>;
}

/* ---------------------------------------------------------------- Displays */

/**
 * What the console sends its TVs (contract §18). The API passes the frame and the files
 * along without reading them; `clock` is the console's `Date.now()` when sending.
 */
export type DisplayState = {
  frame?: object;
  preload?: object[];
  clock: number;
  /** The screen that presents: only it receives this; the rest do nothing. Without it, all. */
  displayId?: Id;
};

export interface DisplayRepository {
  list(): Promise<Display[]>;
  /** Links the TV showing `code`. Throws VALIDATION_FAILED (`errors.code`) for an unknown or expired one. */
  claim(code: string, name: string): Promise<Display>;
  remove(id: Id): Promise<void>;
  publish(state: DisplayState): Promise<void>;
}

export type DisplayPairing = { id: string; code: string; secret: string; expiresAt: string };
export type PairingStatus =
  | { status: "pending" }
  | { status: "paired"; token: string; display: { id: string; name: string } };

/**
 * The TV's side, without a session: it asks for a code, learns when it is linked, and opens
 * its live channel with the token it got.
 */
export interface DisplayLink {
  startPairing(): Promise<DisplayPairing>;
  /** Null when the code expired or was already collected. */
  pairingStatus(id: string, secret: string): Promise<PairingStatus | null>;
  /** The SSE response, or `"unlinked"` when the token is no longer valid. */
  stream(token: string, signal: AbortSignal): Promise<Response | "unlinked">;
}

/* ------------------------------------------------------------ Time records */

export type RecordListQuery = {
  /** UTC instants over `date`: inclusive / exclusive. */
  from?: string;
  to?: string;
  serviceTypeId?: Id;
  status?: RecordStatus;
  page?: number;
  limit?: number;
};

/** Body of `PUT /service-records/:id` (contract §14): sent on every change while the service runs. */
export type ServiceRecordInput = {
  status: RecordStatus;
  /** Start of the first block, UTC. */
  date: string;
  serviceTypeId: Id;
  serviceTypeName: string;
  blocks: {
    id: Id;
    name: string;
    plannedSeconds: number;
    actualSeconds: number;
    personId: Id | null;
    personName: string | null;
    status: "pending" | "running" | "completed" | "skipped";
    startedAt: string | null;
    endedAt: string | null;
  }[];
};

export interface TimeRecordRepository {
  /** Most recent first. `limit` up to 500. */
  list(query?: RecordListQuery): Promise<Paginated<ServiceRecord>>;
  get(id: Id): Promise<ServiceRecord | null>;
  /** Creates or replaces (idempotent by id). A finished record cannot go back to in progress. */
  save(id: Id, input: ServiceRecordInput): Promise<ServiceRecord>;
  /** `actualSeconds` marks the block adjusted; `personId` also refreshes `personName`. */
  adjustBlock(
    recordId: Id,
    blockId: Id,
    patch: { actualSeconds?: number; personId?: Id | null },
  ): Promise<ServiceRecord>;
  delete(id: Id): Promise<void>;
}

/** A church's songs (lyrics and links, not files) and YouTube videos, to move to another account. */
export type BackupFile = {
  format: "iris-backup";
  version: 1;
  exportedAt?: string;
  songs: {
    title: string;
    author: string;
    sections: { label: string | null; text: string }[];
    youtubeId: string | null;
  }[];
  youtubeVideos: { videoId: string; title: string; author: string }[];
};

export type ImportResult = {
  songs: number;
  youtubeVideos: number;
  /** Already there (same title and author, or the same video). */
  skipped: number;
  /** Only an uploaded track: without files there is nothing to bring. */
  withoutLyrics: number;
};

export type EraseInput = { songs: boolean; media: boolean; youtube: boolean };
export type EraseResult = { songs: number; media: number; youtube: number };

export interface BackupRepository {
  export(): Promise<BackupFile>;
  import(file: BackupFile): Promise<ImportResult>;
  /** Deletes everything chosen at once (songs with their tracks, images, videos and backgrounds, YouTube links). */
  erase(input: EraseInput): Promise<EraseResult>;
}

export type DataRepositories = {
  church: ChurchRepository;
  people: PeopleRepository;
  serviceTypes: ServiceTypeRepository;
  songs: SongRepository;
  media: MediaRepository;
  youtubeVideos: YoutubeVideoRepository;
  backup: BackupRepository;
  servicePlan: ServicePlanRepository;
  records: TimeRecordRepository;
  displays: DisplayRepository;
  bible: BibleRepository;
};

export type AppPlatform = "ios" | "windows";

/** Versions of the desktop and iPad apps published for download (contract §17). */
export interface ReleaseRepository {
  /** The version published today, or `null` when it cannot be known (the page still works). */
  latestVersion(platform: AppPlatform): Promise<string | null>;
}

export type Repositories = DataRepositories & { auth: AuthService; releases: ReleaseRepository };
