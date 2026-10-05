import "server-only";
import type {
  Church,
  Invitation,
  InvitationPreview,
  MediaAsset,
  Member,
  Person,
  ServiceRecord,
  ServiceType,
  Song,
  SongSummary,
  UploadTicket,
} from "@/domain/models";
import type { DataRepositories, SongImportResult, TeamRepository } from "../types";
import { toAuthResult, WEB_CLIENT, type ApiAuthResult } from "./auth";
import { createApiClient, orNull, segment, type ClientOptions } from "./client";

// Implementation against atm-iris-api, route by route from docs/api-contract.md.

/** Contract §7. Accounts data: it follows AUTH_SOURCE (see ../index.ts). */
export function apiTeam(options: ClientOptions = {}): TeamRepository {
  const api = createApiClient(options);
  return {
    listMembers: () => api<Member[]>("/members"),
    updateMemberRole: (id, role) =>
      api<Member>(`/members/${segment(id)}`, { method: "PATCH", body: { role } }),
    removeMember: (id) => api(`/members/${segment(id)}`, { method: "DELETE" }),
    listInvitations: () => api<Invitation[]>("/invitations"),
    invite: (input) => api<Invitation>("/invitations", { method: "POST", body: input }),
    resendInvitation: (id) =>
      api<Invitation>(`/invitations/${segment(id)}/resend`, { method: "POST" }),
    revokeInvitation: (id) => api(`/invitations/${segment(id)}`, { method: "DELETE" }),
    lookupInvitation: (token) =>
      api<InvitationPreview>("/invitations/lookup", { query: { token } }),
    acceptInvitation: async (input) =>
      toAuthResult(
        await api<ApiAuthResult>("/invitations/accept", {
          method: "POST",
          body: { ...input, client: WEB_CLIENT },
        }),
      ),
  };
}

/** Contract §6, §8–§11, §14. */
export function apiDataRepositories(options: ClientOptions = {}): Omit<DataRepositories, "team"> {
  const api = createApiClient(options);

  return {
    church: {
      get: () => api<Church>("/church"),
      update: (input) => api<Church>("/church", { method: "PATCH", body: input }),
      setModules: (modules) => api<Church>("/church/modules", { method: "PUT", body: modules }),
    },
    people: {
      list: () => api<Person[]>("/people"),
      create: (name) => api<Person>("/people", { method: "POST", body: { name } }),
      rename: (id, name) =>
        api<Person>(`/people/${segment(id)}`, { method: "PATCH", body: { name } }),
      delete: (id) => api(`/people/${segment(id)}`, { method: "DELETE" }),
    },
    serviceTypes: {
      list: () => api<ServiceType[]>("/service-types"),
      get: (id) => orNull(api<ServiceType>(`/service-types/${segment(id)}`)),
      create: (input) => api<ServiceType>("/service-types", { method: "POST", body: input }),
      update: (id, input) =>
        api<ServiceType>(`/service-types/${segment(id)}`, { method: "PUT", body: input }),
      delete: (id) => api(`/service-types/${segment(id)}`, { method: "DELETE" }),
    },
    songs: {
      list: (query = {}) => api.page<SongSummary>("/songs", { query }),
      get: (id) => orNull(api<Song>(`/songs/${segment(id)}`)),
      create: (input) => api<Song>("/songs", { method: "POST", body: input }),
      update: (id, input) => api<Song>(`/songs/${segment(id)}`, { method: "PUT", body: input }),
      delete: (id) => api(`/songs/${segment(id)}`, { method: "DELETE" }),
      import: (songs) =>
        api<SongImportResult>("/songs/import", { method: "POST", body: { songs } }),
    },
    media: {
      list: (query = {}) => api.page<MediaAsset>("/media", { query }),
      get: (id) => orNull(api<MediaAsset>(`/media/${segment(id)}`)),
      createUpload: (input) => api<UploadTicket>("/media/uploads", { method: "POST", body: input }),
      confirm: (input) => api<MediaAsset>("/media", { method: "POST", body: input }),
      update: (id, patch) =>
        api<MediaAsset>(`/media/${segment(id)}`, { method: "PATCH", body: patch }),
      delete: (id) => api(`/media/${segment(id)}`, { method: "DELETE" }),
      downloadUrl: (id) =>
        api<{ url: string; expiresAt: string }>(`/media/${segment(id)}/download-url`),
    },
    records: {
      list: (query = {}) => api.page<ServiceRecord>("/service-records", { query }),
      get: (id) => orNull(api<ServiceRecord>(`/service-records/${segment(id)}`)),
      adjustBlock: (recordId, blockId, patch) =>
        api<ServiceRecord>(`/service-records/${segment(recordId)}/blocks/${segment(blockId)}`, {
          method: "PATCH",
          body: patch,
        }),
      delete: (id) => api(`/service-records/${segment(id)}`, { method: "DELETE" }),
    },
  };
}
