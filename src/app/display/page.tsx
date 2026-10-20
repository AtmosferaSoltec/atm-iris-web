import type { Metadata } from "next";
import { DisplayRoot } from "@/features/projection/components/display-root";
import { displayToken } from "@/server/display-cookies";
import { getSession } from "@/server/session";

export const metadata: Metadata = { title: "Pantalla" };

/**
 * The room's screen: only the projection, driven by the console. A linked TV hears it over
 * the internet; a window on screen 2/3 of the console's computer, in the same browser; any
 * other screen shows a code to link it (contract §18). Public: a TV has no session.
 */
export default async function DisplayPage() {
  const [session, token] = await Promise.all([getSession(), displayToken()]);
  return <DisplayRoot churchId={session?.church.id ?? null} isLinked={token !== null} />;
}
