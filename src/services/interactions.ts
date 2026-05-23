import { analyzeCommunication } from "@/lib/ai/analyze-communication";
import { getDb, newId, nowIso, sqlParams } from "@/lib/db";
import { clientFullName, mapClientNote, mapInteraction } from "@/lib/db/mappers";
import { userScopeClause } from "@/lib/auth/scope";
import { getClientById } from "@/services/clients";
import type {
  ClientNote,
  CommunicationDirection,
  Interaction,
  InteractionStatus,
  InteractionType,
  SessionUser,
} from "@/types";

export type CommunicationListQuery = {
  type?: InteractionType;
  limit?: number;
};

export type CreateCommunicationPayload = {
  client_id: string;
  deal_id?: string | null;
  type: InteractionType;
  content: string;
  subject?: string | null;
  direction?: CommunicationDirection | null;
  status?: InteractionStatus;
  scheduled_at?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration?: number | null;
  channel?: string | null;
  analyze?: boolean;
};

function defaultStatus(type: InteractionType): InteractionStatus {
  return type === "task" ? "scheduled" : "completed";
}

function computeDuration(
  duration?: number | null,
  start?: string | null,
  end?: string | null
): number | null {
  if (duration != null && duration >= 0) return duration;
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.round(ms / 1000);
}

function applyAiFields(
  db: ReturnType<typeof getDb>,
  id: string,
  insight: Awaited<ReturnType<typeof analyzeCommunication>>
) {
  db.prepare(
    `UPDATE interactions SET
      summary = ?, outcome = ?, sentiment = ?, sentiment_score = ?,
      ai_tags = ?, ai_analysis = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    insight.summary,
    insight.outcome,
    insight.sentiment,
    insight.sentiment_score,
    JSON.stringify(insight.tags),
    JSON.stringify(insight.ai_analysis),
    nowIso(),
    id
  );
}

export async function getInteractionsByClient(
  clientId: string,
  session: SessionUser,
  query?: CommunicationListQuery
) {
  const db = getDb();
  const { clause, params } = userScopeClause(session);
  const conditions = [`client_id = ?`, `1=1 ${clause}`];
  const values: unknown[] = [clientId, ...params];

  if (query?.type) {
    conditions.push("type = ?");
    values.push(query.type);
  }

  const limit = Math.min(100, Math.max(1, query?.limit ?? 100));

  const rows = db
    .prepare(
      `SELECT * FROM interactions
       WHERE ${conditions.join(" AND ")}
       ORDER BY COALESCE(start_time, created_at) DESC
       LIMIT ?`
    )
    .all(...sqlParams(values), limit) as Record<string, unknown>[];

  return rows.map(mapInteraction);
}

export async function getNotesByClient(clientId: string, _session: SessionUser) {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM client_notes WHERE client_id = ? ORDER BY created_at DESC`)
    .all(clientId) as Record<string, unknown>[];
  return rows.map(mapClientNote);
}

export async function createInteraction(
  session: SessionUser,
  input: CreateCommunicationPayload
) {
  return createCommunication(session, input);
}

