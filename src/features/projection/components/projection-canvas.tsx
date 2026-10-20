"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { youTubeThumbnail } from "@/lib/youtube";
import { useResolveFile } from "../file-resolver";
import { isEmbedBlocked, loadYouTube, type YouTubePlayer } from "../youtube-api";
import {
  fontStack,
  lyricSizes,
  type ProjectionBackground,
  type ProjectionContent,
  type ProjectionFrame,
  type ProjectionTypography,
} from "../model";

type VideoTime = { id: string; position: number; duration: number };

type Props = {
  frame: ProjectionFrame;
  /** Cross-fade between backgrounds and between contents (screen and EN VIVO). Cards switch instantly. */
  transitions?: boolean;
  /** Draw the real video and loop video backgrounds. Off for slide cards. */
  playsVideo?: boolean;
  /** The screen reports where its video is, so the console's player follows it. */
  onVideoTime?: (time: VideoTime) => void;
  /** A YouTube video plays with sound here (the console, towards the speakers); muted elsewhere. */
  audible?: boolean;
  /** YouTube refused the video (embedding not allowed, removed…). */
  onVideoError?: (message: string) => void;
  className?: string;
  children?: ReactNode;
};

const FADE_MS = 450;
/** Contents go out, then in: the old lyrics are gone before the new ones show. */
const CONTENT_OUT_MS = 200;
const CONTENT_IN_MS = 260;

/**
 * Draws a `ProjectionFrame` in 16:9 at any size (IRIS_SPEC §5.12): black, then the
 * background (gradient, image or looping muted video, with a 20 % veil for contrast),
 * then the content. Everything is sized in container-query units, so a card, the live
 * preview and the TV are the same picture at different sizes.
 */
export function ProjectionCanvas({
  frame,
  transitions = false,
  playsVideo = false,
  onVideoTime,
  audible = false,
  onVideoError,
  className,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "@container relative aspect-video overflow-hidden bg-black select-none",
        className,
      )}
    >
      <Layers value={frame.background} keyOf={(b) => b?.id ?? "none"} transitions={transitions}>
        {(background) =>
          background && <Background background={background} playsVideo={playsVideo} />
        }
      </Layers>
      <Sequence value={frame.content} keyOf={contentKey} transitions={transitions}>
        {(content) => (
          <Content
            content={content}
            typography={frame.typography}
            playsVideo={playsVideo}
            onVideoTime={onVideoTime}
            audible={audible}
            onVideoError={onVideoError}
          />
        )}
      </Sequence>
      {children}
    </div>
  );
}

/** Same id while the same thing is shown: a video that pauses or seeks keeps its element. */
function contentKey(content: ProjectionContent): string {
  switch (content.kind) {
    case "blank":
      return "blank";
    case "text":
      return `text:${content.text}\u0000${content.footnote ?? ""}`;
    case "image":
    case "video":
    case "youtube":
      return `${content.kind}:${content.id}`;
  }
}

/**
 * Backgrounds cross-fade: the outgoing one stays under the incoming one until it has faded
 * in, so a change never flashes black. Without transitions it simply swaps.
 */
function Layers<T>({
  value,
  keyOf,
  transitions,
  children,
}: {
  value: T;
  keyOf: (value: T) => string;
  transitions: boolean;
  children: (value: T) => ReactNode;
}) {
  const key = keyOf(value);
  const [layers, setLayers] = useState([{ key, value }]);

  // A new key stacks on top; the same key just takes the new value (a video's play state).
  if (layers.at(-1)!.key !== key) {
    setLayers((current) => [...(transitions ? current.slice(-1) : []), { key, value }]);
  } else if (layers.at(-1)!.value !== value) {
    setLayers((current) => [...current.slice(0, -1), { key, value }]);
  }

  useEffect(() => {
    if (layers.length < 2) return;
    const timer = setTimeout(() => setLayers((current) => current.slice(-1)), FADE_MS);
    return () => clearTimeout(timer);
  }, [layers.length]);

  return layers.map((layer, index) => (
    <div
      key={layer.key}
      className="absolute inset-0"
      style={
        transitions && index === layers.length - 1 && layers.length > 1
          ? { animation: `projection-fade ${FADE_MS}ms ease-out both` }
          : undefined
      }
    >
      {children(layer.value)}
    </div>
  ));
}

