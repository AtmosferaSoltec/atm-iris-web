import type {
  ChurchModules,
  Id,
  Person,
  ServiceRecord,
  ServiceType,
  Song,
  SongSection,
  UserSession,
} from "@/domain/models";
import type { SessionTokens } from "../session-token";

// Data contracts. `mock/` implements them in memory; `api/` against atm-iris-api.
// Screens never know which one is active (see ./index.ts).

export type SignInInput = { email: string; password: string };
export type SignUpInput = {
  churchName: string;
  leaderName: string;
  email: string;
  password: string;
};
export type ResetPasswordInput = {
  email: string;
  code: string;
  password: string;
  passwordConfirmation: string;
};

/** `tokens` only exists when auth goes through the API. */
export type AuthResult = { session: UserSession; tokens?: SessionTokens };

/**
 * An error the UI can show as is. `message` is already in Spanish (the API's
 * contract), and `fieldErrors` use the web form's field names.
 */
export class AuthError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export interface AuthService {
  signIn(input: SignInInput): Promise<AuthResult>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  /** Trades a refresh token for a new pair. Throws AuthError when the session is over. */
  refresh(refreshToken: string): Promise<AuthResult>;
  /** Ends the current device's session (the bound access token). */
  signOut(): Promise<void>;
  /** Step 1 of 3. Never reveals whether the email has an account. */
  requestPasswordReset(email: string): Promise<void>;
  /** Step 2 of 3. */
  verifyResetCode(email: string, code: string): Promise<void>;
  /** Step 3 of 3. Closes every session of the account. */
  resetPassword(input: ResetPasswordInput): Promise<void>;
}

export type SongInput = {
  title: string;
  author: string;
  sections: Omit<SongSection, "id">[];
};

export interface SongRepository {
  list(): Promise<Song[]>;
  get(id: Id): Promise<Song | null>;
  create(input: SongInput): Promise<Song>;
  createMany(inputs: SongInput[]): Promise<Song[]>;
  update(id: Id, input: SongInput): Promise<Song>;
  delete(id: Id): Promise<void>;
}

export interface ModuleSettingsRepository {
  get(): Promise<ChurchModules>;
  save(modules: ChurchModules): Promise<void>;
}

export interface ServiceTypeRepository {
  list(): Promise<ServiceType[]>;
  get(id: Id): Promise<ServiceType | null>;
  /** Inserts or replaces by id. */
  save(type: ServiceType): Promise<void>;
  /** Saved time records outlive the type. */
  delete(id: Id): Promise<void>;
}

export interface PeopleRepository {
  list(): Promise<Person[]>;
  add(name: string): Promise<Person>;
  rename(id: Id, name: string): Promise<void>;
  /** Records keep id + name; templates forget the suggested leader. */
  delete(id: Id): Promise<void>;
}

export interface TimeRecordRepository {
  /** Most recent first. */
  list(): Promise<ServiceRecord[]>;
}

export type Repositories = {
  auth: AuthService;
  songs: SongRepository;
  modules: ModuleSettingsRepository;
  serviceTypes: ServiceTypeRepository;
  people: PeopleRepository;
  records: TimeRecordRepository;
};
