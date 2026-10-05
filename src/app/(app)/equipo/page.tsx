import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { PermissionGate } from "@/components/ui/permission-gate";
import { InvitationList } from "@/features/team/components/invitation-list";
import { InviteButton } from "@/features/team/components/invite-dialog";
import { MemberList } from "@/features/team/components/member-list";
import { RolesPopover } from "@/features/team/components/roles-popover";
import { can } from "@/lib/permissions";
import { plural } from "@/lib/text";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Equipo" };

export default async function TeamPage() {
  const { session, repos } = await requireSession();
  const canManage = can(session, "members.manage");
  const [members, invitations] = await Promise.all([
    repos.team.listMembers(),
    // Pending invitations are only visible to whoever can manage them (contract §7).
    canManage ? repos.team.listInvitations() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto flex max-w-settings flex-col gap-8">
      <PageHeader
        title="Equipo"
        titleAccessory={<RolesPopover />}
        description={`Quienes pueden entrar a ${session.church.name} y qué pueden hacer.`}
        actions={
          <PermissionGate session={session} permission="members.manage">
            <InviteButton />
          </PermissionGate>
        }
      />
      <Panel title="Miembros" description={plural(members.length, "persona", "personas")}>
        <MemberList members={members} actorRole={session.role} canManage={canManage} />
      </Panel>
      {canManage && (
        <Panel title="Invitaciones pendientes">
          <InvitationList invitations={invitations} timeZone={session.church.timezone} />
        </Panel>
      )}
    </div>
  );
}
