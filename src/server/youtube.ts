import "server-only";
import type { YouTubeVideo } from "@/lib/youtube";

// YouTube from the server: oEmbed (public, no key) to check a video and read its title.
// Nothing is downloaded: the video plays in YouTube's player.

/** Can this video play outside YouTube, and what is it called? */
export async function lookUpYouTube(
  videoId: string,
): Promise<{ video?: Omit<YouTubeVideo, "music">; error?: string }> {
  try {
    const watch = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`,
      { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(8000) },
    );
    if (response.status === 401 || response.status === 403) {
      return { error: "Este video no permite reproducirse fuera de YouTube." };
    }
    if (!response.ok) return { error: "No encontramos ese video. Revisa el enlace." };
    const data = (await response.json()) as { title?: string; author_name?: string };
    return {
      video: { videoId, title: data.title ?? "Video de YouTube", author: data.author_name ?? "" },
    };
  } catch {
    return { error: "No pudimos consultar YouTube. Revisa la conexión a internet." };
  }
}
