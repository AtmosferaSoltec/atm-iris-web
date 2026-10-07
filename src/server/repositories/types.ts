import type {
  Church,
  ChurchModules,
  DeviceSession,
  Id,
  MediaAsset,
  MediaKind,
  Paginated,
  Person,
  Schedule,
  ServiceRecord,
  ServiceType,
  Song,
  SongSummary,
  UploadTicket,
  UserSession,
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
  setModules(modules: ChurchModules): Promise<Church>;
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
  defaultPersonId: Id | null;
};

export type ServiceTypeInput = {
  name: string;
  color: string;
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

export type SongInput = {
  title: string;
  author: string;
  sections: { label: string | null; text: string }[];
};

export type SongSort = "title" | "-updatedAt";

export type SongListQuery = { search?: string; page?: number; limit?: number; sort?: SongSort };

export interface SongRepository {
  list(query?: SongListQuery): Promise<Paginated<SongSummary>>;
  get(id: Id): Promise<Song | null>;
  create(input: SongInput): Promise<Song>;
  update(id: Id, input: SongInput): Promise<Song>;
  delete(id: Id): Promise<void>;
}

/* ------------------------------------------------------------------- Media */

export type MediaListQuery = {
  kind?: MediaKind;
  search?: string;
  isBackground?: boolean;
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

/* ------------------------------------------------------------ Time records */

export type RecordListQuery = {
  /** UTC instants over `date`: inclusive / exclusive. */
  from?: string;
  to?: string;
  serviceTypeId?: Id;
  page?: number;
  limit?: number;
};

export interface TimeRecordRepository {
  /** Most recent first. `limit` up to 500. */
  list(query?: RecordListQuery): Promise<Paginated<ServiceRecord>>;
  get(id: Id): Promise<ServiceRecord | null>;
  /** `actualSeconds` marks the block adjusted; `personId` also refreshes `personName`. */
  adjustBlock(
    recordId: Id,
    blockId: Id,
    patch: { actualSeconds?: number; personId?: Id | null },
  ): Promise<ServiceRecord>;
  delete(id: Id): Promise<void>;
}

export type DataRepositories = {
  church: ChurchRepository;
  people: PeopleRepository;
  serviceTypes: ServiceTypeRepository;
  songs: SongRepository;
  media: MediaRepository;
  records: TimeRecordRepository;
};

export type Repositories = DataRepositories & { auth: AuthService };