export async function createCommunication(
  session: SessionUser,
  input: CreateCommunicationPayload
) {
  const db = getDb();
  const id = newId();
  const now = nowIso();
  const startTime = input.start_time ?? now;
  const duration = computeDuration(input.duration, startTime, input.end_time);

  db.prepare(
    `INSERT INTO interactions (
      id, client_id, deal_id, user_id, type, content, subject, direction,
      scheduled_at, status, duration, channel, start_time, end_time,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.client_id,
    input.deal_id ?? null,
    session.id,
    input.type,
    input.content.trim(),
    input.subject?.trim() || null,
    input.direction ?? null,
    input.scheduled_at ?? null,
    input.status ?? defaultStatus(input.type),
    duration,
    input.channel?.trim() || null,
    startTime,
    input.end_time ?? null,
    now,
    now
  );

  db.prepare("UPDATE clients SET last_contact_at = ? WHERE id = ?").run(now, input.client_id);

  let interaction = mapInteraction(
    db.prepare("SELECT * FROM interactions WHERE id = ?").get(id) as Record<string, unknown>
  );

  const shouldAnalyze =
    input.analyze ?? ["call", "email", "meeting", "message"].includes(input.type);

  if (shouldAnalyze && input.content.trim()) {
    interaction = (await analyzeCommunicationById(session, id)) ?? interaction;
  }

  return interaction;
}

export async function analyzeCommunicationById(session: SessionUser, id: string) {
  const existing = await getInteractionById(id, session);
  if (!existing) return null;

  const client = await getClientById(existing.client_id, session);
  const insight = await analyzeCommunication({
    type: existing.type,
    content: existing.content,
    subject: existing.subject,
    direction: existing.direction,
    channel: existing.channel,
    clientName: client ? clientFullName(client) : undefined,
  });

  const db = getDb();
  applyAiFields(db, id, insight);

  return getInteractionById(id, session);
}

export async function addClientNote(session: SessionUser, clientId: string, text: string) {
  const db = getDb();
  const id = newId();
  const now = nowIso();

  db.prepare(
    `INSERT INTO client_notes (id, client_id, user_id, text, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, clientId, session.id, text.trim(), now);

  await createCommunication(session, {
    client_id: clientId,
    type: "note",
    content: text.trim(),
    status: "completed",
    analyze: false,
  });

  return mapClientNote(
    db.prepare("SELECT * FROM client_notes WHERE id = ?").get(id) as Record<string, unknown>
  );
}

export async function updateInteractionStatus(
  session: SessionUser,
  id: string,
  status: InteractionStatus
) {
  const db = getDb();
  const { clause, params } = userScopeClause(session);
  const existing = db
    .prepare(`SELECT * FROM interactions WHERE id = ? ${clause}`)
    .get(id, ...params) as Record<string, unknown> | undefined;
  if (!existing) return null;

  const normalized =
    status === "done" ? "completed" : status === "pending" ? "scheduled" : status;

  db.prepare("UPDATE interactions SET status = ?, updated_at = ? WHERE id = ?").run(
    normalized,
    nowIso(),
    id
  );
  return mapInteraction(
    db.prepare("SELECT * FROM interactions WHERE id = ?").get(id) as Record<string, unknown>
  );
}

export async function getInteractionById(id: string, session: SessionUser) {
  const db = getDb();
  const { clause, params } = userScopeClause(session);
  const row = db
    .prepare(`SELECT * FROM interactions WHERE id = ? ${clause}`)
    .get(id, ...params) as Record<string, unknown> | undefined;
  return row ? mapInteraction(row) : null;
}

export async function updateInteraction(
  session: SessionUser,
  id: string,
  input: Partial<{
    type: InteractionType;
    content: string;
    subject: string | null;
    direction: CommunicationDirection | null;
    scheduled_at: string | null;
    start_time: string | null;
    end_time: string | null;
    duration: number | null;
    channel: string | null;
    status: InteractionStatus;
  }>
) {
  const existing = await getInteractionById(id, session);
  if (!existing) return null;

  const db = getDb();
  const startTime =
    input.start_time !== undefined ? input.start_time : existing.start_time;
  const endTime = input.end_time !== undefined ? input.end_time : existing.end_time;
  const duration = computeDuration(
    input.duration !== undefined ? input.duration : existing.duration,
    startTime,
    endTime
  );

  db.prepare(
    `UPDATE interactions SET
      type = ?, content = ?, subject = ?, direction = ?,
      scheduled_at = ?, start_time = ?, end_time = ?, duration = ?,
      channel = ?, status = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    input.type ?? existing.type,
    input.content?.trim() ?? existing.content,
    input.subject !== undefined ? input.subject : existing.subject,
    input.direction !== undefined ? input.direction : existing.direction,
    input.scheduled_at !== undefined ? input.scheduled_at : existing.scheduled_at,
    startTime,
    endTime,
    duration,
    input.channel !== undefined ? input.channel : existing.channel,
    input.status ?? existing.status,
    nowIso(),
    id
  );

  return getInteractionById(id, session);
}

export async function getTasksDue(session: SessionUser, days = 7) {
  const db = getDb();
  const { clause, params } = userScopeClause(session);
  const until = new Date();
  until.setDate(until.getDate() + days);

  const rows = db
    .prepare(
      `SELECT i.*, c.first_name, c.last_name
       FROM interactions i
       JOIN clients c ON c.id = i.client_id
       WHERE i.type = 'task' AND i.status IN ('pending', 'scheduled')
         AND i.scheduled_at IS NOT NULL
         AND i.scheduled_at <= ?
         ${clause}
       ORDER BY i.scheduled_at ASC
       LIMIT 20`
    )
    .all(until.toISOString(), ...params) as Record<string, unknown>[];

  return rows.map((row) => ({
    ...mapInteraction(row),
    client_name: [row.first_name, row.last_name].filter(Boolean).join(" "),
  }));
}

export async function getRecentClientInteractions(session: SessionUser, limit = 8) {
  const db = getDb();
  const { clause, params } = userScopeClause(session);
  const rows = db
    .prepare(
      `SELECT * FROM interactions WHERE 1=1 ${clause}
       ORDER BY created_at DESC LIMIT ?`
    )
    .all(...params, limit) as Record<string, unknown>[];
  return rows.map(mapInteraction);
}
