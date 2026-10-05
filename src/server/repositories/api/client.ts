import "server-only";
import { headers } from "next/headers";
import type { Paginated } from "@/domain/models";
import { env } from "../../env";
import { ApiError, NETWORK_MESSAGE } from "./errors";

export { ApiError } from "./errors";

const GENERIC_MESSAGE = "Algo salió mal. Inténtalo de nuevo.";

export type ClientOptions = {
  accessToken?: string;
  /** The visitor's X-Forwarded-For. Read from the incoming request when omitted. */
  forwardedFor?: string;
  /**
   * Called when a call made with `accessToken` answers 401 UNAUTHORIZED: the
   * session died between proxy.ts and this call. It is expected to redirect.
   */
  onUnauthorized?: () => Promise<never>;
};

type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  method?: string;
  body?: unknown;
  /** Empty values (undefined, null, "") are left out. */
  query?: Record<string, QueryValue>;
};

export type ApiClient = {
  /** Unwraps `{ data }`. */
  <T>(path: string, init?: RequestOptions): Promise<T>;
  /** Paginated lists keep `{ data, meta }`. */
  page<T>(path: string, init?: RequestOptions): Promise<Paginated<T>>;
};

type Envelope<T> = {
  data?: T;
  meta?: Paginated<unknown>["meta"];
  code?: string;
  message?: string;
  errors?: Record<string, string>;
};

/** JSON client for atm-iris-api. Throws ApiError for any failure. */
export function createApiClient({
  accessToken,
  forwardedFor,
  onUnauthorized,
}: ClientOptions = {}): ApiClient {
  async function send<T>(path: string, init: RequestOptions): Promise<Envelope<T> | null> {
    // The API rate-limits sign-in per IP. Without the visitor's address, every
    // request would look like it came from this server and five typos from
    // anyone would lock everybody out.
    const clientIp = forwardedFor ?? (await incomingForwardedFor());

    let response: Response;
    try {
      response = await fetch(`${env.API_URL}${path}${queryString(init.query)}`, {
        method: init.method ?? "GET",
        headers: {
          Accept: "application/json",
          ...(init.body !== undefined && { "Content-Type": "application/json" }),
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          ...(clientIp && { "X-Forwarded-For": clientIp }),
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        cache: "no-store",
      });
    } catch {
      throw new ApiError(0, "NETWORK", NETWORK_MESSAGE);
    }

    if (response.status === 204) return null;

    const payload = (await response.json().catch(() => null)) as Envelope<T> | null;

    if (!response.ok) {
      const code = payload?.code ?? "INTERNAL_ERROR";
      if (response.status === 401 && code === "UNAUTHORIZED" && accessToken && onUnauthorized) {
        await onUnauthorized();
      }
      throw new ApiError(
        response.status,
        code,
        response.status >= 500 ? GENERIC_MESSAGE : (payload?.message ?? GENERIC_MESSAGE),
        payload?.errors,
      );
    }
    return payload;
  }

  const request = async <T>(path: string, init: RequestOptions = {}): Promise<T> =>
    (await send<T>(path, init))?.data as T;

  const page = async <T>(path: string, init: RequestOptions = {}): Promise<Paginated<T>> => {
    const payload = await send<T[]>(path, init);
    const data = payload?.data ?? [];
    return {
      data,
      meta: payload?.meta ?? { page: 1, limit: data.length, total: data.length, totalPages: 1 },
    };
  };

  return Object.assign(request, { page });
}

export function queryString(query: Record<string, QueryValue> | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

async function incomingForwardedFor(): Promise<string | undefined> {
  try {
    const incoming = await headers();
    return incoming.get("x-forwarded-for") ?? incoming.get("x-real-ip") ?? undefined;
  } catch {
    // Outside a request (e.g. proxy.ts passes it explicitly).
    return undefined;
  }
}

/** `GET` that answers null on 404 (a missing or foreign resource, contract §1.2). */
export async function orNull<T>(call: Promise<T>): Promise<T | null> {
  try {
    return await call;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export const segment = encodeURIComponent;
