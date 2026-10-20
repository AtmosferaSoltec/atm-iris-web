import { NextResponse, type NextRequest } from "next/server";
import { displayStateSchema } from "@/features/console/schemas";
import { authorize } from "@/server/dal";
import { errorMessage } from "@/server/repositories/api/errors";

// The console's frame and files, on to the church's TVs (contract §18). A route handler and
// not a Server Action: actions run one at a time, and this must never wait behind another.

export async function PUT(request: NextRequest) {
  const parsed = displayStateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos." }, { status: 400 });
  try {
    const { repos } = await authorize();
    await repos.displays.publish(parsed.data);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 502 });
  }
}
