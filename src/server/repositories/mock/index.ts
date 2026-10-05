import type { Id, ServiceType, Song } from "@/domain/models";
import {
  AuthError,
  type AuthService,
  type ModuleSettingsRepository,
  type PeopleRepository,
  type Repositories,
  type ServiceTypeRepository,
  type SongInput,
  type SongRepository,
  type TimeRecordRepository,
} from "../types";
import { createSeed, type ChurchData } from "./seed";

// In-memory implementations. All repositories share one store so a change on one
// screen shows up on the others. Data resets when the server restarts.

const LATENCY_MS = process.env.NODE_ENV === "test" ? 0 : 250;
const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
const clone = <T>(value: T): T => structuredClone(value);

// Survives dev hot reloads (module re-evaluation) without leaking into other requests' types.
const globalStore = globalThis as typeof globalThis & { __irisMockStore?: ChurchData };
export function mockStore(): ChurchData {
  globalStore.__irisMockStore ??= createSeed();
  return globalStore.__irisMockStore;
}

export function resetMockStore(data: ChurchData = createSeed()): void {
  globalStore.__irisMockStore = data;
}

/** In mock mode every recovery code is this one, and it is printed in the server log. */
export const MOCK_RESET_CODE = "123456";

const mockSession = (email: string) => ({
  session: {
    userId: "mock-user",
    churchName: "Iglesia Vida Nueva",
    leaderName: "Daniel Ruiz",
    email: email || "pastor@vidanueva.org",
  },
});

export const mockAuth: AuthService = {
  async signIn({ email }) {
    await delay();
    // Any email works (like the iPad app). "error@…" simulates bad credentials.
    if (email.startsWith("error@")) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        "El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.",
      );
    }
    return mockSession(email);
  },
  async signUp({ churchName, leaderName, email }) {
    await delay();
    if (email.startsWith("existe@")) {
      throw new AuthError(
        "EMAIL_TAKEN",
        "Ya existe una cuenta con ese correo. Intenta iniciar sesión.",
        {
          email: "Ya existe una cuenta con ese correo.",
        },
      );
    }
    return { session: { userId: crypto.randomUUID(), churchName, leaderName, email } };
  },
  async refresh() {
    // Mock sessions carry no tokens, so there is never anything to refresh.
    throw new AuthError("INVALID_REFRESH_TOKEN", "Tu sesión expiró. Vuelve a iniciar sesión.");
  },
  async signOut() {
    await delay();
  },
  async requestPasswordReset(email) {
    await delay();
    console.info(`[auth mock] Código de recuperación para ${email}: ${MOCK_RESET_CODE}`);
  },
  async verifyResetCode(_email, code) {
    await delay();
    if (code !== MOCK_RESET_CODE) {
      throw new AuthError(
        "RESET_CODE_INVALID",
        "El código no es válido o ya venció. Solicita uno nuevo.",
      );
    }
  },
  async resetPassword({ code }) {
    await delay();
    if (code !== MOCK_RESET_CODE) {
      throw new AuthError(
        "RESET_CODE_INVALID",
        "El código no es válido o ya venció. Solicita uno nuevo.",
      );
    }
  },
};

function toSong(input: SongInput, id: Id = crypto.randomUUID()): Song {
  return {
    id,
    title: input.title,
    author: input.author,
    sections: input.sections.map((section) => ({ id: crypto.randomUUID(), ...section })),
    updatedAt: new Date().toISOString(),
  };
}

const songs: SongRepository = {
  async list() {
    await delay();
    return clone(mockStore().songs);
  },
  async get(id) {
    await delay();
    return clone(mockStore().songs.find((song) => song.id === id) ?? null);
  },
  async create(input) {
    await delay();
    const song = toSong(input);
    mockStore().songs.push(song);
    return clone(song);
  },
  async createMany(inputs) {
    await delay();
    const created = inputs.map((input) => toSong(input));
    mockStore().songs.push(...created);
    return clone(created);
  },
  async update(id, input) {
    await delay();
    const store = mockStore();
    const index = store.songs.findIndex((song) => song.id === id);
    if (index === -1) throw new Error(`Song ${id} not found`);
    store.songs[index] = toSong(input, id);
    return clone(store.songs[index]);
  },
  async delete(id) {
    await delay();
    const store = mockStore();
    store.songs = store.songs.filter((song) => song.id !== id);
  },
};

const modules: ModuleSettingsRepository = {
  async get() {
    await delay();
    return clone(mockStore().modules);
  },
  async save(value) {
    await delay();
    mockStore().modules = clone(value);
  },
};

const serviceTypes: ServiceTypeRepository = {
  async list() {
    await delay();
    return clone(mockStore().serviceTypes);
  },
  async get(id) {
    await delay();
    return clone(mockStore().serviceTypes.find((type) => type.id === id) ?? null);
  },
  async save(type: ServiceType) {
    await delay();
    const store = mockStore();
    const index = store.serviceTypes.findIndex((existing) => existing.id === type.id);
    if (index === -1) store.serviceTypes.push(clone(type));
    else store.serviceTypes[index] = clone(type);
  },
  async delete(id) {
    await delay();
    const store = mockStore();
    store.serviceTypes = store.serviceTypes.filter((type) => type.id !== id);
  },
};

const people: PeopleRepository = {
  async list() {
    await delay();
    return clone(mockStore().people);
  },
  async add(name) {
    await delay();
    const person = { id: crypto.randomUUID(), name };
    mockStore().people.push(person);
    return clone(person);
  },
  async rename(id, name) {
    await delay();
    const person = mockStore().people.find((p) => p.id === id);
    if (person) person.name = name;
  },
  async delete(id) {
    await delay();
    const store = mockStore();
    store.people = store.people.filter((person) => person.id !== id);
    for (const type of store.serviceTypes) {
      for (const block of type.blocks) {
        if (block.defaultPersonId === id) block.defaultPersonId = null;
      }
    }
  },
};

const records: TimeRecordRepository = {
  async list() {
    await delay();
    return clone(mockStore().records).sort((a, b) => b.date.localeCompare(a.date));
  },
};

export const mockDataRepositories: Omit<Repositories, "auth"> = {
  songs,
  modules,
  serviceTypes,
  people,
  records,
};
