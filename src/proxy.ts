import { NextResponse, type NextRequest } from "next/server";
import { apiAuth } from "@/server/repositories/api/auth";
import { ApiError } from "@/server/repositories/api/errors";
import {
  decryptSession,
  encryptSession,
  needsRefresh,
  SESSION_COOKIE,
  sessionCookieOptions,
  type SessionPayload,
} from "@/server/session-token";

// Runs before every page and Server Action:
//   1. Sends anonymous visitors to /login and signed-in ones away from it.
//   2. Refreshes the API access token when it is about to expire, so pages and
//      actions always render with a valid one. Server Components cannot write
//      cookies, which is why the refresh lives here.
// The Data Access Layer (src/server/dal.ts) still checks the session next to
// every read and mutation.

/** Only for visitors without a session. */
const GUEST_PATHS = ["/login", "/recuperar"];
/** Open to everyone: an invitation may be for another account than the one signed in. */
const OPEN_PATHS = ["/invitacion"];
const SESSION_OVER = new Set(["INVALID_REFRESH_TOKEN", "UNAUTHORIZED", "VALIDATION_FAILED"]);

const matches = (pathname: string, paths: string[]) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isGuestOnly = matches(pathname, GUEST_PATHS);
  const isOpen = matches(pathname, OPEN_PATHS);
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    return isGuestOnly || isOpen ? NextResponse.next() : redirectTo("/login", request);
  }
  if (isGuestOnly) return redirectTo("/", request);

  if (!needsRefresh(session)) return NextResponse.next();

  const refreshed = await refresh(session, request);
  if (refreshed === "expired") {
    const response = isOpen ? NextResponse.next() : redirectTo("/login", request);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  // API unreachable: let the request through; the page shows its error state
  // and the next request tries again.
  if (refreshed === "unavailable") return NextResponse.next();

  const cookie = await encryptSession(refreshed);

  // The new cookie goes both to the page being rendered (request) and to the
  // browser (response).
  request.cookies.set(SESSION_COOKIE, cookie);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(SESSION_COOKIE, cookie, sessionCookieOptions(refreshed));
  return response;
}

async function refresh(
  session: SessionPayload,
  request: NextRequest,
): Promise<SessionPayload | "expired" | "unavailable"> {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for") ?? undefined;
    const result = await apiAuth({ forwardedFor }).refresh(session.tokens!.refreshToken);
    return { ...result.session, tokens: result.tokens };
  } catch (error) {
    // Only a rejected refresh token ends the session. A 5xx or a network
    // blip must not sign anyone out in the middle of preparing a service.
    return error instanceof ApiError && SESSION_OVER.has(error.code) ? "expired" : "unavailable";
  }
}

function redirectTo(path: string, request: NextRequest) {
  return NextResponse.redirect(new URL(path, request.url));
}

export const config = {
  // Skip API routes, Next internals and static files (anything with an extension).
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
