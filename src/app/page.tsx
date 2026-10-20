import type { Metadata } from "next";
import { LiveConsole } from "@/features/console/components/live-console";
import { loadConsole } from "@/features/console/load";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Servicio en vivo" };

/** The live console on the computer: drives every `/display` open in this browser. */
export default async function ConsolePage() {
  const { session, repos } = await requireSession();
  return <LiveConsole data={await loadConsole(repos)} session={session} />;
}
