import type { MediaKind } from "./models";

// Contract §11: what each kind accepts. The browser checks it before asking for
// an upload ticket; the API (and the mock) check it again.

const MB = 1024 * 1024;

export const MEDIA_RULES: Record<MediaKind, { contentTypes: readonly string[]; maxBytes: number }> =
  {
    image: { contentTypes: ["image/jpeg", "image/png", "image/webp"], maxBytes: 20 * MB },
    video: { contentTypes: ["video/mp4", "video/quicktime"], maxBytes: 2048 * MB },
    audio: {
      contentTypes: ["audio/mpeg", "audio/mp4", "audio/aac", "audio/wav", "audio/x-wav"],
      maxBytes: 200 * MB,
    },
  };

export const MEDIA_KINDS: readonly MediaKind[] = ["image", "video", "audio"];

/** The kind a file belongs to by its MIME type, or null when Iris doesn't take it. */
export function mediaKindOf(contentType: string): MediaKind | null {
  return MEDIA_KINDS.find((kind) => MEDIA_RULES[kind].contentTypes.includes(contentType)) ?? null;
}

// The API's texts are not in the contract yet; these are the ones the mock
// sends and the browser shows before asking (see phase 05 deviations).
export const MEDIA_ERRORS = {
  UNSUPPORTED_MEDIA_TYPE:
    "Ese tipo de archivo no se puede subir. Usa JPG, PNG, WebP, MP4, MOV, MP3, M4A, AAC o WAV.",
  FILE_TOO_LARGE: "El archivo es demasiado grande.",
  STORAGE_QUOTA_EXCEEDED: "No queda espacio en el almacenamiento de tu iglesia.",
  UPLOAD_NOT_FOUND: "El archivo no llegó al almacenamiento. Vuelve a subirlo.",
} as const;

export function tooLargeMessage(kind: MediaKind): string {
  const limit = MEDIA_RULES[kind].maxBytes / MB;
  const pretty = limit >= 1024 ? `${limit / 1024} GB` : `${limit} MB`;
  return `${MEDIA_ERRORS.FILE_TOO_LARGE} El máximo es ${pretty}.`;
}
