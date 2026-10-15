import "server-only";
import type { ReleaseRepository } from "../types";
import { createApiClient, type ClientOptions } from "./client";

type AppVersionCheck = { latestVersion: string };

/** Contract §17. Public: no session needed. */
export function apiReleases(options: ClientOptions = {}): ReleaseRepository {
  const api = createApiClient(options);
  return {
    latestVersion: async (platform) => {
      try {
        // Asking from "0.0.0" always answers with the published version.
        const check = await api<AppVersionCheck>("/app-version", {
          query: { platform, version: "0.0.0" },
        });
        return check.latestVersion;
      } catch {
        return null;
      }
    },
  };
}