type Layer<T> = { key: string; value: T };

/**
 * The content (lyrics, an image, a video): the one on screen fades out first and only then
 * the next fades in, so two slides never mix. A change that comes while one is leaving just
 * becomes the next to come in. The same key only takes the new value (a video's play state).
 */
function Sequence<T>({
  value,
  keyOf,
  transitions,
  children,
}: {
  value: T;
  keyOf: (value: T) => string;
  transitions: boolean;
  children: (value: T) => ReactNode;
}) {
  const key = keyOf(value);
  const [state, setState] = useState<{
    current: Layer<T>;
    leaving: Layer<T> | null;
    /** The current one came in after another: it fades in. */
    entering: boolean;
  }>({ current: { key, value }, leaving: null, entering: false });

  if (state.current.key !== key) {
    setState({
      current: { key, value },
      // Already leaving: that one keeps leaving; the new one waits its turn.
      leaving: transitions ? (state.leaving ?? state.current) : null,
      entering: transitions,
    });
  } else if (state.current.value !== value) {
    setState({ ...state, current: { key, value } });
  }

  useEffect(() => {
    if (!state.leaving) return;
    const timer = setTimeout(() => setState((now) => ({ ...now, leaving: null })), CONTENT_OUT_MS);
    return () => clearTimeout(timer);
  }, [state.leaving]);

  const layer = state.leaving ?? state.current;
  return (
    <div
      // The same element fades out (no remount: a leaving video does not reload).
      key={layer.key}
      className="absolute inset-0"
      style={
        state.leaving
          ? { animation: `projection-fade-out ${CONTENT_OUT_MS}ms ease-in both` }
          : state.entering
            ? { animation: `projection-fade ${CONTENT_IN_MS}ms ease-out both` }
            : undefined
      }
    >
      {children(layer.value)}
    </div>
  );
}

const Background = memo(function Background({
  background,
  playsVideo,
}: {
  background: ProjectionBackground;
  playsVideo: boolean;
}) {
  const resolve = useResolveFile();
  const [from, via = from, to = via] = background.colors;
  const videoUrl = background.videoUrl && resolve(background.id, background.videoUrl);
  const imageUrl = background.imageUrl && resolve(background.id, background.imageUrl);
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(120% 80% at 50% 0%, rgb(255 255 255 / 0.14), transparent 60%), linear-gradient(135deg, ${from}, ${via}, ${to})`,
        }}
      />
      {videoUrl ? (
        playsVideo ? (
          <video
            className="absolute inset-0 size-full object-cover"
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
        ) : (
          // A still frame for thumbnails: only the metadata and the first frame load.
          <video
            className="absolute inset-0 size-full object-cover"
            src={`${videoUrl}#t=0.5`}
            muted
            playsInline
            preload="metadata"
            tabIndex={-1}
          />
        )
      ) : imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed or blob URLs
        <img
          className="absolute inset-0 size-full object-cover"
          src={imageUrl}
          alt=""
          decoding="async"
          draggable={false}
        />
      ) : null}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
});

