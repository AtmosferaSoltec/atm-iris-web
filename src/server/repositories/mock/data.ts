import {
  backgroundProblem,
  MEDIA_ERRORS,
  MEDIA_RULES,
  tooLargeMessage,
} from "@/domain/media-rules";
import {
  effectiveModules,
  type Church,
  type Id,
  type MediaAsset,
  type Paginated,
  type Person,
  type ServiceRecord,
  type ServiceType,
  type Song,
  type SongSummary,
  type UserSession,
} from "@/domain/models";
import { firstLine } from "@/lib/lyrics";
import { compareNames, nameKey } from "@/lib/text";
import { ApiError } from "../api/errors";
import type {
  ChurchRepository,
  DataRepositories,
  MediaRepository,
  PeopleRepository,
  ServiceTypeInput,
  ServiceTypeRepository,
  SongInput,
  SongRepository,
  TimeRecordRepository,
} from "../types";
import {
  churchOf,
  clone,
  delay,
  mockWorld,
  notFound,
  now,
  type ChurchData,
  type MockMedia,
} from "./world";

/* ---------------------------------------------------------------- Helpers */

export function paginate<T>(items: T[], page = 1, limit = 20, maxLimit = 100): Paginated<T> {
  const safeLimit = Math.min(Math.max(1, limit), maxLimit);
  const totalPages = Math.max(1, Math.ceil(items.length / safeLimit));
  const safePage = Math.max(1, page);
  return {
    data: clone(items.slice((safePage - 1) * safeLimit, safePage * safeLimit)),
    meta: { page: safePage, limit: safeLimit, total: items.length, totalPages },
  };
}

/** Blocks each person led in the records, skipped ones excluded (contract §8 `blockCount`). */
function blockCounts(records: ServiceRecord[]): Map<Id, number> {
  const counts = new Map<Id, number>();
  for (const record of records) {
    for (const block of record.blocks) {
      if (block.status === "skipped" || !block.personId) continue;
      counts.set(block.personId, (counts.get(block.personId) ?? 0) + 1);
    }
  }
  return counts;
}

/* ------------------------------------------------------------------ Church */

function church(session?: UserSession): ChurchRepository {
  // Stored: the church's own choice. Returned: what it sees, like the API (contract §6).
  const view = (stored: Church): Church =>
    clone({ ...stored, modules: effectiveModules(stored.modules, stored.availableModules) });

  return {
    async get() {
      await delay();
      return view(churchOf(session).church);
    },
    async update(input) {
      await delay();
      const data = churchOf(session);
      Object.assign(data.church, input, { updatedAt: now() });
      return view(data.church);
    },
    async setModules(modules) {
      await delay();
      const data = churchOf(session);
      const { availableModules: available, modules: stored } = data.church;
      // A module switched off for all of Iris keeps the choice it had.
      data.church.modules = {
        bible: available.bible ? modules.bible : stored.bible,
        multimedia: available.multimedia ? modules.multimedia : stored.multimedia,
        timeControl: available.timeControl ? modules.timeControl : stored.timeControl,
      };
      data.church.updatedAt = now();
      return view(data.church);
    },
  };
}

/* ------------------------------------------------------------------ People */

const personNameTaken = () =>
  new ApiError(409, "PERSON_NAME_TAKEN", "Ya existe una persona con ese nombre.", {
    name: "Ya existe una persona con ese nombre.",
  });

function checkPersonName(data: ChurchData, name: string, exceptId?: Id) {
  const key = nameKey(name);
  if (data.people.some((person) => person.id !== exceptId && nameKey(person.name) === key)) {
    throw personNameTaken();
  }
}

