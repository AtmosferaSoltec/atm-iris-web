"use server";

import { revalidatePath } from "next/cache";
import { GENERIC_ERROR, type FormState } from "@/lib/form-state";
import { idSchema } from "@/lib/validation";
import { authorize } from "@/server/dal";
import { errorMessage, toFormState } from "@/server/repositories/api/errors";
import type { BlockTemplateInput } from "@/server/repositories/types";
import {
  SERVICE_TYPE_FIELDS,
  serviceTypeDraftSchema,
  type ServiceTypeDraft,
  type ServiceTypeField,
} from "./schemas";

function revalidateServiceTypes() {
  revalidatePath("/servicios", "layout");
  revalidatePath("/");
}

/** Creates (`draft.id` null) or replaces a service type. */
export async function saveServiceType(
  draft: ServiceTypeDraft,
): Promise<FormState<ServiceTypeField>> {
  const parsed = serviceTypeDraftSchema.safeParse(draft);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    if (field === "name" || (field === "blocks" && issue.path.length === 1)) {
      return { status: "error", fieldErrors: { [field]: issue.message } };
    }
    return { status: "error", message: issue?.message ?? GENERIC_ERROR };
  }
  const data = parsed.data;

  try {
    const { repos } = await authorize();
    const [existing, church] = await Promise.all([
      data.id ? repos.serviceTypes.get(data.id) : Promise.resolve(null),
      repos.church.get(),
    ]);
    if (data.id && !existing) {
      return { status: "error", message: "Este servicio ya no existe. Vuelve a la lista." };
    }

    // Blocks that already existed keep their id; new ones get one from the API (contract §9).
    const existingIds = new Set(existing?.blocks.map((block) => block.id));
    const edited: BlockTemplateInput[] = (data.tracksTime ? data.blocks : []).map((block) => ({
      ...(existingIds.has(block.id) && { id: block.id }),
      name: block.name,
      plannedMinutes: block.plannedMinutes,
    }));
    const input = {
      name: data.name,
      color: data.color,
      schedule: data.schedule,
      // With the time module off the editor hides blocks; send the saved ones back
      // untouched so the PUT doesn't delete them.
      blocks: church.modules.timeControl ? edited : (existing?.blocks ?? []),
    };

    if (existing) await repos.serviceTypes.update(existing.id, input);
    else await repos.serviceTypes.create(input);
  } catch (error) {
    return toFormState(error, SERVICE_TYPE_FIELDS, {
      codes: { SERVICE_TYPE_NAME_TAKEN: "name" },
    });
  }

  revalidateServiceTypes();
  return { status: "success" };
}

export async function deleteServiceType(id: string): Promise<{ error?: string }> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: GENERIC_ERROR };
  try {
    const { repos } = await authorize();
    await repos.serviceTypes.delete(parsed.data);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidateServiceTypes();
  return {};
}
