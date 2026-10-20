import type { MediaAsset, SongSummary, YoutubeVideo } from "@/domain/models";
import { clock } from "@/lib/format";
import { youTubeThumbnail } from "@/lib/youtube";
import type { LibraryEntry } from "../model";

// How the library shows each song and file (BIBLIOTECA). Pure: the server builds the first
// list with it and the console keeps it current after a song is saved or a file uploaded.

type SongFacts = Pick<
  SongSummary,
  "id" | "title" | "author" | "sectionCount" | "audio" | "youtubeId" | "youtubeMusic"
>;

/** "Hillsong · Con pista de YT Music", "Solo pista 3:45", or just the author. */
export function songSubtitle(song: Omit<SongFacts, "id" | "title">): string {
  const prefix = song.sectionCount === 0 ? "Solo pista" : "Con pista";
  const track = song.audio
    ? [prefix, song.audio.durationSeconds !== null ? clock(song.audio.durationSeconds) : null]
        .filter(Boolean)
        .join(" ")
    : song.youtubeId
      ? `${prefix} de ${song.youtubeMusic ? "YT Music" : "YouTube"}`
      : null;
  return [song.author || null, track].filter(Boolean).join(" · ");
}

export function songEntry(song: SongFacts): LibraryEntry {
  return {
    kind: "song",
    id: song.id,
    title: song.title,
    subtitle: songSubtitle(song),
    icon: !(song.audio || song.youtubeId)
      ? "song"
      : song.sectionCount === 0
        ? "track"
        : "songTrack",
    durationSeconds: song.audio?.durationSeconds ?? null,
    previewUrl: null,
  };
}

/** `previewUrl` is the file's signed URL: an image is its own thumbnail, a video shows its first frame. */
export function mediaEntry(asset: MediaAsset, previewUrl: string | null = null): LibraryEntry {
  return {
    kind: "media",
    id: asset.id,
    title: asset.title,
    subtitle: asset.kind === "video" ? "Video" : "Imagen",
    icon: asset.kind === "video" ? "video" : "image",
    durationSeconds: asset.durationSeconds,
    previewUrl,
  };
}

export function youtubeEntry(video: YoutubeVideo): LibraryEntry {
  return {
    kind: "youtube",
    id: video.id,
    title: video.title,
    subtitle: video.author ? `YouTube · ${video.author}` : "YouTube",
    icon: "youtube",
    durationSeconds: null,
    previewUrl: youTubeThumbnail(video.videoId),
  };
}

const KIND_ORDER = { song: 0, media: 1, youtube: 2 } as const;

/** Songs first, then files, then YouTube, each by title: the order the panel lists them in. */
export function sortEntries(entries: LibraryEntry[]): LibraryEntry[] {
  return [...entries].sort(
    (a, b) =>
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
      a.title.localeCompare(b.title, "es", { sensitivity: "base" }),
  );
}
