import { ACTIVE_STATUSES } from "@/config/constants";
import { emit } from "@/core/events";
import { getDb, newId, nowIso } from "@/lib/db";
import { mapLead } from "@/lib/db/mappers";
import { logActivity } from "@/services/activities";
import type { Lead, LeadSource, LeadStatus } from "@/types";

function findDuplicate(db: ReturnType<typeof getDb>, phone?: string | null, email?: string | null) {
  if (phone?.trim()) {
    const row = db
      .prepare("SELECT * FROM leads WHERE phone = ? LIMIT 1")
      .get(phone.trim()) as Record<string, unknown> | undefined;
    if (row) return mapLead(row);
  }
  if (email?.trim()) {
    const row = db
      .prepare("SELECT * FROM leads WHERE email = ? COLLATE NOCASE LIMIT 1")
      .get(email.trim()) as Record<string, unknown> | undefined;
    if (row) return mapLead(row);
  }
  return null;
}

export async function getDashboardStats() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM leads").all() as Record<string, unknown>[];
  const all = rows.map(mapLead);
  const today = new Date().toISOString().split("T")[0];

  const paid = all.filter((l) => l.status === "won");
  const overdue = all.filter(
    (l) =>
      l.next_call &&
      new Date(l.next_call) < new Date() &&
      !["won", "lost"].includes(l.status)
  );

  return {
    total: all.length,
    newToday: all.filter((l) => l.created_at.startsWith(today)).length,
    active: all.filter((l) => ACTIVE_STATUSES.includes(l.status)).length,
    paid: paid.length,
    overdue: overdue.length,
    conversion: all.length ? Math.round((paid.length / all.length) * 100) : 0,
  };
}

export async function getLeadStatusCounts() {
  const db = getDb();
  const rows = db
    .prepare("SELECT status, COUNT(*) as count FROM leads GROUP BY status")
    .all() as { status: string; count: number }[];

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    counts[row.status] = row.count;
    total += row.count;
  }
  return { counts, total };
}

export async function getLeads(search?: string, status?: LeadStatus) {
  const db = getDb();
  const term = search?.trim();
  let rows: Record<string, unknown>[];

  if (term && status) {
    const pattern = `%${term}%`;
    rows = db
      .prepare(
        `SELECT * FROM leads
         WHERE status = ?
           AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR message LIKE ?)
         ORDER BY created_at DESC`
      )
      .all(status, pattern, pattern, pattern, pattern) as Record<string, unknown>[];
  } else if (status) {
    rows = db
      .prepare("SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC")
      .all(status) as Record<string, unknown>[];
  } else if (term) {
    const pattern = `%${term}%`;
    rows = db
      .prepare(
        `SELECT * FROM leads
         WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR message LIKE ?
         ORDER BY created_at DESC`
      )
      .all(pattern, pattern, pattern, pattern) as Record<string, unknown>[];
  } else {
    rows = db
      .prepare("SELECT * FROM leads ORDER BY created_at DESC")
      .all() as Record<string, unknown>[];
  }

  return { leads: rows.map(mapLead), error: null };
}

export async function getLeadsByStatus() {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM leads ORDER BY updated_at DESC")
    .all() as Record<string, unknown>[];
  const leads = rows.map(mapLead);

  const grouped: Record<LeadStatus, Lead[]> = {
    new: [],
    contacted: [],
    qualified: [],
    proposal: [],
    won: [],
    lost: [],
  };

  for (const lead of leads) {
    grouped[lead.status].push(lead);
  }

  return grouped;
}

export async function getLeadById(id: string) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return { lead: row ? mapLead(row) : null, error: null };
}

export async function createLead(data: {
  name: string;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  telegram_user_id?: string | null;
  telegram_chat_id?: string | null;
  source?: LeadSource;
  status?: LeadStatus;
  tags?: string[];
  score?: number;
  assigned_to?: string | null;
  ai_score?: number;
  ai_temperature?: Lead["ai_temperature"];
  ai_summary?: string | null;
  ai_recommendations?: string[];
}) {
  const db = getDb();
  const duplicate = findDuplicate(db, data.phone, data.email);
  if (duplicate) return { lead: duplicate, duplicate: true as const };

  const id = newId();
  const now = nowIso();
  const score = data.score ?? data.ai_score ?? 0;

  db.prepare(
    `INSERT INTO leads (
      id, name, phone, email, message, telegram_user_id, telegram_chat_id,
      source, status, tags, score, assigned_to,
      ai_score, ai_temperature, ai_summary, ai_recommendations,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.name,
    data.phone ?? null,
    data.email ?? null,
    data.message ?? null,
    data.telegram_user_id ?? null,
    data.telegram_chat_id ?? null,
    data.source ?? "telegram",
    data.status ?? "new",
    JSON.stringify(data.tags ?? []),
    score,
    data.assigned_to ?? null,
    data.ai_score ?? score,
    data.ai_temperature ?? null,
    data.ai_summary ?? null,
    JSON.stringify(data.ai_recommendations ?? []),
    now,
    now
  );

  const lead = mapLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as Record<string, unknown>);

  await logActivity({
    leadId: id,
    type: "system",
    content: `Lead created from ${lead.source}`,
  });

  await emit({ type: "lead.created", leadId: id, source: lead.source });

  return { lead, duplicate: false as const };
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  userId?: string | null
) {
  const db = getDb();
  const current = db.prepare("SELECT status FROM leads WHERE id = ?").get(id) as
    | { status: LeadStatus }
    | undefined;
  if (!current) return;

  db.prepare("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?").run(
    status,
    nowIso(),
    id
  );

  await logActivity({
    leadId: id,
    userId,
    type: "status_change",
    content: `Status: ${current.status} → ${status}`,
    metadata: { from: current.status, to: status },
  });

  await emit({ type: "lead.status_changed", leadId: id, from: current.status, to: status });

  if (status === "won") await emit({ type: "deal.won", leadId: id });
  if (status === "lost") await emit({ type: "deal.lost", leadId: id });
}

export async function updateLeadNextCall(id: string, next_call: string | null) {
  const db = getDb();
  db.prepare("UPDATE leads SET next_call = ?, updated_at = ? WHERE id = ?").run(
    next_call,
    nowIso(),
    id
  );
}

export async function updateLeadTags(id: string, tags: string[]) {
  const db = getDb();
  db.prepare("UPDATE leads SET tags = ?, updated_at = ? WHERE id = ?").run(
    JSON.stringify(tags),
    nowIso(),
    id
  );
}
