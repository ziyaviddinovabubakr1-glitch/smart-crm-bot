import { getDb } from "@/lib/db";
import { userScopeClause } from "@/lib/auth/scope";
import { ACTIVE_DEAL_STAGES } from "@/config/constants";
import type { DealStage, SessionUser } from "@/types";

export async function getCrmDashboardStats(session: SessionUser) {
  const db = getDb();
  const { clause, params } = userScopeClause(session);

  const clients = db
    .prepare(`SELECT COUNT(*) as c FROM clients WHERE is_archived = 0 ${clause}`)
    .get(...params) as { c: number };

  const activeDeals = db
    .prepare(
      `SELECT COUNT(*) as c FROM deals
       WHERE stage IN (${ACTIVE_DEAL_STAGES.map(() => "?").join(",")}) ${clause}`
    )
    .get(...ACTIVE_DEAL_STAGES, ...params) as { c: number };

  const pipelineTotal = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM deals
       WHERE stage IN (${ACTIVE_DEAL_STAGES.map(() => "?").join(",")}) ${clause}`
    )
    .get(...ACTIVE_DEAL_STAGES, ...params) as { total: number };

  const stageRows = db
    .prepare(
      `SELECT stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
       FROM deals WHERE 1=1 ${clause}
       GROUP BY stage`
    )
    .all(...params) as { stage: DealStage; count: number; total: number }[];

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const dailyClients = db
    .prepare(
      `SELECT date(created_at) as day, COUNT(*) as count
       FROM clients
       WHERE created_at >= ? AND is_archived = 0 ${clause}
       GROUP BY date(created_at)
       ORDER BY day ASC`
    )
    .all(since.toISOString(), ...params) as { day: string; count: number }[];

  return {
    totalClients: clients.c,
    activeDeals: activeDeals.c,
    pipelineAmount: pipelineTotal.total,
    stageTotals: stageRows,
    dailyClients,
  };
}
