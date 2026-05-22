import type { UserRole } from "@/types";

export type Permission =
  | "leads:read"
  | "leads:write"
  | "leads:delete"
  | "clients:read"
  | "clients:write"
  | "clients:delete"
  | "deals:read"
  | "deals:write"
  | "pipeline:manage"
  | "analytics:read"
  | "integrations:manage"
  | "users:manage"
  | "automation:manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "leads:read",
    "leads:write",
    "leads:delete",
    "clients:read",
    "clients:write",
    "clients:delete",
    "deals:read",
    "deals:write",
    "pipeline:manage",
    "analytics:read",
    "integrations:manage",
    "users:manage",
    "automation:manage",
  ],
  manager: [
    "leads:read",
    "leads:write",
    "clients:read",
    "clients:write",
    "deals:read",
    "deals:write",
    "pipeline:manage",
    "analytics:read",
    "integrations:manage",
    "automation:manage",
  ],
  sales: [
    "leads:read",
    "leads:write",
    "clients:read",
    "clients:write",
    "deals:read",
    "deals:write",
    "pipeline:manage",
    "analytics:read",
  ],
  viewer: ["leads:read", "clients:read", "deals:read", "analytics:read"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canWriteLeads(role: UserRole): boolean {
  return hasPermission(role, "leads:write");
}
