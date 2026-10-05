import { describe, expect, it } from "vitest";
import { toAuthResult, toUserSession, type ApiAuthResult } from "./auth";
import { queryString } from "./client";

// The AuthResult example of docs/api-contract.md §5.
const EXAMPLE: ApiAuthResult = {
  user: { id: "01a1", email: "pastor@vidanueva.org", fullName: "Daniel Ruiz" },
  church: { id: "01a2", name: "Iglesia Vida Nueva", timezone: "America/Lima" },
  role: "owner",
  permissions: [
    "church.manage",
    "modules.manage",
    "members.manage",
    "songs.manage",
    "media.manage",
    "serviceTypes.manage",
    "people.manage",
    "records.write",
    "records.manage",
  ],
  churches: [{ id: "01a2", name: "Iglesia Vida Nueva", role: "owner" }],
  session: { id: "01a3", platform: "ios", deviceName: "iPad de la sala" },
  accessToken: "access",
  accessTokenExpiresAt: "2026-10-05T15:45:31.022Z",
  refreshToken: "refresh",
  refreshTokenExpiresAt: "2026-12-04T15:30:31.022Z",
};

describe("API mappers", () => {
  it("turns an AuthResult into the cookie's session and tokens", () => {
    expect(toAuthResult(EXAMPLE)).toEqual({
      session: {
        userId: "01a1",
        sessionId: "01a3",
        email: "pastor@vidanueva.org",
        fullName: "Daniel Ruiz",
        church: { id: "01a2", name: "Iglesia Vida Nueva", timezone: "America/Lima" },
        role: "owner",
        permissions: EXAMPLE.permissions,
        churches: EXAMPLE.churches,
      },
      tokens: {
        accessToken: "access",
        accessTokenExpiresAt: "2026-10-05T15:45:31.022Z",
        refreshToken: "refresh",
        refreshTokenExpiresAt: "2026-12-04T15:30:31.022Z",
      },
    });
  });

  it("keeps no token in the session view", () => {
    expect(JSON.stringify(toUserSession(EXAMPLE))).not.toContain("refresh");
  });

  it("builds query strings without empty values", () => {
    expect(
      queryString({ search: "gracia", page: 2, kind: undefined, sort: "", isBackground: false }),
    ).toBe("?search=gracia&page=2&isBackground=false");
    expect(queryString({ search: "" })).toBe("");
    expect(queryString({ search: "Señor & fe" })).toBe("?search=Se%C3%B1or+%26+fe");
  });
});
