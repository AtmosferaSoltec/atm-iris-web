// YouTube (and YouTube Music, whose songs are YouTube videos) without its API: links and
// thumbnails. Videos play in YouTube's own player; nothing is ever downloaded.

/** A video as Iris shows it (from oEmbed). */
export type YouTubeVideo = {
  videoId: string;
  title: string;
  author: string;
  /** The link was YouTube Music's (only the music), not YouTube's (with video). */
  music: boolean;
};

/** A music.youtube.com link: the same video, but the church chose it for its music only. */
export function isYouTubeMusicLink(input: string): boolean {
  try {
    const text = input.trim();
    return (
      new URL(text.startsWith("http") ? text : `https://${text}`).hostname === "music.youtube.com"
    );
  } catch {
    return false;
  }
}

/**
 * The video id of a YouTube or YouTube Music link: watch?v=, youtu.be/, shorts/, embed/, live/ or the bare
 * 11-character id. Null when it is not a YouTube video.
 */
export function youTubeVideoId(input: string): string | null {
  const text = input.trim();
  if (/^[\w-]{11}$/.test(text)) return text;
  let url: URL;
  try {
    url = new URL(text.startsWith("http") ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id =
      url.searchParams.get("v") ??
      url.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/)?.[1] ??
      null;
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

/** The video's thumbnail (no API key needed). */
export function youTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
