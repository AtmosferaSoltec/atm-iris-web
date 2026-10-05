import type { MediaKind } from "@/domain/models";

export type MediaMeasures = {
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
};

const NONE: MediaMeasures = { durationSeconds: null, width: null, height: null };
const METADATA_TIMEOUT_MS = 15_000;

/**
 * Contract §11: the client that uploads measures the file. A file the browser
 * can't read still uploads, just without these numbers.
 */
export async function measureMedia(file: File, kind: MediaKind): Promise<MediaMeasures> {
  try {
    if (kind === "image") {
      const bitmap = await createImageBitmap(file);
      const measures = { durationSeconds: null, width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return measures;
    }
    return await measureTimed(file, kind);
  } catch {
    return NONE;
  }
}

function measureTimed(file: File, kind: "video" | "audio"): Promise<MediaMeasures> {
  return new Promise((resolve) => {
    const element = document.createElement(kind);
    const url = URL.createObjectURL(file);
    const finish = (measures: MediaMeasures) => {
      clearTimeout(timer);
      element.removeAttribute("src");
      element.load();
      URL.revokeObjectURL(url);
      resolve(measures);
    };
    const timer = setTimeout(() => finish(NONE), METADATA_TIMEOUT_MS);
    element.preload = "metadata";
    element.muted = true;
    element.onloadedmetadata = () => {
      const duration = Number.isFinite(element.duration) ? Math.round(element.duration) : null;
      const video = kind === "video" ? (element as HTMLVideoElement) : null;
      finish({
        durationSeconds: duration,
        width: video?.videoWidth || null,
        height: video?.videoHeight || null,
      });
    };
    element.onerror = () => finish(NONE);
    element.src = url;
  });
}
