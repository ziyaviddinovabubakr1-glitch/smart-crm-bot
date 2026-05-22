import { getDb, newId, nowIso } from "@/lib/db";
import { mapClientFieldDefinition } from "@/lib/db/mappers";
import type { CustomFieldType } from "@/types";

export async function getClientFieldDefinitions() {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM client_field_definitions ORDER BY sort_order ASC, created_at ASC")
    .all() as Record<string, unknown>[];
  return rows.map(mapClientFieldDefinition);
}

export async function addClientFieldDefinition(input: {
  field_key: string;
  label: string;
  field_type: CustomFieldType;
  options?: string[];
}) {
  const db = getDb();
  const id = newId();
  const maxOrder = db
    .prepare("SELECT MAX(sort_order) as m FROM client_field_definitions")
    .get() as { m: number | null };

  db.prepare(
    `INSERT INTO client_field_definitions (id, field_key, label, field_type, options, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.field_key.trim(),
    input.label.trim(),
    input.field_type,
    JSON.stringify(input.options ?? []),
    (maxOrder.m ?? -1) + 1,
    nowIso()
  );

  return mapClientFieldDefinition(
    db.prepare("SELECT * FROM client_field_definitions WHERE id = ?").get(id) as Record<
      string,
      unknown
    >
  );
}

export async function deleteClientFieldDefinition(id: string) {
  const db = getDb();
  db.prepare("DELETE FROM client_field_definitions WHERE id = ?").run(id);
}

export async function updateClientFieldDefinition(
  id: string,
  input: { label?: string; options?: string[] }
) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM client_field_definitions WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;

  db.prepare("UPDATE client_field_definitions SET label = ?, options = ? WHERE id = ?").run(
    input.label ?? row.label,
    JSON.stringify(input.options ?? JSON.parse(String(row.options ?? "[]"))),
    id
  );

  return mapClientFieldDefinition(
    db.prepare("SELECT * FROM client_field_definitions WHERE id = ?").get(id) as Record<
      string,
      unknown
    >
  );
}
