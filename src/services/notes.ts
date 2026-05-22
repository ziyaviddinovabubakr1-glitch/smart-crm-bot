import { getDb, newId, nowIso } from "@/lib/db";
import { mapNote } from "@/lib/db/mappers";
import type { Note } from "@/types";

export async function getNotesByLead(leadId: string) {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM notes WHERE lead_id = ? ORDER BY created_at DESC")
    .all(leadId) as Record<string, unknown>[];

  return rows.map(mapNote) as Note[];
}

export async function addNote(leadId: string, content: string) {
  const db = getDb();
  const id = newId();
  const now = nowIso();

  db.prepare("INSERT INTO notes (id, lead_id, content, created_at) VALUES (?, ?, ?, ?)").run(
    id,
    leadId,
    content,
    now
  );
}