function people(session?: UserSession): PeopleRepository {
  const withCount = (data: ChurchData, person: Person): Person => ({
    ...clone(person),
    blockCount: blockCounts(data.records).get(person.id) ?? 0,
  });

  return {
    async list() {
      await delay();
      const data = churchOf(session);
      return data.people
        .map((person) => withCount(data, person))
        .sort((a, b) => compareNames(a.name, b.name));
    },
    async create(name) {
      await delay();
      const data = churchOf(session);
      checkPersonName(data, name);
      const person: Person = {
        id: crypto.randomUUID(),
        name,
        blockCount: 0,
        createdAt: now(),
        updatedAt: now(),
      };
      data.people.push(person);
      return withCount(data, person);
    },
    async rename(id, name) {
      await delay();
      const data = churchOf(session);
      const person = data.people.find((candidate) => candidate.id === id);
      if (!person) throw notFound();
      checkPersonName(data, name, id);
      person.name = name;
      person.updatedAt = now();
      return withCount(data, person);
    },
    async delete(id) {
      await delay();
      const data = churchOf(session);
      if (!data.people.some((person) => person.id === id)) throw notFound();
      data.people = data.people.filter((person) => person.id !== id);
    },
  };
}

/* ----------------------------------------------------------- Service types */

function serviceTypes(session?: UserSession): ServiceTypeRepository {
  function build(data: ChurchData, input: ServiceTypeInput, existing?: ServiceType): ServiceType {
    const key = nameKey(input.name);
    if (data.serviceTypes.some((type) => type.id !== existing?.id && nameKey(type.name) === key)) {
      throw new ApiError(409, "SERVICE_TYPE_NAME_TAKEN", "Ya existe un servicio con ese nombre.", {
        name: "Ya existe un servicio con ese nombre.",
      });
    }
    return {
      id: existing?.id ?? crypto.randomUUID(),
      name: input.name,
      color: input.color,
      schedule: input.schedule ? { ...input.schedule } : null,
      // Blocks without id get a new one; those with id keep it (contract §9).
      blocks: input.blocks.map((block) => ({
        id: block.id ?? crypto.randomUUID(),
        name: block.name,
        plannedMinutes: block.plannedMinutes,
      })),
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    };
  }

  return {
    async list() {
      await delay();
      return clone(churchOf(session).serviceTypes).sort((a, b) => compareNames(a.name, b.name));
    },
    async get(id) {
      await delay();
      return clone(churchOf(session).serviceTypes.find((type) => type.id === id) ?? null);
    },
    async create(input) {
      await delay();
      const data = churchOf(session);
      const type = build(data, input);
      data.serviceTypes.push(type);
      return clone(type);
    },
    async update(id, input) {
      await delay();
      const data = churchOf(session);
      const index = data.serviceTypes.findIndex((type) => type.id === id);
      const type = build(
        data,
        input,
        data.serviceTypes[index] ?? ({ id, createdAt: now() } as ServiceType),
      );
      if (index === -1) data.serviceTypes.push(type);
      else data.serviceTypes[index] = type;
      return clone(type);
    },
    async delete(id) {
      await delay();
      const data = churchOf(session);
      if (!data.serviceTypes.some((type) => type.id === id)) throw notFound();
      data.serviceTypes = data.serviceTypes.filter((type) => type.id !== id);
    },
  };
}

/* ------------------------------------------------------------------- Songs */

function toSummary(song: Song): SongSummary {
  return {
    id: song.id,
    title: song.title,
    author: song.author,
    sectionCount: song.sections.length,
    firstLine: firstLine(song.sections),
    updatedAt: song.updatedAt,
  };
}

/** Relevance like the API's: title, then author, then lyrics. 0 = no match. */
function relevance(song: Song, key: string): number {
  if (nameKey(song.title).includes(key)) return 3;
  if (nameKey(song.author).includes(key)) return 2;
  if (song.sections.some((section) => nameKey(section.text).includes(key))) return 1;
  return 0;
}

