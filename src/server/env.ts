import "server-only";
import { z } from "zod";

// Only the server layer reads process.env. Invalid configuration fails fast at startup.

const DEV_SESSION_SECRET = "iris-dev-only-session-secret-change-me";

const source = z.enum(["mock", "api"]).default("mock");

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    /** Where sign-in, sign-up and password recovery go. */
    AUTH_SOURCE: source,
    /** Where songs, services, people and modules go (the API serves them from stage 02). */
    DATA_SOURCE: source,
    /** atm-iris-api base URL, including /api/v1. */
    API_URL: z.url().optional(),
    SESSION_SECRET: z.string().min(32).optional(),
  })
  .superRefine((env, ctx) => {
    if ((env.AUTH_SOURCE === "api" || env.DATA_SOURCE === "api") && !env.API_URL) {
      ctx.addIssue({ code: "custom", path: ["API_URL"], message: "Required when a source is api" });
    }
    if (env.NODE_ENV === "production" && !env.SESSION_SECRET && !isBuildPhase()) {
      ctx.addIssue({ code: "custom", path: ["SESSION_SECRET"], message: "Required in production" });
    }
  });

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

const parsed = schema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  AUTH_SOURCE: process.env.AUTH_SOURCE || undefined,
  DATA_SOURCE: process.env.DATA_SOURCE || undefined,
  API_URL: process.env.API_URL || undefined,
  SESSION_SECRET: process.env.SESSION_SECRET || undefined,
});

if (!parsed.success) {
  throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
}

export const env = {
  ...parsed.data,
  SESSION_SECRET: parsed.data.SESSION_SECRET ?? DEV_SESSION_SECRET,
};
