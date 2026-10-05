import type { Permission, Role } from "@/domain/models";

// Contract §3. The API resolves `permissions` for the session's role; this
// catalog only exists to explain roles on screen and to back the mocks.

export const PERMISSIONS: readonly Permission[] = [
  "church.manage",
  "modules.manage",
  "members.manage",
  "songs.manage",
  "media.manage",
  "serviceTypes.manage",
  "people.manage",
  "records.write",
  "records.manage",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  admin: PERMISSIONS,
  operator: ["people.manage", "records.write"],
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  "church.manage": "Cambiar el nombre y la zona horaria de la iglesia",
  "modules.manage": "Encender y apagar módulos",
  "members.manage": "Invitar, cambiar el rol y quitar miembros",
  "songs.manage": "Crear, editar, importar y borrar canciones",
  "media.manage": "Subir, editar y borrar multimedia",
  "serviceTypes.manage": "Crear, editar y borrar servicios",
  "people.manage": "Agregar, renombrar y borrar personas",
  "records.write": "Guardar los tiempos al terminar un servicio",
  "records.manage": "Ajustar y borrar registros de tiempos",
};

export const ROLES: readonly Role[] = ["owner", "admin", "operator"];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Dueño",
  admin: "Administrador",
  operator: "Operador",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Todo, incluido el traspaso de la iglesia.",
  admin: "Gestiona todo menos el traspaso de la iglesia.",
  operator: "Usa la consola y registra tiempos.",
};

export const ROLE_COLORS: Record<Role, string> = {
  owner: "var(--color-ember)",
  admin: "var(--color-violet)",
  operator: "var(--color-indigo)",
};

export function can(session: { permissions: readonly string[] }, permission: Permission): boolean {
  return session.permissions.includes(permission);
}

/**
 * Contract §3/§7: only an owner assigns or removes `owner`, and an admin can't
 * touch an owner. The API enforces it; the screen just hides what would fail.
 */
export function canManageMember(actorRole: Role, targetRole: Role): boolean {
  return actorRole === "owner" || targetRole !== "owner";
}

export function assignableRoles(actorRole: Role): Role[] {
  return actorRole === "owner" ? [...ROLES] : ROLES.filter((role) => role !== "owner");
}
