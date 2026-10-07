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

/**
 * What a file needs to be a lyrics background (contract §11). The API has the
 * same table in `src/modules/media/media.background.ts`: change a value in both.
 * Videos loop without sound, so a short one is enough and keeps the file small.
 */
export const BACKGROUND_RULES = {
  image: {
    contentTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 10 * MB,
    minWidth: 1280,
    maxWidth: 3840,
  },
  video: {
    contentTypes: ["video/mp4"],
    maxBytes: 100 * MB,
    minWidth: 1280,
    maxWidth: 1920,
    maxSeconds: 30,
  },
  /** 16:9 with a 2 % margin (1366 × 768 passes). */
  aspectRatio: 16 / 9,
  aspectTolerance: 0.02,
} as const;

export const BACKGROUND_TYPES = [
  ...BACKGROUND_RULES.image.contentTypes,
  ...BACKGROUND_RULES.video.contentTypes,
];

type BackgroundCandidate = {
  kind: MediaKind;
  contentType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

/** Why a file can't be a background, or null when it can. */
export function backgroundProblem(media: BackgroundCandidate): string | null {
  if (media.kind === "audio") return "Un audio no puede ser fondo. Usa una imagen o un video.";
  const rules = BACKGROUND_RULES[media.kind];
  if (!(rules.contentTypes as readonly string[]).includes(media.contentType)) {
    return media.kind === "video"
      ? "El video de fondo debe ser MP4."
      : "La imagen de fondo debe ser JPG, PNG o WebP.";
  }
  if (media.sizeBytes > rules.maxBytes) {
    return `El archivo pesa demasiado para un fondo. El máximo es ${rules.maxBytes / MB} MB.`;
  }
  if (!media.width || !media.height) return "No pudimos medir el archivo. Prueba con otro.";
  const ratio = media.width / media.height;
  if (Math.abs(ratio / BACKGROUND_RULES.aspectRatio - 1) > BACKGROUND_RULES.aspectTolerance) {
    return "El fondo debe ser horizontal 16:9, por ejemplo 1920 × 1080.";
  }
  if (media.width < rules.minWidth || media.width > rules.maxWidth) {
    const height = (width: number) => Math.round(width / BACKGROUND_RULES.aspectRatio);
    return `El fondo debe medir entre ${rules.minWidth} × ${height(rules.minWidth)} y ${rules.maxWidth} × ${height(rules.maxWidth)} (recomendado 1920 × 1080).`;
  }
  if (
    media.kind === "video" &&
    (media.durationSeconds ?? Infinity) > BACKGROUND_RULES.video.maxSeconds
  ) {
    return `El video de fondo dura como máximo ${BACKGROUND_RULES.video.maxSeconds} segundos: se repite en bucle.`;
  }
  return null;
}
