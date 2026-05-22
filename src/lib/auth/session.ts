import { cookies } from "next/headers";
import type { SessionUser, UserRole } from "@/types";
import { getDb } from "@/lib/db";
import { mapUser } from "@/lib/db/mappers";
import { verifyPassword } from "@/lib/db/migrations";
import {
  buildSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/auth/cookie";

export async function login(email: string, password: string): Promise<SessionUser | null> {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM users WHERE lower(trim(email)) = lower(trim(?))
       ORDER BY created_at ASC, rowid ASC
       LIMIT 1`
    )
    .get(email.trim()) as Record<string, unknown> | undefined;

  if (!row || !verifyPassword(password, row.password_hash as string)) {
    return null;
  }

  return toSessionUser(row);
}

function toSessionUser(row: Record<string, unknown>): SessionUser {
  const user = mapUser(row);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** Match session to a row in users (handles stale cookie ids after DB reset). */
export function resolveUserInDatabase(tokenUser: SessionUser): SessionUser | null {
  const db = getDb();
  const email = tokenUser.email.trim().toLowerCase();

  if (email) {
    const canonical = db
      .prepare(
        `SELECT * FROM users WHERE lower(trim(email)) = ?
         ORDER BY created_at ASC, rowid ASC
         LIMIT 1`
      )
      .get(email) as Record<string, unknown> | undefined;

    if (canonical) {
      return toSessionUser(canonical);
    }
  }

  const byId = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(tokenUser.id) as Record<string, unknown> | undefined;
  if (byId) {
    return toSessionUser(byId);
  }

  console.error(
    `[auth] no user in database for session id=${tokenUser.id} email=${tokenUser.email}`
  );
  return null;
}

export function assertUserExists(userId: string): void {
  const db = getDb();
  const row = db.prepare("SELECT id FROM users WHERE id = ?").get(userId) as
    | { id: string }
    | undefined;
  if (!row) {
    throw new Error("USER_NOT_FOUND");
  }
}

export async function setSession(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await buildSessionToken(user), sessionCookieOptions());
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentSession(): Promise<{
  user: { id: string; email: string; name: string; role: SessionUser["role"] };
} | null> {
  const session = await getSession();
  if (!session) return null;
  return {
    user: {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
    },
  };
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenUser = await verifySessionToken(token);
  if (!tokenUser) return null;

  const user = resolveUserInDatabase(tokenUser);
  if (!user) return null;

  // Cookie refresh only in Route Handlers / Server Actions (Next.js restriction).
  // Stale cookie ids are reconciled in-memory via resolveUserInDatabase.
  return user;
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function requireRole(session: SessionUser, roles: UserRole[]) {
  if (!roles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
}