function Content({
  content,
  typography,
  playsVideo,
  onVideoTime,
  audible,
  onVideoError,
}: {
  content: ProjectionContent;
  typography: ProjectionTypography;
  playsVideo: boolean;
  onVideoTime?: (time: VideoTime) => void;
  audible: boolean;
  onVideoError?: (message: string) => void;
}) {
  const resolve = useResolveFile();
  switch (content.kind) {
    case "youtube":
      return playsVideo ? (
        <YouTubeVideo
          content={content}
          audible={audible}
          onVideoTime={onVideoTime}
          onVideoError={onVideoError}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- YouTube's thumbnail
        <img
          className="absolute inset-0 size-full object-cover"
          src={youTubeThumbnail(content.id)}
          alt=""
          draggable={false}
        />
      );
    case "blank":
      return null;
    case "text":
      return <Lyrics text={content.text} footnote={content.footnote} typography={typography} />;
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element -- signed URLs, preloaded by the screen
        <img
          className="absolute inset-0 size-full object-contain"
          src={resolve(content.id, content.url)}
          alt=""
          decoding="async"
          draggable={false}
        />
      );
    case "video":
      return playsVideo ? (
        <Video content={content} onVideoTime={onVideoTime} />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          {/* A still frame: only the metadata and the first frame load. */}
          <video
            className="absolute inset-0 size-full object-contain"
            src={`${resolve(content.id, content.url)}#t=0.5`}
            muted
            playsInline
            preload="metadata"
            tabIndex={-1}
          />
          <span className="relative grid size-[13cqw] place-items-center rounded-full bg-black/40 ring-1 ring-white/30 backdrop-blur-sm">
            <span className="ml-[1cqw] border-y-[2.4cqw] border-l-[3.8cqw] border-y-transparent border-l-white" />
          </span>
        </div>
      );
  }
}

/** Shrinks the lyrics (down to half) when a long slide would not fit the screen. */
function Lyrics({
  text,
  footnote,
  typography,
}: {
  text: string;
  footnote: string | null;
  typography: ProjectionTypography;
}) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const sizes = lyricSizes(typography);

  useLayoutEffect(() => {
    const outer = box.current;
    const content = inner.current;
    if (!outer || !content) return;
    const fit = () => {
      content.style.setProperty("--fit", "1");
      const room = outer.clientHeight;
      const needed = content.scrollHeight;
      setScale(needed > room && needed > 0 ? Math.max(0.5, room / needed) : 1);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(outer);
    return () => observer.disconnect();
  }, [text, footnote, sizes.body]);

  return (
    <div
      ref={box}
      className="absolute inset-[7cqw] flex flex-col items-center justify-center text-center text-white [text-shadow:0_0_1.2cqw_rgb(0_0_0/0.45)]"
      style={{
        fontFamily: fontStack(typography.fontFamily),
        fontWeight: typography.fontBold ? 700 : 500,
        fontStyle: typography.fontItalic ? "italic" : "normal",
        textTransform: typography.uppercase ? "uppercase" : "none",
      }}
    >
      <div
        ref={inner}
        className="flex flex-col items-center gap-[2.5cqw]"
        style={{ fontSize: `calc(${sizes.body} * var(--fit, 1))`, ["--fit" as string]: scale }}
      >
        <p className="leading-[1.22] whitespace-pre-line">{text}</p>
        {footnote && (
          <p
            className="font-semibold tracking-[0.3cqw] uppercase opacity-60"
            style={{ fontSize: `calc(${sizes.footnote} * var(--fit, 1))` }}
          >
            {footnote}
          </p>
        )}
      </div>
    </div>
  );
}

/** The video on screen follows the console: playing from a position at a moment, or paused there. */
function Video({
  content,
  onVideoTime,
}: {
  content: Extract<ProjectionContent, { kind: "video" }>;
  onVideoTime?: (time: VideoTime) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const resolve = useResolveFile();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const target = content.playing
      ? content.position + (Date.now() - content.at) / 1000
      : content.position;
    // Small drifts are left alone: seeking stutters.
    if (Math.abs(video.currentTime - target) > 0.6) video.currentTime = Math.max(0, target);
    if (content.playing) void video.play().catch(() => undefined);
    else video.pause();
  }, [content]);

  return (
    <video
      ref={ref}
      className="absolute inset-0 size-full bg-black object-contain"
      src={resolve(content.id, content.url)}
      muted
      playsInline
      preload="auto"
      onTimeUpdate={(event) =>
        onVideoTime?.({
          id: content.id,
          position: event.currentTarget.currentTime,
          duration: event.currentTarget.duration || 0,
        })
      }
    />
  );
}

/**
 * A YouTube video in YouTube's own player, without its controls, following the console like a
 * video does (playing from a position at a moment, or paused there). Muted on the screens; with
 * sound only where `audible` (the console's EN VIVO, towards the speakers).
 */
