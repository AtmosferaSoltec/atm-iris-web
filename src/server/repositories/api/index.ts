import "server-only";
import type {
  Church,
  MediaAsset,
  Person,
  ServiceRecord,
  ServiceType,
  Song,
  SongSummary,
  UploadTicket,
} from "@/domain/models";
import type { DataRepositories } from "../types";
import { createApiClient, orNull, segment, type ClientOptions } from "./client";

// Implementation against atm-iris-api, route by route from docs/api-contract.md.

/** Contract §6, §8–§11, §14. */
export function apiDataRepositories(options: ClientOptions = {}): DataRepositories {
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
