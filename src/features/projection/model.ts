import type { ProjectionSettings } from "@/domain/models";

// What a screen shows at one moment. The console builds it; `/display`, the EN VIVO
// preview and every slide card draw the same value with `ProjectionCanvas`, so they
// always match (IRIS_SPEC §5.12, the same model as the iPad's `ProjectionFrame`).

export type ProjectionBackground = {
  id: string;
  name: string;
  /** Gradient stops ("#2A1658"). Also the placeholder while an image or video loads. */
  colors: string[];
  /** A church image marked as background, filling the screen. */
  imageUrl?: string;
  /** A church video marked as background: muted, looping, filling the screen. */
  videoUrl?: string;
};

export type ProjectionContent =
  | { kind: "blank" }
  | { kind: "text"; text: string; footnote: string | null }
  | { kind: "image"; id: string; url: string }
  | {
      kind: "video";
      id: string;
      url: string;
      /** Where the video should be: playing from `position` seconds at `at` (epoch ms), or paused there. */
      playing: boolean;
      position: number;
      at: number;
    }
  /** A YouTube video in YouTube's own player, following the console the same way. */
  | {
      kind: "youtube";
      id: string;
      playing: boolean;
      position: number;
      at: number;
      /** YouTube's subtitles; off unless the console turns them on. */
      captions: boolean;
    };

export type ProjectionTypography = Pick<ProjectionSettings, "fontFamily" | "fontSizePt">;

export type ProjectionFrame = {
  background: ProjectionBackground | null;
  content: ProjectionContent;
  typography: ProjectionTypography;
};

export const DEFAULT_TYPOGRAPHY: ProjectionTypography = { fontFamily: "system", fontSizePt: 88 };

export const BLACK_FRAME: ProjectionFrame = {
  background: null,
  content: { kind: "blank" },
  typography: DEFAULT_TYPOGRAPHY,
};

/**
 * A frame from a console whose clock differs from this screen's: the times in it (when a
 * video started playing) moved by `shiftMs`, so the video plays in step anyway.
 */
export function rebaseFrame(frame: ProjectionFrame, shiftMs: number): ProjectionFrame {
  const { content } = frame;
  if ((content.kind !== "video" && content.kind !== "youtube") || !shiftMs) return frame;
  return { ...frame, content: { ...content, at: content.at + shiftMs } };
}

/** The six built-in gradients every church has (same ids as the iPad, contract §6). */
export const GRADIENTS: ProjectionBackground[] = [
  { id: "aurora", name: "Aurora", colors: ["#2A1658", "#4E2A8C", "#131E5C"] },
  { id: "brasa", name: "Brasa", colors: ["#3A1E08", "#8C3A1E", "#3D1235"] },
  { id: "oceano", name: "Océano", colors: ["#06283D", "#0E5E6F", "#0A1931"] },
  { id: "olivo", name: "Olivo", colors: ["#0F2417", "#2F5233", "#111A12"] },
  { id: "alba", name: "Alba", colors: ["#5B2A3C", "#C0694E", "#2B1A3A"] },
  { id: "medianoche", name: "Medianoche", colors: ["#07070B", "#15151F", "#07070B"] },
];

/** Placeholder stops for a church background while its file loads. */
export const MEDIA_BACKGROUND_COLORS = ["#15151F", "#07070B"];

/**
 * The 10 projection typeface keys (contract §6) as web font stacks. Apple names come
 * first (Mac, iPad browsers), then the closest Windows/TV fonts, then a generic family.
 */
const FONT_STACKS: Record<string, string> = {
  system: 'system-ui, -apple-system, "Segoe UI Variable", "Segoe UI", Roboto, sans-serif',
  systemRounded: 'ui-rounded, "SF Pro Rounded", "Segoe UI", Roboto, sans-serif',
  serif: 'ui-serif, "New York", Georgia, serif',
  georgia: "Georgia, serif",
  avenirNext: '"Avenir Next", Avenir, "Century Gothic", sans-serif',
  futura: 'Futura, "Century Gothic", Bahnschrift, sans-serif',
  gillSans: '"Gill Sans", "Gill Sans MT", Corbel, sans-serif',
  optima: 'Optima, Candara, "Segoe UI", sans-serif',
  baskerville: 'Baskerville, "Baskerville Old Face", Cambria, serif',
  palatino: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
};

export function fontStack(key: string): string {
  return FONT_STACKS[key] ?? FONT_STACKS.system;
}

/**
 * `fontSizePt` is measured on a 1920-wide screen; as container-query width it scales with
 * whatever size the canvas is drawn at (card, preview or TV). The footnote keeps the
 * iPad's ratio (0.022 of the width against 0.046 for the body).
 */
export function lyricSizes(typography: ProjectionTypography) {
  const body = (typography.fontSizePt / 1920) * 100;
  return { body: `${body}cqw`, footnote: `${body * (0.022 / 0.046)}cqw` };
}

/** Every file a frame needs, to preload it before it is shown. */
export function frameUrls(frame: ProjectionFrame): string[] {
  const urls: string[] = [];
  if (frame.background?.imageUrl) urls.push(frame.background.imageUrl);
  if (frame.background?.videoUrl) urls.push(frame.background.videoUrl);
  if (frame.content.kind === "image" || frame.content.kind === "video")
    urls.push(frame.content.url);
  return urls;
}
