import type { ReleaseRepository } from "../types";

export const MOCK_APP_VERSION = "1.0.0";

export function mockReleases(): ReleaseRepository {
  return { latestVersion: async () => MOCK_APP_VERSION };
}
