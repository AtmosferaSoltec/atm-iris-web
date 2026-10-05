import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/session-token";

// The session died while a page was rendering (pages can't write cookies, see
// src/server/dal.ts). Clear it here and go to the login, or proxy.ts would
// bounce the visitor back from /login with the dead cookie.
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
