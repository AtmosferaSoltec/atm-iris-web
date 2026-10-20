import "server-only";
import type {
  Church,
  Display,
  MediaAsset,
  Person,
  ServicePlanItem,
  ServiceRecord,
  ServiceType,
  Song,
  SongSummary,
  UploadTicket,
} from "@/domain/models";
import type { DataRepositories, DisplayLink, DisplayPairing, PairingStatus } from "../types";
import { env } from "../../env";
import { createApiClient, orNull, segment, type ClientOptions } from "./client";
import { ApiError } from "./errors";

// Implementation against atm-iris-api, route by route from docs/api-contract.md.

const DEFAULT_PROJECTION = { fontFamily: "system", fontSizePt: 88, defaultBackgroundId: null };

/** An API from before projection settings doesn't send them: the defaults. */
function withDefaults(church: Church): Church {
  return { ...church, projection: church.projection ?? DEFAULT_PROJECTION };
}

/** Contract §6, §8–§11, §14. */
export function apiDataRepositories(options: ClientOptions = {}): DataRepositories {
  const api = createApiClient(options);

  return {
    church: {
      get: () => api<Church>("/church").then(withDefaults),
      update: (input) =>
        api<Church>("/church", { method: "PATCH", body: input }).then(withDefaults),
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
      list: ({ kind, ...query } = {}) =>
        api.page<MediaAsset>("/media", {
          query: { ...query, kind: typeof kind === "string" ? kind : kind?.join(",") },
        }),
      get: (id) => orNull(api<MediaAsset>(`/media/${segment(id)}`)),
      createUpload: (input) => api<UploadTicket>("/media/uploads", { method: "POST", body: input }),
      confirm: (input) => api<MediaAsset>("/media", { method: "POST", body: input }),
      update: (id, patch) =>
        api<MediaAsset>(`/media/${segment(id)}`, { method: "PATCH", body: patch }),
      delete: (id) => api(`/media/${segment(id)}`, { method: "DELETE" }),
      downloadUrl: (id) =>
        api<{ url: string; expiresAt: string }>(`/media/${segment(id)}/download-url`),
    },
    servicePlan: {
      list: () => api<ServicePlanItem[]>("/service-plan"),
      add: (input) => api<ServicePlanItem>("/service-plan", { method: "POST", body: input }),
      move: (id, position) =>
        api(`/service-plan/${segment(id)}/position`, { method: "PUT", body: { position } }),
      remove: (id) => api(`/service-plan/${segment(id)}`, { method: "DELETE" }),
      clear: () => api("/service-plan", { method: "DELETE" }),
    },
    displays: {
      list: () => api<Display[]>("/displays"),
      claim: (code, name) => api<Display>("/displays", { method: "POST", body: { code, name } }),
      remove: (id) => api(`/displays/${segment(id)}`, { method: "DELETE" }),
      publish: (state) => api("/displays/state", { method: "PUT", body: state }),
    },
    records: {
      list: (query = {}) => api.page<ServiceRecord>("/service-records", { query }),
      get: (id) => orNull(api<ServiceRecord>(`/service-records/${segment(id)}`)),
      save: (id, input) =>
        api<ServiceRecord>(`/service-records/${segment(id)}`, { method: "PUT", body: input }),
      adjustBlock: (recordId, blockId, patch) =>
        api<ServiceRecord>(`/service-records/${segment(recordId)}/blocks/${segment(blockId)}`, {
          method: "PATCH",
          body: patch,
        }),
      delete: (id) => api(`/service-records/${segment(id)}`, { method: "DELETE" }),
    },
  };
}

/** Contract §18, the TV's side: no session, its own token. */
export function apiDisplayLink(): DisplayLink {
  const api = createApiClient();
  return {
    startPairing: () => api<DisplayPairing>("/displays/pairings", { method: "POST" }),
    async pairingStatus(id, secret) {
      // The secret goes in a header: the JSON client has no option for it.
      const response = await fetch(`${env.API_URL}/displays/pairings/${segment(id)}`, {
        headers: { Accept: "application/json", "X-Pairing-Secret": secret },
        cache: "no-store",
      }).catch(() => null);
      if (!response) throw new ApiError(0, "NETWORK", "No pudimos conectar con Iris.");
      if (response.status === 404) return null;
      if (!response.ok) throw new ApiError(response.status, "INTERNAL_ERROR", "Algo salió mal.");
      return ((await response.json()) as { data: PairingStatus }).data;
    },
    async stream(token, signal) {
      const response = await fetch(`${env.API_URL}/displays/stream`, {
        headers: { Accept: "text/event-stream", Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal,
      });
      if (response.status === 401) return "unlinked";
      if (!response.ok || !response.body) {
        throw new ApiError(response.status, "INTERNAL_ERROR", "El canal no está disponible.");
      }
      return response;
    },
  };
}
