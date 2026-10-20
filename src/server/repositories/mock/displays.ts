import "server-only";
import type { Display, Id, UserSession } from "@/domain/models";
import { ApiError } from "../api/errors";
import type { DisplayLink, DisplayRepository, DisplayState } from "../types";

// The API's displays (contract §18) in memory, with the same rules: a 6-letter code that
// lasts 10 minutes, a token collected once, and a live channel per church.

type MockDisplay = Display & { churchId: Id; token: string };
type Pending = {
  id: string;
  code: string;
  secret: string;
  expiresAt: number;
  result?: { token: string; display: { id: string; name: string } };
};
type Channel = {
  /** The screen that presents: only it hears the console. Without it, all of them. */
  target?: Id;
  frame?: object;
  preload?: object[];
  clock?: number;
  receivedAt?: number;
  streams: Set<{ displayId: Id; send: (event: string, data: object) => void; end: () => void }>;
};

type DisplayWorld = {
  displays: MockDisplay[];
  pairings: Map<string, Pending>;
  channels: Map<Id, Channel>;
};

const store = globalThis as typeof globalThis & { __irisMockDisplays?: DisplayWorld };
const world = (): DisplayWorld =>
  (store.__irisMockDisplays ??= { displays: [], pairings: new Map(), channels: new Map() });

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const PAIRING_TTL_MS = 10 * 60 * 1000;

function channelOf(churchId: Id): Channel {
  const channels = world().channels;
  let channel = channels.get(churchId);
  if (!channel) {
    channel = { streams: new Set() };
    channels.set(churchId, channel);
  }
  return channel;
}

function toDisplay({ churchId, token: _token, ...display }: MockDisplay): Display {
  const online = [...channelOf(churchId).streams].some((stream) => stream.displayId === display.id);
  return { ...display, online };
}

export function mockDisplays(session?: UserSession): DisplayRepository {
  const churchId = () => {
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Tu sesión expiró.");
    return session.church.id;
  };
  return {
    async list() {
      const id = churchId();
      return world()
        .displays.filter((display) => display.churchId === id)
        .map(toDisplay);
    },
    async claim(code, name) {
      const id = churchId();
      const pending = [...world().pairings.values()].find(
        (candidate) => candidate.code === code.trim().toUpperCase(),
      );
      if (!pending || pending.expiresAt < Date.now() || pending.result) {
        throw new ApiError(400, "VALIDATION_FAILED", "Revisa los datos enviados.", {
          code: "Ese código no existe o ya venció.",
        });
      }
      const display: MockDisplay = {
        id: crypto.randomUUID(),
        churchId: id,
        name: name.trim(),
        token: `dsp_${crypto.randomUUID()}`,
        online: false,
        lastSeenAt: null,
        createdAt: new Date().toISOString(),
      };
      world().displays.push(display);
      pending.result = { token: display.token, display: { id: display.id, name: display.name } };
      return toDisplay(display);
    },
    async remove(displayId) {
      const id = churchId();
      const display = world().displays.find(
        (candidate) => candidate.id === displayId && candidate.churchId === id,
      );
      if (!display) throw new ApiError(404, "NOT_FOUND", "Ese televisor no existe.");
      world().displays = world().displays.filter((candidate) => candidate !== display);
      for (const stream of channelOf(id).streams) {
        if (stream.displayId !== displayId) continue;
        stream.send("bye", {});
        stream.end();
      }
    },
    async publish({ displayId, ...state }: DisplayState) {
      const channel = channelOf(churchId());
      if (displayId !== channel.target) {
        // The screen that stops presenting goes blank; the console resends everything to the new one.
        const before = channel.target;
        channel.target = displayId;
        for (const stream of channel.streams) {
          if (stream.displayId === before) {
            stream.send("state", { frame: null, preload: [], clock: null, receivedAt: null });
          }
        }
      }
      const hears = [...channel.streams].filter(
        (stream) => !channel.target || stream.displayId === channel.target,
      );
      const times = { clock: state.clock, receivedAt: Date.now() };
      Object.assign(channel, times);
      if (state.preload) {
        channel.preload = state.preload;
        for (const stream of hears) stream.send("preload", { preload: state.preload, ...times });
      }
      if (state.frame) {
        channel.frame = state.frame;
        for (const stream of hears) stream.send("frame", { frame: state.frame, ...times });
      }
    },
  };
}

export function mockDisplayLink(): DisplayLink {
  return {
    async startPairing() {
      const code = Array.from(
        { length: 6 },
        () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
      ).join("");
      const pending: Pending = {
        id: crypto.randomUUID(),
        code,
        secret: crypto.randomUUID(),
        expiresAt: Date.now() + PAIRING_TTL_MS,
      };
      world().pairings.set(pending.id, pending);
      return { ...pending, expiresAt: new Date(pending.expiresAt).toISOString() };
    },
    async pairingStatus(id, secret) {
      const pending = world().pairings.get(id);
      if (!pending || pending.secret !== secret || pending.expiresAt < Date.now()) return null;
      if (!pending.result) return { status: "pending" };
      world().pairings.delete(id);
      return { status: "paired", ...pending.result };
    },
    async stream(token, signal) {
      const display = world().displays.find((candidate) => candidate.token === token);
      if (!display) return "unlinked";
      const channel = channelOf(display.churchId);
      const encoder = new TextEncoder();
      let entry: Channel["streams"] extends Set<infer T> ? T : never;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          const write = (text: string) => {
            try {
              controller.enqueue(encoder.encode(text));
            } catch {
              // Closed meanwhile.
            }
          };
          entry = {
            displayId: display.id,
            send: (event, data) =>
              write(`event: ${event}\ndata: ${JSON.stringify({ ...data, now: Date.now() })}\n\n`),
            end: () => {
              channel.streams.delete(entry);
              try {
                controller.close();
              } catch {
                // Already closed.
              }
            },
          };
          channel.streams.add(entry);
          display.lastSeenAt = new Date().toISOString();
          write("retry: 2000\n\n");
          const presents = !channel.target || channel.target === display.id;
          entry.send("state", {
            frame: presents ? (channel.frame ?? null) : null,
            preload: presents ? (channel.preload ?? []) : [],
            clock: channel.clock ?? null,
            receivedAt: channel.receivedAt ?? null,
          });
          signal.addEventListener("abort", () => entry.end(), { once: true });
        },
        cancel() {
          entry.end();
        },
      });
      return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
    },
  };
}
