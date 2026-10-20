"use server";

import type { ProjectionTypography } from "@/features/projection/model";
import { authorize } from "@/server/dal";
import { errorMessage } from "@/server/repositories/api/errors";
import { typographySchema } from "./schemas";

/** Keeps the lyrics' look for the church: every console and screen uses it next time. */
export async function saveTypography(input: ProjectionTypography): Promise<{ error?: string }> {
  const parsed = typographySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  try {
    const { repos } = await authorize();
    const church = await repos.church.get();
    await repos.church.setProjection({ ...church.projection, ...parsed.data });
    return {};
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
