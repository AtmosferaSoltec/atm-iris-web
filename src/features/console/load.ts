import "server-only";
import type { MediaAsset, ServicePlanItem, Song, SongSummary, YoutubeVideo } from "@/domain/models";
import { MEDIA_BACKGROUND_COLORS } from "@/features/projection/model";
import { clock } from "@/lib/format";
import type { Repositories } from "@/server/repositories/types";
import { parsePassageId } from "@/lib/bible-reference";
import { passageItem } from "./bible/passage-item";
import { mediaEntry, songEntry, songSubtitle, sortEntries, youtubeEntry } from "./library/entries";
import type { ConsoleData, ConsoleFile, ConsoleItem, LibraryEntry } from "./model";
import { selectedServiceTypeId } from "./selected-service";

/** Everything the console needs to open: the service (the plan), the library and the backgrounds. */
export async function loadConsole(repos: Repositories): Promise<ConsoleData> {
  const church = await repos.church.get();
  const [plan, songs, media, videos, backgrounds, serviceTypes, people, running, displays] =
    await Promise.all([
      repos.servicePlan.list(),
      allSongs(repos),
      allMedia(repos),
      // An API without saved videos yet must not keep the console from opening.
      repos.youtubeVideos.list().catch(() => []),
      allPages((page) => repos.media.list({ isBackground: true, page, limit: 100 })),
      repos.serviceTypes.list(),
      repos.people.list(),
      repos.records.list({ status: "inProgress", limit: 1 }),
      // An API without displays yet must not keep the console from opening.
      repos.displays.list().catch(() => []),
    ]);

  const items = (
    await Promise.all(plan.map((row) => consoleItemFor(repos, row.kind, row.refId, row.id)))
  ).filter((item): item is ConsoleItem => item !== null);
  const library = await libraryOf(repos, songs, media, videos);

  const backgroundFiles = await Promise.all(
    backgrounds.map(async (asset) => ({ asset, url: await signedUrl(repos, asset.id) })),
  );

  return {
    churchId: church.id,
    churchName: church.name,
    timeZone: church.timezone,
    serviceTypes,
    people,
    inProgress: running.data[0] ?? null,
    selectedServiceTypeId: await selectedServiceTypeId(church.id),
    displays,
    projection: church.projection,
    items,
    library,
    backgrounds: [
      ...backgroundFiles
        .filter(({ url }) => url !== null)
        .map(({ asset, url }) => ({
          id: asset.id,
          name: asset.title,
          colors: MEDIA_BACKGROUND_COLORS,
          ...(asset.kind === "video"
            ? { videoUrl: url!, durationSeconds: asset.durationSeconds }
            : { imageUrl: url! }),
        })),
    ],
  };
}

async function libraryOf(
  repos: Repositories,
  songs: SongSummary[],
  media: MediaAsset[],
  videos: YoutubeVideo[],
): Promise<LibraryEntry[]> {
  const mediaEntries = await Promise.all(
    media.map(async (asset) => mediaEntry(asset, await signedUrl(repos, asset.id))),
  );
  return sortEntries([...songs.map(songEntry), ...mediaEntries, ...videos.map(youtubeEntry)]);
}

const allSongs = (repos: Repositories) =>
  allPages((page) => repos.songs.list({ page, limit: 100, sort: "title" }));

const allMedia = (repos: Repositories) =>
  allPages((page) =>
    repos.media.list({ kind: ["image", "video"], isBackground: false, page, limit: 100 }),
  );

/** A plan row (or something just added) as the console shows it, with its file's URL. */
export async function consoleItemFor(
  repos: Repositories,
  kind: ServicePlanItem["kind"],
  refId: string,
  planItemId: string,
): Promise<ConsoleItem | null> {
  if (kind === "song") {
    const song = await repos.songs.get(refId);
    return song ? fromSong(repos, song, planItemId) : null;
  }
  if (kind === "bible") return fromPassage(repos, refId, planItemId);
  if (kind === "youtube") {
    const video = await repos.youtubeVideos.get(refId);
    return video ? fromYouTube(video, planItemId) : null;
  }
  const asset = await repos.media.get(refId);
  if (!asset || asset.kind === "audio") return null;
  const file = await fileFor(repos, asset);
  if (!file) return null;
  return {
    planItemId,
    refId,
    kind: asset.kind,
    title: asset.title,
    subtitle:
      asset.kind === "video" && asset.durationSeconds !== null
        ? `Video · ${clock(asset.durationSeconds)}`
        : null,
    slides: [],
    file,
  };
}

/** A saved YouTube video: played by YouTube's player, nothing to download. */
function fromYouTube(video: YoutubeVideo, planItemId: string): ConsoleItem {
  return {
    planItemId,
    refId: video.id,
    kind: "youtube",
    title: video.title,
    subtitle: video.author ? `YouTube · ${video.author}` : "YouTube",
    slides: [],
    file: null,
    youTubeId: video.videoId,
  };
}

/** A passage saved in the plan (contract §15), with its chapter read from §13. */
async function fromPassage(
  repos: Repositories,
  refId: string,
  planItemId: string,
): Promise<ConsoleItem | null> {
  const passage = parsePassageId(refId);
  if (!passage) return null;
  const chapter = await repos.bible.chapter(passage.code, passage.bookId, passage.chapter);
  return chapter ? passageItem(chapter, passage, { planItemId, refId }) : null;
}

async function fromSong(repos: Repositories, song: Song, planItemId: string): Promise<ConsoleItem> {
  const file = song.audio ? await fileFor(repos, song.audio) : null;
  return {
    planItemId,
    refId: song.id,
    kind: song.sections.length === 0 && (file || song.youtubeId) ? "track" : "song",
    title: song.title,
    subtitle: songSubtitle({ ...song, sectionCount: song.sections.length }) || null,
    slides: song.sections.map((section) => ({ ...section })),
    file,
    // The track on YouTube: a visible player in the console plays it; nothing to download.
    ...(song.youtubeId ? { youTubeId: song.youtubeId } : {}),
    backgroundId: song.backgroundId,
  };
}

async function fileFor(repos: Repositories, asset: MediaAsset): Promise<ConsoleFile | null> {
  const url = await signedUrl(repos, asset.id);
  return url ? { id: asset.id, url, durationSeconds: asset.durationSeconds } : null;
}

async function signedUrl(repos: Repositories, id: string): Promise<string | null> {
  try {
    return (await repos.media.downloadUrl(id)).url;
  } catch {
    return null;
  }
}

/** Every page of a paginated list (the library is read whole: the panel filters in memory). */
async function allPages<T>(
  load: (page: number) => Promise<{ data: T[]; meta: { totalPages: number } }>,
  maxPages = 10,
): Promise<T[]> {
  const first = await load(1);
  const rest = await Promise.all(
    Array.from({ length: Math.min(first.meta.totalPages, maxPages) - 1 }, (_, index) =>
      load(index + 2),
    ),
  );
  return [first, ...rest].flatMap((page) => page.data);
}
