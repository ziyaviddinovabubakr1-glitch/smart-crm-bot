import { getDb, newId, nowIso } from "@/lib/db";
import { mapClient } from "@/lib/db/mappers";
import { hashPassword, verifyPassword } from "@/lib/db/migrations";

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  if (newPassword.length < 6) {
    return { ok: false as const, error: "weak_password" as const };
  }

  const db = getDb();
  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(userId) as
    | { password_hash: string }
    | undefined;
  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    return { ok: false as const, error: "invalid_current" as const };
  }

  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    hashPassword(newPassword),
    userId
  );

  return { ok: true as const };
}
