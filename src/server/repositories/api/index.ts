import "server-only";
import type { ChurchModules, Person, ServiceRecord, ServiceType, Song } from "@/domain/models";
import type { Repositories } from "../types";
import { ApiError, createApiClient } from "./client";

// Implementation against atm-iris-api (NestJS). These endpoints arrive with stages
// 02–04 of the API roadmap; until then keep DATA_SOURCE=mock.

/** Church data (stage 02+). Auth lives in ./auth.ts. */
export function apiDataRepositories(accessToken?: string): Omit<Repositories, "auth"> {
  const api = createApiClient({ accessToken });

  return {
    songs: {
      list: () => api<Song[]>("/songs"),
      get: async (id) => {
        try {
          return await api<Song>(`/songs/${encodeURIComponent(id)}`);
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) return null;
          throw error;
        }
      },
      create: (input) => api<Song>("/songs", { method: "POST", body: input }),
      createMany: (inputs) => api<Song[]>("/songs/bulk", { method: "POST", body: inputs }),
      update: (id, input) =>
        api<Song>(`/songs/${encodeURIComponent(id)}`, { method: "PUT", body: input }),
      delete: (id) => api(`/songs/${encodeURIComponent(id)}`, { method: "DELETE" }),
    },
    modules: {
      get: () => api<ChurchModules>("/church/modules"),
      save: (modules) => api("/church/modules", { method: "PUT", body: modules }),
    },
    serviceTypes: {
      list: () => api<ServiceType[]>("/service-types"),
      get: async (id) => {
        try {
          return await api<ServiceType>(`/service-types/${encodeURIComponent(id)}`);
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) return null;
          throw error;
        }
      },
      save: (type) =>
        api(`/service-types/${encodeURIComponent(type.id)}`, { method: "PUT", body: type }),
      delete: (id) => api(`/service-types/${encodeURIComponent(id)}`, { method: "DELETE" }),
    },
    people: {
      list: () => api<Person[]>("/people"),
      add: (name) => api<Person>("/people", { method: "POST", body: { name } }),
      rename: (id, name) =>
        api(`/people/${encodeURIComponent(id)}`, { method: "PATCH", body: { name } }),
      delete: (id) => api(`/people/${encodeURIComponent(id)}`, { method: "DELETE" }),
    },
    records: {
      list: () => api<ServiceRecord[]>("/time-records"),
    },
  };
}
