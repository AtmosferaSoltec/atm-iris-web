import "server-only";
import type { UserSession } from "@/domain/models";
import { env } from "../env";
import { apiDataRepositories } from "./api";
import { apiAuth } from "./api/auth";
import { apiReleases } from "./api/releases";
import type { ClientOptions } from "./api/client";
import { mockAuth, mockDataRepositories, mockReleases } from "./mock";
import type { Repositories } from "./types";

export type { Repositories } from "./types";

export type RepositoryContext = ClientOptions & {
  /** The mocks use it to know whose church to read. */
  session?: UserSession;
};

/**
 * Composition root: the only place that knows what is mocked and what is real.
 * Accounts (auth) follow AUTH_SOURCE because they live with the users; church
 * content follows DATA_SOURCE.
 */
export function getRepositories({ session, ...apiOptions }: RepositoryContext = {}): Repositories {
  const accountsFromApi = env.AUTH_SOURCE === "api";
  return {
    auth: accountsFromApi ? apiAuth(apiOptions) : mockAuth(session),
    releases: env.DATA_SOURCE === "api" ? apiReleases(apiOptions) : mockReleases(),
    ...(env.DATA_SOURCE === "api"
      ? apiDataRepositories(apiOptions)
      : mockDataRepositories(session)),
  };
}
