import { getDb } from "@/lib/db";
import { clientFullName, mapClient } from "@/lib/db/mappers";
import { userScopeClause } from "@/lib/auth/scope";
import type { Client, SessionUser } from "@/types";

export async function findDuplicateClients(
  session: SessionUser,
  input: { phone?: string | null; email?: string | null }
): Promise<Client[]> {
  const db = getDb();
  const { clause, params } = userScopeClause(session);
  const duplicates: Client[] = [];

  if (input.phone?.trim()) {
    const row = db
      .prepare(
        `SELECT * FROM clients WHERE phone = ? AND is_archived = 0 ${clause} LIMIT 3`
      )
      .get(input.phone.trim(), ...params) as Record<string, unknown> | undefined;
    if (row) duplicates.push(mapClient(row));
  }

  if (input.email?.trim()) {
    const rows = db
      .prepare(
        `SELECT * FROM clients WHERE email = ? COLLATE NOCASE AND is_archived = 0 ${clause} LIMIT 3`
      )
      .all(input.email.trim(), ...params) as Record<string, unknown>[];
    for (const row of rows) {
      const client = mapClient(row);
      if (!duplicates.some((d) => d.id === client.id)) {
        duplicates.push(client);
      }
    }
  }

  return duplicates;
}

export function formatDuplicateMessage(clients: Client[]) {
  if (clients.length === 0) return null;
  const names = clients.map((c) => clientFullName(c)).join(", ");
  return `Возможный дубликат: ${names}`;
}
