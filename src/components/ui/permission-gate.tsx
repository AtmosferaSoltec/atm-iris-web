import type { ReactNode } from "react";
import type { Permission } from "@/domain/models";
import { can } from "@/lib/permissions";
import { Tooltip } from "./tooltip";

type PermissionGateProps = {
  /** The session (or anything with its permissions), passed down from the server. */
  session: { permissions: readonly string[] };
  permission: Permission;
  /** `hide` (default) removes the children; `disable` keeps them visible but inert. */
  mode?: "hide" | "disable";
  /** With `disable`: why it's off, shown on hover and focus. */
  reason?: string;
  children: ReactNode;
};

/**
 * Shows an action only to roles that have its permission. The API rejects it
 * anyway: this keeps people from reaching for buttons that can't work.
 */
export function PermissionGate({
  session,
  permission,
  mode = "hide",
  reason,
  children,
}: PermissionGateProps) {
  if (can(session, permission)) return <>{children}</>;
  if (mode === "hide") return null;

  // A disabled fieldset makes every control inside inert; the wrapper keeps the
  // tooltip reachable by keyboard, which a disabled button alone is not.
  const disabled = (
    <fieldset disabled className="contents">
      {children}
    </fieldset>
  );
  if (!reason) return disabled;
  return (
    <Tooltip content={reason}>
      <span tabIndex={0} className="inline-flex w-fit rounded-full">
        {disabled}
      </span>
    </Tooltip>
  );
}
