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
  /** A video background's length, for the picker. */
  durationSeconds?: number | null;
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

export type ProjectionTypography = Pick<
  ProjectionSettings,
  "fontFamily" | "fontSizePt" | "fontBold" | "fontItalic" | "uppercase"
>;

export type ProjectionFrame = {
  background: ProjectionBackground | null;
  content: ProjectionContent;
  typography: ProjectionTypography;
};

export const DEFAULT_TYPOGRAPHY: ProjectionTypography = {
  fontFamily: "system",
  fontSizePt: 100,
  fontBold: false,
  fontItalic: false,
  uppercase: false,
};

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

/** Placeholder stops for a church background while its file loads. */
export const MEDIA_BACKGROUND_COLORS = ["#15151F", "#07070B"];

/** The projection typeface keys (contract §6) as CSS stacks; the web fonts come from fonts.ts. */
const FONT_STACKS: Record<string, string> = {
  system: 'system-ui, -apple-system, "Segoe UI Variable", "Segoe UI", Roboto, sans-serif',
  inter: "var(--font-projection-inter), system-ui, sans-serif",
  montserrat: "var(--font-projection-montserrat), system-ui, sans-serif",
  poppins: "var(--font-projection-poppins), system-ui, sans-serif",
  oswald: "var(--font-projection-oswald), system-ui, sans-serif",
  bebasNeue: "var(--font-projection-bebas), system-ui, sans-serif",
  playfairDisplay: "var(--font-projection-playfair), Georgia, serif",
  lora: "var(--font-projection-lora), Georgia, serif",
  merriweather: "var(--font-projection-merriweather), Georgia, serif",
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
