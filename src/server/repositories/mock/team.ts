import type { Member, Role, UserSession } from "@/domain/models";
import { canManageMember } from "@/lib/permissions";
import { compareNames } from "@/lib/text";
import { ApiError } from "../api/errors";
import type { TeamRepository } from "../types";
import { startMockSession } from "./auth";
import {
  churchOf,
  clone,
  delay,
  mockWorld,
  notFound,
  now,
  requirePermission,
  type ChurchData,
  type MockInvitation,
} from "./world";

const INVITATION_DAYS = 7;

const lastOwner = () =>
  new ApiError(409, "LAST_OWNER", "La iglesia necesita al menos un dueño. Asigna otro antes.");
const forbidden = () =>
  new ApiError(403, "FORBIDDEN", "Solo un dueño puede asignar, cambiar o quitar a un dueño.");
const invitationInvalid = () =>
  new ApiError(400, "INVITATION_INVALID", "Esta invitación ya no es válida.");

function toMember(
  data: ChurchData,
  membership: ChurchData["members"][number],
  session: UserSession,
): Member {
  const user = mockWorld().users.find((candidate) => candidate.id === membership.userId)!;
  return {
    id: membership.id,
    user: { id: user.id, email: user.email, fullName: user.fullName },
    role: membership.role,
    joinedAt: membership.joinedAt,
    isCurrentUser: user.id === session.userId,
  };
}

function publicInvitation({ churchId: _churchId, token: _token, ...invitation }: MockInvitation) {
  return clone(invitation);
}

function findValidInvitation(token: string): { data: ChurchData; invitation: MockInvitation } {
  for (const data of mockWorld().churches) {
    const invitation = data.invitations.find((candidate) => candidate.token === token);
    if (invitation && new Date(invitation.expiresAt).getTime() > Date.now()) {
      return { data, invitation };
    }
  }
  throw invitationInvalid();
}

function newToken(): string {
  return crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
}

function expiry(): string {
  return new Date(Date.now() + INVITATION_DAYS * 86_400_000).toISOString();
}

export function mockTeam(session?: UserSession): TeamRepository {
  /** Contract §7 rules for changing `targetRole` into `nextRole` (null = removing). */
  function checkChange(data: ChurchData, targetRole: Role, nextRole: Role | null) {
    requirePermission(session, "members.manage");
    if (
      !canManageMember(session!.role, targetRole) ||
      (nextRole === "owner" && session!.role !== "owner")
    ) {
      throw forbidden();
    }
    const owners = data.members.filter((member) => member.role === "owner").length;
    if (targetRole === "owner" && nextRole !== "owner" && owners === 1) throw lastOwner();
  }

  return {
    async listMembers() {
      await delay();
      const data = churchOf(session);
      return data.members
        .map((membership) => toMember(data, membership, session!))
        .sort((a, b) => compareNames(a.user.fullName, b.user.fullName));
    },

    async updateMemberRole(id, role) {
      await delay();
      const data = churchOf(session);
      const membership = data.members.find((member) => member.id === id);
      if (!membership) throw notFound();
      checkChange(data, membership.role, role);
      membership.role = role;
      return toMember(data, membership, session!);
    },

    async removeMember(id) {
      await delay();
      const data = churchOf(session);
      const membership = data.members.find((member) => member.id === id);
      if (!membership) throw notFound();
      checkChange(data, membership.role, null);
      data.members = data.members.filter((member) => member.id !== id);
    },

    async listInvitations() {
      await delay();
      requirePermission(session, "members.manage");
      const data = churchOf(session);
      return data.invitations
        .filter((invitation) => new Date(invitation.expiresAt).getTime() > Date.now())
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(publicInvitation);
    },

    async invite({ email, role }) {
      await delay();
      requirePermission(session, "members.manage");
      if (role === "owner" && session!.role !== "owner") throw forbidden();
      const world = mockWorld();
      const data = churchOf(session);
      const user = world.users.find((candidate) => candidate.email === email);
      if (user && data.members.some((member) => member.userId === user.id)) {
        throw new ApiError(409, "ALREADY_MEMBER", "Esa persona ya es parte del equipo.", {
          email: "Esa persona ya es parte del equipo.",
        });
      }
      const inviter = world.users.find((candidate) => candidate.id === session!.userId);
      const invitation: MockInvitation = {
        id: crypto.randomUUID(),
        churchId: data.church.id,
        token: newToken(),
        email,
        role,
        invitedBy: { id: session!.userId, fullName: inviter?.fullName ?? session!.fullName },
        createdAt: now(),
        expiresAt: expiry(),
      };
      // Inviting someone with a pending invitation replaces it.
      data.invitations = [
        ...data.invitations.filter((pending) => pending.email !== email),
        invitation,
      ];
      console.info(`[team mock] Invitación para ${email}: /invitacion?token=${invitation.token}`);
      return publicInvitation(invitation);
    },

    async resendInvitation(id) {
      await delay();
      requirePermission(session, "members.manage");
      const invitation = churchOf(session).invitations.find((candidate) => candidate.id === id);
      if (!invitation) throw notFound();
      invitation.token = newToken();
      invitation.expiresAt = expiry();
      console.info(`[team mock] Invitación reenviada: /invitacion?token=${invitation.token}`);
      return publicInvitation(invitation);
    },

    async revokeInvitation(id) {
      await delay();
      requirePermission(session, "members.manage");
      const data = churchOf(session);
      if (!data.invitations.some((invitation) => invitation.id === id)) throw notFound();
      data.invitations = data.invitations.filter((invitation) => invitation.id !== id);
    },

    async lookupInvitation(token) {
      await delay();
      const { data, invitation } = findValidInvitation(token);
      return {
        churchName: data.church.name,
        email: invitation.email,
        role: invitation.role,
        invitedByName: invitation.invitedBy.fullName,
        expiresAt: invitation.expiresAt,
        hasAccount: mockWorld().users.some((user) => user.email === invitation.email),
      };
    },

    async acceptInvitation({ token, fullName, password }) {
      await delay();
      const world = mockWorld();
      const { data, invitation } = findValidInvitation(token);
      let user = world.users.find((candidate) => candidate.email === invitation.email);
      if (user) {
        if (user.password !== password) {
          throw new ApiError(400, "INVALID_CREDENTIALS", "La contraseña no es correcta.", {
            password: "La contraseña no es correcta.",
          });
        }
      } else {
        if (!fullName) {
          throw new ApiError(400, "VALIDATION_FAILED", "Escribe tu nombre.", {
            fullName: "Escribe tu nombre.",
          });
        }
        user = { id: crypto.randomUUID(), email: invitation.email, fullName, password };
        world.users.push(user);
      }
      if (!data.members.some((member) => member.userId === user.id)) {
        data.members.push({
          id: crypto.randomUUID(),
          userId: user.id,
          role: invitation.role,
          joinedAt: now(),
        });
      }
      data.invitations = data.invitations.filter((pending) => pending.id !== invitation.id);
      return startMockSession(world, user, data.church.id);
    },
  };
}
