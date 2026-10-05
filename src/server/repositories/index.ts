import "server-only";
import { env } from "../env";
import { apiDataRepositories } from "./api";
import { apiAuth } from "./api/auth";
import { mockAuth, mockDataRepositories } from "./mock";
import type { Repositories } from "./types";

export type { Repositories } from "./types";

/**
 * Composition root: the only place that knows what is mocked and what is real.
 * Auth and church data switch separately because the API delivers them in
 * different stages (docs/plans/00-roadmap.md in atm-iris-api).
 */
export function getRepositories(accessToken?: string): Repositories {
  return {
    auth: env.AUTH_SOURCE === "api" ? apiAuth(accessToken) : mockAuth,
    ...(env.DATA_SOURCE === "api" ? apiDataRepositories(accessToken) : mockDataRepositories),
  };
}
