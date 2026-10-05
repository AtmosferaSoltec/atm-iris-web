import { MailX } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { InvitationPreview } from "@/domain/models";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AcceptInvitationForm } from "@/features/team/components/accept-invitation-form";
import { getRepositories } from "@/server/repositories";
import { isApiError } from "@/server/repositories/api/errors";

export const metadata: Metadata = { title: "Invitación" };

/** Unknown, expired, revoked or used tokens all look the same to the visitor. */
const INVALID = new Set(["INVITATION_INVALID", "VALIDATION_FAILED", "NOT_FOUND"]);

async function lookup(token: string): Promise<InvitationPreview | null> {
  if (!token) return null;
  try {
    return await getRepositories().team.lookupInvitation(token);
  } catch (error) {
    if (isApiError(error) && INVALID.has(error.code)) return null;
    throw error;
  }
}

export default async function InvitationPage({ searchParams }: PageProps<"/invitacion">) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const preview = await lookup(value);

  return (
    <AuthCard>
      {preview ? (
        <AcceptInvitationForm token={value} preview={preview} />
      ) : (
        <EmptyState
          icon={<MailX />}
          title="Esta invitación ya no es válida"
          description="Pídele a quien te invitó que te envíe otra."
          action={
            <ButtonLink href="/login" variant="secondary">
              Ir al inicio de sesión
            </ButtonLink>
          }
          className="py-6"
        />
      )}
    </AuthCard>
  );
}