function songs(session?: UserSession): SongRepository {
  function toSong(input: SongInput, existing?: Song): Song {
    return {
      id: existing?.id ?? crypto.randomUUID(),
      title: input.title,
      author: input.author,
      sections: input.sections.map((section) => ({ id: crypto.randomUUID(), ...section })),
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    };
  }

  return {
    async list({ search, page, limit, sort } = {}) {
      await delay();
      const all = churchOf(session).songs;
      const key = nameKey(search ?? "");
      if (key) {
        const ranked = all
          .map((song) => ({ song, score: relevance(song, key) }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score || compareNames(a.song.title, b.song.title))
          .map(({ song }) => toSummary(song));
        return paginate(ranked, page, limit);
      }
      const sorted = [...all].sort((a, b) =>
        sort === "-updatedAt"
          ? b.updatedAt.localeCompare(a.updatedAt)
          : compareNames(a.title, b.title),
      );
      return paginate(sorted.map(toSummary), page, limit);
    },
    async get(id) {
      await delay();
      return clone(churchOf(session).songs.find((song) => song.id === id) ?? null);
    },
    async create(input) {
      await delay();
      const song = toSong(input);
      churchOf(session).songs.push(song);
      return clone(song);
    },
    async update(id, input) {
      await delay();
      const data = churchOf(session);
      const index = data.songs.findIndex((song) => song.id === id);
      const song = toSong(input, data.songs[index] ?? ({ id, createdAt: now() } as Song));
      if (index === -1) data.songs.push(song);
      else data.songs[index] = song;
      return clone(song);
    },
    async delete(id) {
      await delay();
      const data = churchOf(session);
      if (!data.songs.some((song) => song.id === id)) throw notFound();
      data.songs = data.songs.filter((song) => song.id !== id);
    },
  };
}

/* ------------------------------------------------------------------- Media */

const UPLOAD_TTL_MS = 60 * 60 * 1000;

/** Signed-URL stand-in served by src/app/api/mock-storage/[key]/route.ts. */
export const mockStorageUrl = (key: string) => `/api/mock-storage/${key}`;

function media(session?: UserSession): MediaRepository {
  const toAsset = ({ storageKey: _storageKey, ...asset }: MockMedia): MediaAsset => clone(asset);

  return {
    async list({ kind, search, isBackground, page, limit } = {}) {
      await delay();
      const key = nameKey(search ?? "");
      const items = churchOf(session)
        .media.filter(
          (asset) =>
            (!kind || asset.kind === kind) &&
            (isBackground === undefined || asset.isBackground === isBackground) &&
            (!key || nameKey(`${asset.title} ${asset.description ?? ""}`).includes(key)),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(toAsset);
      return paginate(items, page, limit);
    },
    async get(id) {
      await delay();
      const asset = churchOf(session).media.find((candidate) => candidate.id === id);
      return asset ? toAsset(asset) : null;
    },
    async createUpload({ kind, fileName, contentType, sizeBytes }) {
      await delay();
      const data = churchOf(session);
      const rules = MEDIA_RULES[kind];
      if (!rules.contentTypes.includes(contentType)) {
        throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", MEDIA_ERRORS.UNSUPPORTED_MEDIA_TYPE);
      }
      if (sizeBytes > rules.maxBytes) {
        throw new ApiError(413, "FILE_TOO_LARGE", tooLargeMessage(kind));
      }
      const pending = data.uploads
        .filter((upload) => new Date(upload.expiresAt).getTime() > Date.now())
        .reduce((total, upload) => total + upload.sizeBytes, 0);
      if (data.church.storage.usedBytes + pending + sizeBytes > data.church.storage.quotaBytes) {
        throw new ApiError(413, "STORAGE_QUOTA_EXCEEDED", MEDIA_ERRORS.STORAGE_QUOTA_EXCEEDED);
      }
      const upload = {
        id: crypto.randomUUID(),
        kind,
        fileName,
        contentType,
        sizeBytes,
        expiresAt: new Date(Date.now() + UPLOAD_TTL_MS).toISOString(),
      };
      data.uploads.push(upload);
      return {
        uploadId: upload.id,
        uploadUrl: mockStorageUrl(upload.id),
        headers: { "Content-Type": contentType },
        expiresAt: upload.expiresAt,
      };
    },
    async confirm(input) {
      await delay();
      const data = churchOf(session);
      const upload = data.uploads.find((candidate) => candidate.id === input.uploadId);
      const file = mockWorld().files.get(input.uploadId);
      if (!upload || !file || file.bytes.byteLength !== upload.sizeBytes) {
        throw new ApiError(400, "UPLOAD_NOT_FOUND", MEDIA_ERRORS.UPLOAD_NOT_FOUND);
      }
      if (input.isBackground) {
        const problem = backgroundProblem({
          kind: upload.kind,
          contentType: upload.contentType,
          sizeBytes: upload.sizeBytes,
          width: input.width ?? null,
          height: input.height ?? null,
          durationSeconds: input.durationSeconds ?? null,
        });
        if (problem) throw new ApiError(400, "VALIDATION_FAILED", problem);
      }
      const asset: MockMedia = {
        id: crypto.randomUUID(),
        kind: upload.kind,
        title: input.title,
        description: input.description ?? null,
        fileName: upload.fileName,
        contentType: upload.contentType,
        sizeBytes: upload.sizeBytes,
        durationSeconds: upload.kind === "image" ? null : (input.durationSeconds ?? null),
        width: upload.kind === "audio" ? null : (input.width ?? null),
        height: upload.kind === "audio" ? null : (input.height ?? null),
        isBackground: Boolean(input.isBackground),
        createdAt: now(),
        updatedAt: now(),
        storageKey: upload.id,
      };
      data.uploads = data.uploads.filter((candidate) => candidate.id !== upload.id);
      data.media.push(asset);
      data.church.storage.usedBytes += asset.sizeBytes;
      return toAsset(asset);
    },
    async update(id, patch) {
      await delay();
      const asset = churchOf(session).media.find((candidate) => candidate.id === id);
      if (!asset) throw notFound();
      if (patch.title !== undefined) asset.title = patch.title;
      if (patch.description !== undefined) asset.description = patch.description;
      if (patch.isBackground) {
        const problem = backgroundProblem(asset);
        if (problem) throw new ApiError(400, "VALIDATION_FAILED", problem);
      }
      if (patch.isBackground !== undefined) asset.isBackground = patch.isBackground;
      asset.updatedAt = now();
      return toAsset(asset);
    },
    async delete(id) {
      await delay();
      const data = churchOf(session);
      const asset = data.media.find((candidate) => candidate.id === id);
      if (!asset) throw notFound();
      data.media = data.media.filter((candidate) => candidate.id !== id);
      data.church.storage.usedBytes = Math.max(0, data.church.storage.usedBytes - asset.sizeBytes);
      mockWorld().files.delete(asset.storageKey);
    },
    async downloadUrl(id) {
      await delay();
      const asset = churchOf(session).media.find((candidate) => candidate.id === id);
      if (!asset) throw notFound();
      return {
        url: mockStorageUrl(asset.storageKey),
        expiresAt: new Date(Date.now() + UPLOAD_TTL_MS).toISOString(),
      };
    },
  };
}

/* ------------------------------------------------------------ Time records */

function records(session?: UserSession): TimeRecordRepository {
  return {
    async list({ from, to, serviceTypeId, page, limit } = {}) {
      await delay();
      const items = churchOf(session)
        .records.filter(
          (record) =>
            (!from || record.date >= from) &&
            (!to || record.date < to) &&
            (!serviceTypeId || record.serviceTypeId === serviceTypeId),
        )
        .sort((a, b) => b.date.localeCompare(a.date));
      return paginate(items, page, limit, 500);
    },
    async get(id) {
      await delay();
      return clone(churchOf(session).records.find((record) => record.id === id) ?? null);
    },
    async adjustBlock(recordId, blockId, patch) {
      await delay();
      const data = churchOf(session);
      const record = data.records.find((candidate) => candidate.id === recordId);
      const block = record?.blocks.find((candidate) => candidate.id === blockId);
      if (!record || !block) throw notFound();
      if (patch.actualSeconds !== undefined) {
        block.actualSeconds = patch.actualSeconds;
        block.status = "adjusted";
      }
      if (patch.personId !== undefined) {
        const person = data.people.find((candidate) => candidate.id === patch.personId);
        if (patch.personId && !person) throw notFound();
        block.personId = patch.personId;
        block.personName = person?.name ?? null;
      }
      record.updatedAt = now();
      return clone(record);
    },
    async delete(id) {
      await delay();
      const data = churchOf(session);
      if (!data.records.some((record) => record.id === id)) throw notFound();
      data.records = data.records.filter((record) => record.id !== id);
    },
  };
}

export function mockDataRepositories(session?: UserSession): DataRepositories {
  return {
    church: church(session),
    people: people(session),
    serviceTypes: serviceTypes(session),
    songs: songs(session),
    media: media(session),
    records: records(session),
  };
}
