import { getDb, newId, nowIso } from "@/lib/db";
import { mapActivity } from "@/lib/db/mappers";
import type { Activity, ActivityType } from "@/types";

export async function logActivity(params: {
  leadId: string;
  type: ActivityType;
  content: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  const id = newId();
  const now = nowIso();

  db.prepare(
    `INSERT INTO activities (id, lead_id, user_id, type, content, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.leadId,
    params.userId ?? null,
    params.type,
    params.content,
    JSON.stringify(params.metadata ?? {}),
    now
  );

  return mapActivity(
    db.prepare("SELECT * FROM activities WHERE id = ?").get(id) as Record<string, unknown>
  );
}

export async function getActivitiesByLead(leadId: string, limit = 50) {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC LIMIT ?"
    )
    .all(leadId, limit) as Record<string, unknown>[];

  return rows.map(mapActivity) as Activity[];
}

export async function getRecentActivities(limit = 10) {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM activities ORDER BY created_at DESC LIMIT ?")
    .all(limit) as Record<string, unknown>[];

  return rows.map(mapActivity) as Activity[];
}
