import type { SongSummary } from "@/domain/models";
import { clock } from "@/lib/format";

/** "Pedro Márquez · con pista 3:45", "Solo pista 3:45", or just the author for lyrics only. */
export function songFacts(
  song: Pick<SongSummary, "author" | "sectionCount" | "audio">,
): string | null {
  const track = song.audio
    ? [
        song.sectionCount === 0 ? "Solo pista" : "con pista",
        song.audio.durationSeconds !== null ? clock(song.audio.durationSeconds) : null,
      ]
        .filter(Boolean)
        .join(" ")
    : null;
  return [song.author || null, track].filter(Boolean).join(" · ") || null;
}
