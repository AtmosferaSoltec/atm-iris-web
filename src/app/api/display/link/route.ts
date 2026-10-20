import { NextResponse } from "next/server";
import { displayToken, forgetDisplay } from "@/server/display-cookies";

// Whether this browser is a linked TV; DELETE forgets the link (after "bye").

export async function GET() {
  return NextResponse.json({ linked: (await displayToken()) !== null });
}

export async function DELETE() {
  await forgetDisplay();
  return new NextResponse(null, { status: 204 });
}
