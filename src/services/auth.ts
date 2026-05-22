import { randomBytes } from "crypto";
import { getDb, newId, nowIso } from "@/lib/db";
import { mapUser } from "@/lib/db/mappers";
import { hashPassword } from "@/lib/db/migrations";
import type { SessionUser, User } from "@/types";

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
  role?: SessionUser["role"];
}): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;

  if (!email || !name) return { ok: false, error: "email and name required" };
  if (password.length < 6) return { ok: false, error: "password must be at least 6 characters" };

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE")
    .get(email) as { id: string } | undefined;
  if (existing) return { ok: false, error: "email already registered" };

  const id = newId();
  const now = nowIso();

  db.prepare(
    `INSERT INTO users (
      id, email, name, role, password_hash,
      goals, theme_preference, background_preference, onboarding_completed,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, '[]', 'system', 'aurora', 0, ?, ?)`
  ).run(
    id,
    email,
    name,
    input.role ?? "sales",
    hashPassword(password),
    now,
    now
  );

  const user = mapUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown>);
  return { ok: true, user };
}

export async function createPasswordResetToken(email: string) {
  const db = getDb();
  const row = db
    .prepare("SELECT id, email FROM users WHERE email = ? COLLATE NOCASE")
    .get(email.trim()) as { id: string; email: string } | undefined;

  if (!row) {
    return { ok: true as const, token: null };
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600_000).toISOString();
  const now = nowIso();

  db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(row.id);
  db.prepare(
    `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used_at, created_at)
     VALUES (?, ?, ?, ?, NULL, ?)`
  ).run(newId(), row.id, token, expires, now);

  console.info("[password-reset-stub]", row.email, token);

  return { ok: true as const, token, email: row.email };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  if (newPassword.length < 6) {
    return { ok: false as const, error: "weak_password" as const };
  }

  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM password_reset_tokens
       WHERE token = ? AND used_at IS NULL AND expires_at > ?`
    )
    .get(token, nowIso()) as { id: string; user_id: string } | undefined;

  if (!row) return { ok: false as const, error: "invalid_token" as const };

  db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
    hashPassword(newPassword),
    nowIso(),
    row.user_id
  );
  db.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE id = ?").run(nowIso(), row.id);

  return { ok: true as const };
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    business_type: user.business_type,
    industry: user.industry,
    onboarding_completed: user.onboarding_completed,
    theme_preference: user.theme_preference,
    background_preference: user.background_preference,
    created_at: user.created_at,
  };
}
