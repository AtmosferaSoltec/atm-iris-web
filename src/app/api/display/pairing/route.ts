import { NextResponse } from "next/server";
import {
  clearPendingPairing,
  pendingPairing,
  saveDisplayToken,
  savePendingPairing,
} from "@/server/display-cookies";
import { getDisplayLink } from "@/server/repositories";

// The TV links itself (contract §18): POST asks for a code to show, GET asks whether
// someone already typed it in a console. The secret stays in an httpOnly cookie.

export async function POST() {
  try {
    const pairing = await getDisplayLink().startPairing();
    await savePendingPairing(pairing.id, pairing.secret);
    return NextResponse.json({ code: pairing.code, expiresAt: pairing.expiresAt });
  } catch {
    return NextResponse.json({ error: "No pudimos conectar con Iris." }, { status: 503 });
  }
}

export async function GET() {
  const pending = await pendingPairing();
  if (!pending) return NextResponse.json({ status: "expired" });
  try {
    const status = await getDisplayLink().pairingStatus(pending.id, pending.secret);
    if (!status) {
      await clearPendingPairing();
      return NextResponse.json({ status: "expired" });
    }
    if (status.status === "pending") return NextResponse.json({ status: "pending" });
    await saveDisplayToken(status.token);
    await clearPendingPairing();
    return NextResponse.json({ status: "paired", name: status.display.name });
  } catch {
    // A network blip: the TV asks again in a moment.
    return NextResponse.json({ status: "pending" });
  }
}
