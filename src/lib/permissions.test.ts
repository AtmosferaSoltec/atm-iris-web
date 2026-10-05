import { describe, expect, it } from "vitest";
import type { Permission, Role } from "@/domain/models";
import { assignableRoles, can, canManageMember, ROLE_PERMISSIONS } from "./permissions";

// docs/api-contract.md §3, row by row.
const CONTRACT: Record<Permission, Record<Role, boolean>> = {
  "church.manage": { owner: true, admin: true, operator: false },
  "modules.manage": { owner: true, admin: true, operator: false },
  "members.manage": { owner: true, admin: true, operator: false },
  "songs.manage": { owner: true, admin: true, operator: false },
  "media.manage": { owner: true, admin: true, operator: false },
  "serviceTypes.manage": { owner: true, admin: true, operator: false },
  "people.manage": { owner: true, admin: true, operator: true },
  "records.write": { owner: true, admin: true, operator: true },
  "records.manage": { owner: true, admin: true, operator: false },
};

describe("permissions", () => {
  it("matches the contract's table", () => {
    for (const [permission, roles] of Object.entries(CONTRACT)) {
      for (const [role, allowed] of Object.entries(roles)) {
        const session = { permissions: ROLE_PERMISSIONS[role as Role] };
        expect(can(session, permission as Permission), `${role} ${permission}`).toBe(allowed);
      }
    }
  });

  it("decides from the session's permissions, not its role", () => {
    expect(can({ permissions: ["songs.manage"] }, "songs.manage")).toBe(true);
    expect(can({ permissions: [] }, "people.manage")).toBe(false);
  });

  it("only an owner touches owners", () => {
    expect(canManageMember("owner", "owner")).toBe(true);
    expect(canManageMember("admin", "owner")).toBe(false);
    expect(canManageMember("admin", "operator")).toBe(true);
    expect(assignableRoles("owner")).toContain("owner");
    expect(assignableRoles("admin")).toEqual(["admin", "operator"]);
  });
});