function YouTubeVideo({
  content,
  audible,
  onVideoTime,
  onVideoError,
}: {
  content: Extract<ProjectionContent, { kind: "youtube" }>;
  audible: boolean;
  onVideoTime?: (time: VideoTime) => void;
  onVideoError?: (message: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const latest = useRef({ content, audible, onVideoTime, onVideoError });
  useEffect(() => {
    latest.current = { content, audible, onVideoTime, onVideoError };
  });

  // One player per video id; the rest (play, pause, seek, sound) only commands it.
  useEffect(() => {
    let cancelled = false;
    const element = document.createElement("div");
    host.current?.append(element);
    void loadYouTube().then((YT) => {
      if (cancelled) return;
      player.current = new YT.Player(element, {
        videoId: content.id,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
          playsinline: 1,
          rel: 0,
          mute: 1,
        },
        events: {
          onReady: () => {
            if (!cancelled) setIsReady(true);
          },
          // YouTube turns subtitles on by itself when a muted video starts (as on the screens);
          // the module only exists once it plays, so they are set again each time it does.
          onStateChange: (event) => {
            if (event.data === PLAYING)
              applyCaptions(player.current, latest.current.content.captions);
          },
          onError: (event) =>
            latest.current.onVideoError?.(
              isEmbedBlocked(event.data)
                ? "Este video no permite reproducirse fuera de YouTube."
                : "YouTube no pudo reproducir este video.",
            ),
        },
      });
    });
    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
      element.remove();
      setIsReady(false);
    };
  }, [content.id]);

  useEffect(() => {
    if (isReady) applyCaptions(player.current, content.captions);
  }, [content.captions, isReady]);

  // Follows the console: small drifts are left alone, seeking stutters.
  useEffect(() => {
    const yt = player.current;
    if (!yt || !isReady) return;
    if (audible) yt.unMute();
    else yt.mute();
    const target = content.playing
      ? content.position + (Date.now() - content.at) / 1000
      : content.position;
    if (Math.abs(yt.getCurrentTime() - target) > 0.8) yt.seekTo(Math.max(0, target), true);
    if (content.playing) yt.playVideo();
    else yt.pauseVideo();
  }, [content, audible, isReady]);

  // A screen keeps checking it is in step with the sound (the console's player), not only
  // when something changes: a TV that started late, or stalled, catches up by itself.
  useEffect(() => {
    if (!isReady || audible || !content.playing) return;
    let lastSeek = 0;
    const timer = setInterval(() => {
      const yt = player.current;
      if (!yt || yt.getPlayerState() !== PLAYING || Date.now() - lastSeek < RESEEK_AFTER_MS) return;
      const target = content.position + (Date.now() - content.at) / 1000;
      if (Math.abs(yt.getCurrentTime() - target) <= MAX_DRIFT_S) return;
      lastSeek = Date.now();
      // A seek takes a moment to land: aim a little ahead.
      yt.seekTo(target + SEEK_LEAD_S, true);
    }, CHECK_DRIFT_MS);
    return () => clearInterval(timer);
  }, [content, audible, isReady]);

  // Where it really is, for the console's player (its length only YouTube knows).
  const reportsTime = onVideoTime !== undefined;
  useEffect(() => {
    if (!isReady || !reportsTime) return;
    const timer = setInterval(() => {
      const yt = player.current;
      if (!yt) return;
      latest.current.onVideoTime?.({
        id: latest.current.content.id,
        position: yt.getCurrentTime(),
        duration: yt.getDuration(),
      });
    }, 500);
    return () => clearInterval(timer);
  }, [isReady, reportsTime]);

  return (
    <div
      ref={host}
      className="pointer-events-none absolute inset-0 bg-black [&_iframe]:size-full"
    />
  );
}

/** `YT.PlayerState.PLAYING`. */
const PLAYING = 1;
/** Screens: how often they check, how far behind or ahead is fine, and the pause after a seek. */
const CHECK_DRIFT_MS = 1000;
const MAX_DRIFT_S = 0.1;
const RESEEK_AFTER_MS = 3000;
const SEEK_LEAD_S = 0.05;

function applyCaptions(player: YouTubePlayer | null, captions: boolean) {
  if (!player) return;
  if (captions) player.loadModule("captions");
  else player.unloadModule("captions");
}
