import "server-only";
import { headers } from "next/headers";
import { env } from "../../env";

/** atm-iris-api error contract: `code` is stable English, `message` is Spanish for the screen. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly errors?: Record<string, string>,
  ) {
    super(message);
  }
}

const NETWORK_MESSAGE = "No pudimos conectarnos. Verifica tu conexión a internet.";
const GENERIC_MESSAGE = "Algo salió mal. Inténtalo de nuevo.";

type ClientOptions = {
  accessToken?: string;
  /** The visitor's X-Forwarded-For. Read from the incoming request when omitted. */
  forwardedFor?: string;
};

type RequestInit = { method?: string; body?: unknown };

export type ApiClient = <T>(path: string, init?: RequestInit) => Promise<T>;

/**
 * JSON client for atm-iris-api. Unwraps `{ data }` and throws ApiError for any
 * failure, so callers only deal with the happy path or one error type.
 */
export function createApiClient({ accessToken, forwardedFor }: ClientOptions = {}): ApiClient {
  return async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    // The API rate-limits sign-in per IP. Without the visitor's address, every
    // request would look like it came from this server and five typos from
    // anyone would lock everybody out.
    const clientIp = forwardedFor ?? (await incomingForwardedFor());

    let response: Response;
    try {
      response = await fetch(`${env.API_URL}${path}`, {
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

    if (response.status === 204) return undefined as T;

    const payload = (await response.json().catch(() => null)) as {
      data?: T;
      code?: string;
      message?: string;
      errors?: Record<string, string>;
    } | null;

    if (!response.ok) {
      throw new ApiError(
        response.status,
        payload?.code ?? "INTERNAL_ERROR",
        response.status >= 500 ? GENERIC_MESSAGE : (payload?.message ?? GENERIC_MESSAGE),
        payload?.errors,
      );
    }

    return payload?.data as T;
  };
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
