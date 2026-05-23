import { emit } from "@/core/events";
import { getDb, newId, nowIso, sqlParams } from "@/lib/db";
import { mapDealWithClient } from "@/lib/db/mappers";
import { userScopeClause } from "@/lib/auth/scope";
import type { DealStage, DealWithClient, SessionUser } from "@/types";
import { ACTIVE_DEAL_STAGES } from "@/config/constants";
import { getPipelineStages } from "@/services/pipeline-stages";

export async function getDeals(session: SessionUser, clientId?: string) {
  const db = getDb();
  const { clause, params } = userScopeClause(session, "d.user_id");
  const conditions = [`1=1 ${clause}`];
  const queryParams: unknown[] = [...params];

  if (clientId) {
    conditions.push("d.client_id = ?");
    queryParams.push(clientId);
  }

  const rows = db
    .prepare(
      `SELECT d.*, c.first_name as client_first_name, c.last_name as client_last_name,
              c.company as client_company, c.phone as client_phone
       FROM deals d
       JOIN clients c ON c.id = d.client_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY d.updated_at DESC`
    )
    .all(...sqlParams(queryParams)) as Record<string, unknown>[];

  return rows.map(mapDealWithClient) as DealWithClient[];
}

export async function getDealsByStage(session: SessionUser) {
  const [deals, stages] = await Promise.all([getDeals(session), getPipelineStages()]);
  const grouped = Object.fromEntries(
    stages.map((s) => [s.value, [] as DealWithClient[]])
  ) as Record<string, DealWithClient[]>;

  for (const deal of deals) {
    if (!grouped[deal.stage]) grouped[deal.stage] = [];
    grouped[deal.stage].push(deal);
  }
  return { grouped, stages };
}

export async function getDealById(id: string, session: SessionUser) {
  const db = getDb();
  const { clause, params } = userScopeClause(session, "d.user_id");
  const row = db
    .prepare(
      `SELECT d.*, c.first_name as client_first_name, c.last_name as client_last_name,
              c.company as client_company, c.phone as client_phone
       FROM deals d
       JOIN clients c ON c.id = d.client_id
       WHERE d.id = ? ${clause}`
    )
    .get(id, ...params) as Record<string, unknown> | undefined;

  return row ? (mapDealWithClient(row) as DealWithClient) : null;
}

export async function createDeal(
  session: SessionUser,
  input: {
    client_id: string;
    title: string;
    amount?: number;
    currency?: string;
    probability?: number;
    payment_status?: import("@/types").PaymentStatus;
    stage?: DealStage;
    close_date?: string | null;
    comment?: string | null;
  }
) {
  const db = getDb();
  const now = nowIso();
  const id = newId();

  db.prepare(
    `INSERT INTO deals (id, client_id, user_id, title, amount, currency, probability, payment_status, stage, close_date, comment, updated_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.client_id,
    session.id,
    input.title.trim(),
    input.amount ?? 0,
    input.currency ?? "RUB",
    input.probability ?? 50,
    input.payment_status ?? "unpaid",
    input.stage ?? "new",
    input.close_date ?? null,
    input.comment?.trim() || null,
    session.id,
    now,
    now
  );

  return getDealById(id, session);
}

export async function updateDealStage(session: SessionUser, id: string, stage: DealStage) {
  const existing = await getDealById(id, session);
  if (!existing) return null;

  const db = getDb();
  const now = nowIso();
  db.prepare(
    `UPDATE deals SET stage = ?, updated_by = ?, updated_at = ? WHERE id = ?`
  ).run(stage, session.id, now, id);

  if (stage === "closed") {
    await emit({ type: "deal.won", leadId: id });
    const { createNotification } = await import("@/services/notifications");
    await createNotification(session.id, {
      type: "deal",
      title: "Сделка выиграна!",
      message: existing.title,
      href: `/deals/${id}`,
    });
  } else if (stage === "rejected") {
    await emit({ type: "deal.lost", leadId: id });
  }

  return getDealById(id, session);
}

export async function updateDeal(
  session: SessionUser,
  id: string,
  input: Partial<{
    title: string;
    amount: number;
    currency: string;
    probability: number;
    payment_status: import("@/types").PaymentStatus;
    stage: DealStage;
    close_date: string | null;
    comment: string | null;
  }>
) {
  const existing = await getDealById(id, session);
  if (!existing) return null;

  const db = getDb();
  const now = nowIso();

  db.prepare(
    `UPDATE deals SET title = ?, amount = ?, currency = ?, probability = ?, payment_status = ?, stage = ?, close_date = ?, comment = ?, updated_by = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    input.title?.trim() ?? existing.title,
    input.amount ?? existing.amount,
    input.currency ?? existing.currency,
    input.probability ?? existing.probability,
    input.payment_status ?? existing.payment_status,
    input.stage ?? existing.stage,
    input.close_date !== undefined ? input.close_date : existing.close_date,
    input.comment !== undefined ? input.comment : existing.comment,
    session.id,
    now,
    id
  );

  if (input.stage === "closed") {
    await emit({ type: "deal.won", leadId: id });
  } else if (input.stage === "rejected") {
    await emit({ type: "deal.lost", leadId: id });
  }

  return getDealById(id, session);
}

export async function deleteDeal(session: SessionUser, id: string) {
  const existing = await getDealById(id, session);
  if (!existing) return null;

  const db = getDb();
  db.prepare("DELETE FROM deals WHERE id = ?").run(id);
  return existing;
}

export async function getDealStageTotals(session: SessionUser) {
  const db = getDb();
  const { clause, params } = userScopeClause(session);
  const rows = db
    .prepare(
      `SELECT stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
       FROM deals WHERE 1=1 ${clause}
       GROUP BY stage`
    )
    .all(...params) as { stage: DealStage; count: number; total: number }[];

  return rows;
}

export async function getActiveDealsCount(session: SessionUser) {
  const db = getDb();
  const { clause, params } = userScopeClause(session);
  const row = db
    .prepare(
      `SELECT COUNT(*) as c FROM deals
       WHERE stage IN (${ACTIVE_DEAL_STAGES.map(() => "?").join(",")}) ${clause}`
    )
    .get(...ACTIVE_DEAL_STAGES, ...params) as { c: number };
  return row.c;
}
