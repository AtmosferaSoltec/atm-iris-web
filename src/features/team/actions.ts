"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@/domain/models";
import { fieldErrorsFrom, formValues, GENERIC_ERROR, type FormState } from "@/lib/form-state";
import { authorize } from "@/server/dal";
import { getRepositories } from "@/server/repositories";
import { errorMessage, toFormState } from "@/server/repositories/api/errors";
import { getSession, startSession } from "@/server/session";
import {
  ACCEPT_FIELDS,
  acceptInvitationSchema,
  INVITE_FIELDS,
  invitationTokenSchema,
  inviteSchema,
  memberIdSchema,
  roleSchema,
  type AcceptField,
  type InviteField,
} from "./schemas";

type Result = { error?: string };

export async function inviteMember(
  _prev: FormState<InviteField>,
  formData: FormData,
): Promise<FormState<InviteField>> {
  const values = formValues(formData, INVITE_FIELDS);
  const parsed = inviteSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }
  try {
    const { repos } = await authorize("members.manage");
    await repos.team.invite(parsed.data);
  } catch (error) {
    return toFormState(error, INVITE_FIELDS, { values, codes: { ALREADY_MEMBER: "email" } });
  }
  revalidatePath("/equipo");
  return { status: "success", values: { email: parsed.data.email } };
}

/** Runs one team mutation with the shared checks and refreshes the page. */
async function teamMutation(
  rawId: string,
  run: (id: string, repos: Awaited<ReturnType<typeof authorize>>["repos"]) => Promise<unknown>,
): Promise<Result> {
  const id = memberIdSchema.safeParse(rawId);
  if (!id.success) return { error: GENERIC_ERROR };
  try {
    const { repos } = await authorize("members.manage");
    await run(id.data, repos);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/equipo");
  return {};
}

export async function changeMemberRole(id: string, rawRole: Role): Promise<Result> {
  const role = roleSchema.safeParse(rawRole);
  if (!role.success) return { error: GENERIC_ERROR };
  return teamMutation(id, (memberId, repos) => repos.team.updateMemberRole(memberId, role.data));
}

export async function removeMember(id: string): Promise<Result> {
  return teamMutation(id, (memberId, repos) => repos.team.removeMember(memberId));
}

export async function resendInvitation(id: string): Promise<Result> {
  return teamMutation(id, (invitationId, repos) => repos.team.resendInvitation(invitationId));
}

export async function revokeInvitation(id: string): Promise<Result> {
  return teamMutation(id, (invitationId, repos) => repos.team.revokeInvitation(invitationId));
}

/**
 * Public: joins the church and signs this browser into it. A session that was
 * open here (maybe another account) is closed first.
 */
export async function acceptInvitation(
  rawToken: string,
  hasAccount: boolean,
  _prev: FormState<AcceptField>,
  formData: FormData,
): Promise<FormState<AcceptField>> {
  const values = formValues(formData, ACCEPT_FIELDS);
  const kept = { fullName: values.fullName };
  const token = invitationTokenSchema.safeParse(rawToken);
  const parsed = acceptInvitationSchema(hasAccount).safeParse(values);
  if (!token.success) return { status: "error", message: GENERIC_ERROR };
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: kept };
  }

  try {
    const result = await getRepositories().team.acceptInvitation({
      token: token.data,
      ...parsed.data,
    });
    const previous = await getSession();
    if (previous) {
      await getRepositories({ session: previous, accessToken: previous.tokens?.accessToken })
        .auth.signOut()
        .catch(() => undefined);
    }
    await startSession(result);
  } catch (error) {
    return toFormState(error, ACCEPT_FIELDS, {
      values: kept,
      codes: { INVALID_CREDENTIALS: "password" },
    });
  }
  revalidatePath("/", "layout");
  return { status: "success" };
}
