import { NextResponse, type NextRequest } from "next/server";
import { displayToken, forgetDisplay } from "@/server/display-cookies";
import { getDisplayLink } from "@/server/repositories";

// The TV's live channel (contract §18), relayed from the API so the TV only ever talks to
// this site. A token that no longer works is forgotten: the TV goes back to its code.

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = await displayToken();
  if (!token) return NextResponse.json({ linked: false }, { status: 401 });
  try {
    const upstream = await getDisplayLink().stream(token, request.signal);
    if (upstream === "unlinked") {
      await forgetDisplay();
      return NextResponse.json({ linked: false }, { status: 401 });
    }
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        // nginx must pass each event on as it comes.
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return NextResponse.json({ error: "El canal no está disponible." }, { status: 503 });
  }
}
