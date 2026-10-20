"use client";

import type { ProjectionFrame } from "./model";

// How the console and the screens talk. Today both run in the same browser (a second
// window on screen 2/3), so they use a BroadcastChannel: instant, no server, no internet.
// Remote screens (a Smart TV, the iPad as controller) will plug another transport into the
// same messages.

/** Console → screens. */
export type ConsoleMessage =
  | { type: "frame"; seq: number; frame: ProjectionFrame }
  /** Files coming up (backgrounds, the service's images and videos): warm them before they show. */
  | { type: "preload"; files: PreloadFile[] };

/**
 * A file the screens keep ready, by media id (its signed URL changes every hour; the
 * file does not). Images and background videos are kept whole in memory; the service's
 * videos (bigger) are buffered by the browser.
 */
export type PreloadFile = { id: string; url: string; kind: "image" | "backgroundVideo" | "video" };

/** Screens → console. */
export type ScreenMessage =
  | { type: "hello"; screenId: string }
  | { type: "alive"; screenId: string; width: number; height: number; ready: string[] }
  /** The media ids this screen already has ready, sent whenever that changes. */
  | { type: "files"; screenId: string; ready: string[] }
  | { type: "bye"; screenId: string }
  /** Where the video on screen really is, for the console's player. */
  | { type: "videoTime"; screenId: string; id: string; position: number; duration: number };

export type ProjectionChannel<Send, Receive> = {
  send(message: Send): void;
  /** Returns the unsubscribe function. */
  listen(onMessage: (message: Receive) => void): () => void;
  close(): void;
};

function broadcast<Send, Receive>(churchId: string): ProjectionChannel<Send, Receive> {
  const channel = new BroadcastChannel(`iris-projection:${churchId}`);
  return {
    send: (message) => channel.postMessage(message),
    listen(onMessage) {
      const handler = (event: MessageEvent<Receive>) => onMessage(event.data);
      channel.addEventListener("message", handler);
      return () => channel.removeEventListener("message", handler);
    },
    close: () => channel.close(),
  };
}

export const consoleChannel = (churchId: string) =>
  broadcast<ConsoleMessage, ScreenMessage>(churchId);
export const screenChannel = (churchId: string) =>
  broadcast<ScreenMessage, ConsoleMessage>(churchId);
