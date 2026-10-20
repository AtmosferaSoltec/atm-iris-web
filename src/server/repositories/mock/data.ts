import {
  backgroundProblem,
  MEDIA_ERRORS,
  MEDIA_RULES,
  mediaSection,
  tooLargeMessage,
} from "@/domain/media-rules";
import {
  type Church,
  type Id,
  type MediaAsset,
  type Paginated,
  type Person,
  type ServicePlanItem,
  type ServiceRecord,
  type ServiceType,
  type Song,
  type SongSummary,
  type StorageUsage,
  type UserSession,
  type YoutubeVideo,
} from "@/domain/models";
import { firstLine } from "@/lib/lyrics";
import { compareNames, nameKey } from "@/lib/text";
import { ApiError } from "../api/errors";
import type {
  ChurchRepository,
  CreateServicePlanItemInput,
  DataRepositories,
  MediaRepository,
  PeopleRepository,
  ServicePlanRepository,
  ServiceTypeInput,
  ServiceTypeRepository,
  SongInput,
  SongRepository,
  BackupRepository,
  TimeRecordRepository,
  YoutubeVideoRepository,
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
  type MockSong,
} from "./world";
import { mockDisplays } from "./displays";
import { PROJECTION_FONT_KEYS, PROJECTION_FONT_SIZE } from "@/domain/projection-fonts";
import { mockBible, mockPassageExists } from "./bible";
import { parsePassageId } from "@/lib/bible-reference";

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

/** What the church's media takes, by section (contract §6); only the quota is stored. */
function storageOf(data: ChurchData): StorageUsage {
  const breakdown = { musicBytes: 0, backgroundBytes: 0, mediaBytes: 0 };
  for (const asset of data.media) {
    const section = mediaSection(asset);
    if (section === "music") breakdown.musicBytes += asset.sizeBytes;
    else if (section === "backgrounds") breakdown.backgroundBytes += asset.sizeBytes;
    else breakdown.mediaBytes += asset.sizeBytes;
  }
  return {
    usedBytes: breakdown.musicBytes + breakdown.backgroundBytes + breakdown.mediaBytes,
    quotaBytes: data.church.storage.quotaBytes,
    breakdown,
  };
}

/* ------------------------------------------------------------------ Church */

