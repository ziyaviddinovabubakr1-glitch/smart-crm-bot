import type { SessionUser } from "@/types";
import { resolveUserInDatabase } from "@/lib/auth/session";

export function canAccessAllData(role: SessionUser["role"]) {
  return role === "admin";
}

export function userScopeClause(
  session: SessionUser,
  column = "user_id"
): { clause: string; params: string[] } {
  if (canAccessAllData(session.role)) {
    return { clause: "", params: [] };
  }
  const resolved = resolveUserInDatabase(session);
  const userId = resolved?.id ?? session.id;
  return { clause: `AND ${column} = ?`, params: [userId] };
}
