import { getDb } from "@/lib/db";
import { mapUser } from "@/lib/db/mappers";
import type { User } from "@/types";

export async function getUsers(): Promise<User[]> {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM users ORDER BY created_at ASC").all() as Record<
    string,
    unknown
  >[];
  return rows.map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? mapUser(row) : null;
}