function church(session?: UserSession): ChurchRepository {
  const view = (data: ChurchData): Church => clone({ ...data.church, storage: storageOf(data) });

  return {
    async get() {
      await delay();
      return view(churchOf(session));
    },
    async update(input) {
      await delay();
      const data = churchOf(session);
      Object.assign(data.church, input, { updatedAt: now() });
      return view(data);
    },
    async setProjection(input) {
      await delay();
      const keys: readonly string[] = PROJECTION_FONT_KEYS;
      if (!keys.includes(input.fontFamily)) {
        throw new ApiError(400, "VALIDATION_FAILED", "Revisa los datos enviados.", {
          fontFamily: "Esa tipografía no existe.",
        });
      }
      if (
        input.fontSizePt < PROJECTION_FONT_SIZE.min ||
        input.fontSizePt > PROJECTION_FONT_SIZE.max
      ) {
        throw new ApiError(400, "VALIDATION_FAILED", "Revisa los datos enviados.", {
          fontSizePt: `El tamaño va de ${PROJECTION_FONT_SIZE.min} a ${PROJECTION_FONT_SIZE.max}.`,
        });
      }
      const data = churchOf(session);
      data.church.projection = { ...input, defaultBackgroundId: input.defaultBackgroundId || null };
      data.church.updatedAt = now();
      return view(data);
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

/** The stored song with its track resolved, as the API returns it. */
function resolveSong(data: ChurchData, song: MockSong): Song {
  const { audioId, ...rest } = song;
  const audio = audioId ? data.media.find((asset) => asset.id === audioId) : undefined;
  return clone({ ...rest, audio: audio ? toMediaAsset(audio) : null });
}

function toSummary(song: Song): SongSummary {
  return {
    id: song.id,
    title: song.title,
    author: song.author,
    sectionCount: song.sections.length,
    firstLine: firstLine(song.sections),
    audio: song.audio,
    youtubeId: song.youtubeId,
    backgroundId: song.backgroundId,
    archivedAt: song.archivedAt,
    lastUsedAt: song.lastUsedAt,
    updatedAt: song.updatedAt,
  };
}

/** Relevance like the API's: title, then author, then lyrics. 0 = no match. */
function relevance(song: MockSong, key: string): number {
  if (nameKey(song.title).includes(key)) return 3;
  if (nameKey(song.author).includes(key)) return 2;
  if (song.sections.some((section) => nameKey(section.text).includes(key))) return 1;
  return 0;
}

const songFieldError = (field: "sections" | "audioId" | "youtubeId", message: string) =>
  new ApiError(400, "VALIDATION_FAILED", "Revisa los datos enviados.", { [field]: message });

/**
 * Same rules as the API: lyrics or a track; the track is an upload or a YouTube video, not
 * both; an upload belongs to one song only.
 */
function assertSongInput(data: ChurchData, input: SongInput, songId: Id | null) {
  if (input.youtubeId !== null && !/^[\w-]{11}$/.test(input.youtubeId)) {
    throw songFieldError("youtubeId", "Ese no es un video de YouTube.");
  }
  if (input.audioId && input.youtubeId) {
    throw songFieldError("youtubeId", "La pista es un audio o un video de YouTube, no los dos.");
  }
  if (input.sections.length === 0 && !input.audioId && !input.youtubeId) {
    throw songFieldError("sections", "Agrega la letra o una pista.");
  }
  if (!input.audioId) return;
  const audio = data.media.find((asset) => asset.id === input.audioId);
  if (!audio || audio.kind !== "audio") throw songFieldError("audioId", "Esa pista no existe.");
  if (data.songs.some((song) => song.audioId === input.audioId && song.id !== songId)) {
    throw songFieldError("audioId", "Esa pista ya es de otra canción.");
  }
}

/** A track no song uses anymore is deleted, freeing its space (contract §10). */
function dropMedia(data: ChurchData, id: Id) {
  const asset = data.media.find((candidate) => candidate.id === id);
  if (!asset) return;
  data.media = data.media.filter((candidate) => candidate.id !== id);
  mockWorld().files.delete(asset.storageKey);
}

function songs(session?: UserSession): SongRepository {
  function toSong(input: SongInput, existing?: MockSong): MockSong {
    return {
      id: existing?.id ?? crypto.randomUUID(),
      title: input.title,
      author: input.author,
      sections: input.sections.map((section) => ({ id: crypto.randomUUID(), ...section })),
      audioId: input.audioId,
      youtubeId: input.youtubeId,
      backgroundId:
        input.backgroundId !== undefined ? input.backgroundId : (existing?.backgroundId ?? null),
      archivedAt: existing?.archivedAt ?? null,
      lastUsedAt: existing?.lastUsedAt ?? null,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    };
  }

  return {
    async list({ search, page, limit, sort, archived = false } = {}) {
      await delay();
      const data = churchOf(session);
      const all = data.songs.filter((song) => (song.archivedAt !== null) === archived);
      const summary = (song: MockSong) => toSummary(resolveSong(data, song));
      const key = nameKey(search ?? "");
      if (key) {
        const ranked = all
          .map((song) => ({ song, score: relevance(song, key) }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score || compareNames(a.song.title, b.song.title))
          .map(({ song }) => summary(song));
        return paginate(ranked, page, limit);
      }
      const sorted = [...all].sort((a, b) =>
        sort === "-updatedAt"
          ? b.updatedAt.localeCompare(a.updatedAt)
          : compareNames(a.title, b.title),
      );
      return paginate(sorted.map(summary), page, limit);
    },
    async get(id) {
      await delay();
      const data = churchOf(session);
      const song = data.songs.find((candidate) => candidate.id === id);
      return song ? resolveSong(data, song) : null;
    },
    async create(input) {
      await delay();
      const data = churchOf(session);
      assertSongInput(data, input, null);
      const song = toSong(input);
      data.songs.push(song);
      return resolveSong(data, song);
    },
    async update(id, input) {
      await delay();
      const data = churchOf(session);
      assertSongInput(data, input, id);
      const index = data.songs.findIndex((song) => song.id === id);
      const previous = data.songs[index];
      const song = toSong(input, previous ?? ({ id, createdAt: now() } as MockSong));
      if (index === -1) data.songs.push(song);
      else data.songs[index] = song;
      if (previous?.audioId && previous.audioId !== input.audioId) {
        dropMedia(data, previous.audioId);
      }
      return resolveSong(data, song);
    },
    async archive(id) {
      await delay();
      const data = churchOf(session);
      const song = data.songs.find((candidate) => candidate.id === id);
      if (!song) throw notFound();
      if (!song.archivedAt) {
        song.archivedAt = now();
        if (song.audioId) dropMedia(data, song.audioId);
        song.audioId = null;
      }
      return resolveSong(data, song);
    },
    async unarchive(id) {
      await delay();
      const data = churchOf(session);
      const song = data.songs.find((candidate) => candidate.id === id);
      if (!song) throw notFound();
      if (song.archivedAt) {
        song.archivedAt = null;
        song.lastUsedAt = now();
      }
      return resolveSong(data, song);
    },
    async delete(id) {
      await delay();
      const data = churchOf(session);
      const song = data.songs.find((candidate) => candidate.id === id);
      if (!song) throw notFound();
      data.songs = data.songs.filter((candidate) => candidate.id !== id);
      // The track belongs to this song only: it goes with it.
      if (song.audioId) dropMedia(data, song.audioId);
      // Sin esto el plan adelantado quedaria con una referencia colgando.
      data.servicePlan = data.servicePlan.filter(
        (item) => !(item.kind === "song" && item.refId === id),
      );
    },
  };
}

/* ------------------------------------------------------------------- Media */

const UPLOAD_TTL_MS = 60 * 60 * 1000;

/** Signed-URL stand-in served by src/app/api/mock-storage/[key]/route.ts. */
export const mockStorageUrl = (key: string) => `/api/mock-storage/${key}`;

const toMediaAsset = ({ storageKey: _storageKey, ...asset }: MockMedia): MediaAsset => clone(asset);

function media(session?: UserSession): MediaRepository {
  const toAsset = toMediaAsset;

  return {
    async list({ kind, search, isBackground, page, limit } = {}) {
      await delay();
      const key = nameKey(search ?? "");
      const kinds = typeof kind === "string" ? [kind] : kind;
      const items = churchOf(session)
        .media.filter(
          (asset) =>
            (!kinds || kinds.includes(asset.kind)) &&
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
      const { usedBytes, quotaBytes } = storageOf(data);
      if (usedBytes + pending + sizeBytes > quotaBytes) {
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
      mockWorld().files.delete(asset.storageKey);
      // Sin esto el plan adelantado quedaria con una referencia colgando.
      data.servicePlan = data.servicePlan.filter(
        (item) => !(item.kind === "media" && item.refId === id),
      );
      // A song keeps its lyrics without the track, or goes if it was only the track.
      const song = data.songs.find((candidate) => candidate.audioId === id);
      if (song && song.sections.length > 0) {
        song.audioId = null;
        song.updatedAt = now();
      } else if (song) {
        data.songs = data.songs.filter((candidate) => candidate.id !== song.id);
        data.servicePlan = data.servicePlan.filter(
          (item) => !(item.kind === "song" && item.refId === song.id),
        );
      }
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

/* ----------------------------------------------------------------- YouTube */

function youtubeVideos(session?: UserSession): YoutubeVideoRepository {
  return {
    async list() {
      await delay();
      return clone(churchOf(session).youtubeVideos).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    },
    async get(id) {
      await delay();
      const video = churchOf(session).youtubeVideos.find((candidate) => candidate.id === id);
      return video ? clone(video) : null;
    },
    async create({ videoId, title, author }) {
      await delay();
      const data = churchOf(session);
      const same = data.youtubeVideos.find((candidate) => candidate.videoId === videoId);
      if (same) return clone(same);
      const video: YoutubeVideo = {
        id: crypto.randomUUID(),
        videoId,
        title,
        author,
        createdAt: now(),
        updatedAt: now(),
      };
      data.youtubeVideos.push(video);
      return clone(video);
    },
    async delete(id) {
      await delay();
      const data = churchOf(session);
      if (!data.youtubeVideos.some((video) => video.id === id)) throw notFound();
      data.youtubeVideos = data.youtubeVideos.filter((video) => video.id !== id);
      data.servicePlan = data.servicePlan.filter(
        (item) => !(item.kind === "youtube" && item.refId === id),
      );
    },
  };
}

/* -------------------------------------------------------------------- Plan */

const refNotFound = (kind: CreateServicePlanItemInput["kind"]) =>
  new ApiError(400, "VALIDATION_FAILED", "Revisa los datos enviados.", {
    refId:
      kind === "song"
        ? "Esa canción no existe."
        : kind === "youtube"
          ? "Ese video no existe."
          : "Ese medio no existe.",
  });

function servicePlan(session?: UserSession): ServicePlanRepository {
  return {
    async list() {
      await delay();
      return clone(churchOf(session).servicePlan).sort((a, b) => a.position - b.position);
    },
    async add({ kind, refId }) {
      await delay();
      const data = churchOf(session);
      if (kind === "bible") {
        if (!(await mockPassageExists(mockBible(), parsePassageId(refId)))) {
          throw new ApiError(400, "VALIDATION_FAILED", "Revisa los datos enviados.", {
            refId: "Ese pasaje no existe.",
          });
        }
      }
      const asset = kind === "media" ? data.media.find((m) => m.id === refId) : undefined;
      const exists =
        kind === "bible" ||
        (kind === "song"
          ? data.songs.some((song) => song.id === refId)
          : kind === "youtube"
            ? data.youtubeVideos.some((video) => video.id === refId)
            : !!asset);
      if (!exists) throw refNotFound(kind);
      // A track always belongs to a song: the song is what goes in the plan.
      if (asset?.kind === "audio") {
        throw new ApiError(400, "VALIDATION_FAILED", "Revisa los datos enviados.", {
          refId: "Las pistas se agregan con su canción.",
        });
      }

      const position = data.servicePlan.length;
      const item: ServicePlanItem = {
        id: crypto.randomUUID(),
        kind,
        refId,
        position,
        createdAt: now(),
        updatedAt: now(),
      };
      data.servicePlan.push(item);
      if (kind === "song") {
        const song = data.songs.find((candidate) => candidate.id === refId);
        if (song) Object.assign(song, { lastUsedAt: now(), archivedAt: null });
      }
      return clone(item);
    },
    async move(id, position) {
      await delay();
      const data = churchOf(session);
      const ordered = [...data.servicePlan].sort((a, b) => a.position - b.position);
      const from = ordered.findIndex((item) => item.id === id);
      if (from === -1) throw notFound();

      const [moved] = ordered.splice(from, 1);
      const to = Math.min(Math.max(position, 0), ordered.length);
      ordered.splice(to, 0, moved);
      ordered.forEach((item, index) => {
        item.position = index;
        item.updatedAt = now();
      });
    },
    async remove(id) {
      await delay();
      const data = churchOf(session);
      if (!data.servicePlan.some((item) => item.id === id)) throw notFound();
      data.servicePlan = data.servicePlan.filter((item) => item.id !== id);
    },
    async clear() {
      await delay();
      churchOf(session).servicePlan = [];
    },
  };
}

/* ------------------------------------------------------------ Time records */

function records(session?: UserSession): TimeRecordRepository {
  return {
    async list({ from, to, serviceTypeId, status, page, limit } = {}) {
      await delay();
      const items = churchOf(session)
        .records.filter(
          (record) =>
            (!from || record.date >= from) &&
            (!to || record.date < to) &&
            (!serviceTypeId || record.serviceTypeId === serviceTypeId) &&
            (!status || record.status === status),
        )
        .sort((a, b) => b.date.localeCompare(a.date));
      return paginate(items, page, limit, 500);
    },
    async get(id) {
      await delay();
      return clone(churchOf(session).records.find((record) => record.id === id) ?? null);
    },
    async save(id, input) {
      await delay();
      const data = churchOf(session);
      const existing = data.records.find((record) => record.id === id);
      // Contract §14: a finished record never goes back to in progress.
      if (existing?.status === "finished" && input.status === "inProgress") {
        throw new ApiError(409, "RECORD_FINISHED", "Este servicio ya terminó.");
      }
      const record: ServiceRecord = {
        id,
        ...input,
        blocks: input.blocks.map((block) => ({ ...block })),
        createdAt: existing?.createdAt ?? now(),
        updatedAt: now(),
      };
      data.records = [...data.records.filter((candidate) => candidate.id !== id), record];
      return clone(record);
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

function backup(session?: UserSession): BackupRepository {
  const songRepo = songs(session);
  const videoRepo = youtubeVideos(session);
  return {
    async export() {
      await delay();
      const data = churchOf(session);
      return clone({
        format: "iris-backup",
        version: 1,
        exportedAt: now(),
        songs: data.songs.map((song) => ({
          title: song.title,
          author: song.author,
          sections: song.sections.map(({ label, text }) => ({ label, text })),
          youtubeId: song.youtubeId,
        })),
        youtubeVideos: data.youtubeVideos.map(({ videoId, title, author }) => ({
          videoId,
          title,
          author,
        })),
      });
    },
    async import(file) {
      await delay();
      const data = churchOf(session);
      if (file.format !== "iris-backup" || file.version !== 1) {
        throw new ApiError(400, "VALIDATION_FAILED", "Ese archivo no es un respaldo de Iris.");
      }
      const seen = new Set(
        data.songs.map((song) => `${nameKey(song.title)}\u0000${nameKey(song.author)}`),
      );
      const result = { songs: 0, youtubeVideos: 0, skipped: 0, withoutLyrics: 0 };
      for (const song of file.songs) {
        if (song.sections.length === 0 && !song.youtubeId) {
          result.withoutLyrics += 1;
          continue;
        }
        const key = `${nameKey(song.title)}\u0000${nameKey(song.author)}`;
        if (seen.has(key)) {
          result.skipped += 1;
          continue;
        }
        await songRepo.create({
          title: song.title,
          author: song.author,
          sections: song.sections,
          audioId: null,
          youtubeId: song.youtubeId,
        });
        seen.add(key);
        result.songs += 1;
      }
      for (const video of file.youtubeVideos) {
        const before = data.youtubeVideos.length;
        await videoRepo.create(video);
        if (data.youtubeVideos.length > before) result.youtubeVideos += 1;
        else result.skipped += 1;
      }
      return result;
    },
    async erase({ songs: eraseSongs, media: eraseMedia, youtube }) {
      await delay();
      const data = churchOf(session);
      const result = { songs: 0, media: 0, youtube: 0 };
      if (eraseSongs) {
        result.songs = data.songs.length;
        for (const song of data.songs) if (song.audioId) dropMedia(data, song.audioId);
        data.songs = [];
        data.servicePlan = data.servicePlan.filter((item) => item.kind !== "song");
      }
      if (eraseMedia) {
        const files = data.media.filter((asset) => asset.kind !== "audio");
        result.media = files.length;
        for (const asset of files) dropMedia(data, asset.id);
        data.servicePlan = data.servicePlan.filter((item) => item.kind !== "media");
      }
      if (youtube) {
        result.youtube = data.youtubeVideos.length;
        data.youtubeVideos = [];
        data.servicePlan = data.servicePlan.filter((item) => item.kind !== "youtube");
      }
      return result;
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
    youtubeVideos: youtubeVideos(session),
    backup: backup(session),
    servicePlan: servicePlan(session),
    records: records(session),
    displays: mockDisplays(session),
    bible: mockBible(),
  };
}
