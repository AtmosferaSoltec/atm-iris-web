"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ChurchModules } from "@/domain/models";
import { GENERIC_ERROR } from "@/lib/form-state";
import { authorize } from "@/server/dal";

const modulesSchema = z.object({
  bible: z.boolean(),
  multimedia: z.boolean(),
  timeControl: z.boolean(),
});

export async function saveModules(modules: ChurchModules): Promise<{ error?: string }> {
  const { repos } = await authorize();
  const parsed = modulesSchema.safeParse(modules);
  if (!parsed.success) return { error: GENERIC_ERROR };
  try {
    await repos.modules.save(parsed.data);
  } catch (error) {
    console.error(error);
    return { error: GENERIC_ERROR };
  }
  // Navigation and every screen depend on the modules.
  revalidatePath("/", "layout");
  return {};
}
