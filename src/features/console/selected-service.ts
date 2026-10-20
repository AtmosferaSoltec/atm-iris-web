import "server-only";
import { cookies } from "next/headers";

/**
 * The service chosen in the console, before (or without) starting its blocks: it survives a
 * reload, a closed tab or a trip to Inicio until the service is finished. Once it starts, the
 * record in progress (contract §14) is what keeps it.
 */
import { SELECTED_SERVICE_COOKIE as COOKIE } from "./selected-service-cookie";

export async function selectedServiceTypeId(churchId: string): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  const [church, typeId] = value?.split(":") ?? [];
  return church === churchId && typeId ? typeId : null;
}
