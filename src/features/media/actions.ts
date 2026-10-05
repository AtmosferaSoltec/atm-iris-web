"use server";

import { revalidatePath } from "next/cache";
import type { MediaAsset, UploadTicket } from "@/domain/models";
import { fieldErrorsFrom, formValues, GENERIC_ERROR, type FormState } from "@/lib/form-state";
import { authorize } from "@/server/dal";
import { errorMessage, toFormState } from "@/server/repositories/api/errors";
import type { ConfirmUploadInput, CreateUploadInput } from "@/server/repositories/types";
import {
  confirmUploadSchema,
  MEDIA_FIELDS,
  mediaDetailsSchema,
  mediaIdSchema,
  uploadRequestSchema,
  type MediaField,
} from "./schemas";

// The bytes never pass through here: the browser PUTs them to the signed URL
// of the ticket (contract §11). These actions only ask for it and confirm it.

function revalidateMedia() {
  revalidatePath("/multimedia");
  revalidatePath("/ajustes");
  revalidatePath("/");
}

export async function requestUpload(
  input: CreateUploadInput,
): Promise<{ ticket?: UploadTicket; error?: string }> {
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) return { error: GENERIC_ERROR };
  try {
    const { repos } = await authorize("media.manage");
    return { ticket: await repos.media.createUpload(parsed.data) };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function confirmUpload(
  input: ConfirmUploadInput,
): Promise<{ asset?: MediaAsset; error?: string }> {
  const parsed = confirmUploadSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  try {
    const { repos } = await authorize("media.manage");
    const asset = await repos.media.confirm(parsed.data);
    revalidateMedia();
    return { asset };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function updateMediaDetails(
  id: string,
  _prev: FormState<MediaField>,
  formData: FormData,
): Promise<FormState<MediaField>> {
  const values = formValues(formData, MEDIA_FIELDS);
  const mediaId = mediaIdSchema.safeParse(id);
  const parsed = mediaDetailsSchema.safeParse(values);
  if (!mediaId.success) return { status: "error", message: GENERIC_ERROR, values };
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }
  try {
    const { repos } = await authorize("media.manage");
    await repos.media.update(mediaId.data, parsed.data);
  } catch (error) {
    return toFormState(error, MEDIA_FIELDS, { values });
  }
  revalidateMedia();
  return { status: "success", values };
}

export async function setMediaBackground(
  id: string,
  isBackground: boolean,
): Promise<{ error?: string }> {
  const mediaId = mediaIdSchema.safeParse(id);
  if (!mediaId.success) return { error: GENERIC_ERROR };
  try {
    const { repos } = await authorize("media.manage");
    await repos.media.update(mediaId.data, { isBackground: Boolean(isBackground) });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidateMedia();
  return {};
}

export async function deleteMedia(id: string): Promise<{ error?: string }> {
  const mediaId = mediaIdSchema.safeParse(id);
  if (!mediaId.success) return { error: GENERIC_ERROR };
  try {
    const { repos } = await authorize("media.manage");
    await repos.media.delete(mediaId.data);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidateMedia();
  return {};
}
