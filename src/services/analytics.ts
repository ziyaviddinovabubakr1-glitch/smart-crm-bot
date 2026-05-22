import { ACTIVE_STATUSES } from "@/config/constants";
import { getDb } from "@/lib/db";
import type { LeadSource, LeadStatus } from "@/types";

export async function getAnalyticsOverview() {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as c FROM leads").get() as { c: number }).c;

  const statusRows = db
    .prepare("SELECT status, COUNT(*) as count FROM leads GROUP BY status")
    .all() as { status: string; count: number }[];

  const sourceRows = db
    .prepare("SELECT source, COUNT(*) as count FROM leads GROUP BY source")
    .all() as { source: string; count: number }[];

  const counts: Record<string, number> = {};
  for (const row of statusRows) counts[row.status] = row.count;

  const sources: Record<string, number> = {};
  for (const row of sourceRows) sources[row.source] = row.count;

  const won = counts.won ?? 0;
  const lost = counts.lost ?? 0;
  const conversion = total ? Math.round((won / total) * 100) : 0;

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const leadsThisWeek = (
    db.prepare("SELECT COUNT(*) as c FROM leads WHERE created_at >= ?").get(weekAgo) as {
      c: number;
    }
  ).c;

  const active = ACTIVE_STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);

  return { total, counts, sources, won, lost, conversion, leadsThisWeek, active };
}

export async function getFunnelData() {
  const { counts, total } = await getAnalyticsOverview();
  const pipeline: LeadStatus[] = [
    "new",
    "contacted",
    "qualified",
    "proposal",
    "won",
    "lost",
  ];

  return pipeline.map((stage) => ({
    stage,
    count: counts[stage] ?? 0,
    pct: total ? Math.round(((counts[stage] ?? 0) / total) * 100) : 0,
  }));
}

export async function getSourcePerformance() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT source,
              COUNT(*) as total,
              SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won
       FROM leads GROUP BY source`
    )
    .all() as { source: LeadSource; total: number; won: number }[];

  return rows.map((row) => ({
    source: row.source,
    total: row.total,
    won: row.won,
    conversion: row.total ? Math.round((row.won / row.total) * 100) : 0,
  }));
}

export async function getDailyLeads(days = 14) {
  const db = getDb();
  const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const rows = db
    .prepare(
      `SELECT substr(created_at, 1, 10) as day, COUNT(*) as count
       FROM leads WHERE created_at >= ?
       GROUP BY day ORDER BY day ASC`
    )
    .all(since) as { day: string; count: number }[];

  return rows;
}

export async function getDealAnalytics(session: import("@/types").SessionUser) {
  const db = getDb();
  const { userScopeClause } = await import("@/lib/auth/scope");
  const { clause, params } = userScopeClause(session, "d.user_id");

  const totals = db
    .prepare(
      `SELECT
         COUNT(*) as total,
         COALESCE(SUM(amount), 0) as revenue,
         COALESCE(AVG(amount), 0) as avg_check,
         SUM(CASE WHEN stage = 'closed' THEN 1 ELSE 0 END) as won,
         SUM(CASE WHEN stage = 'rejected' THEN 1 ELSE 0 END) as lost
       FROM deals d WHERE 1=1 ${clause}`
    )
    .get(...params) as { total: number; revenue: number; avg_check: number; won: number; lost: number };

  const byStage = db
    .prepare(
      `SELECT stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
       FROM deals d WHERE 1=1 ${clause}
       GROUP BY stage ORDER BY count DESC`
    )
    .all(...params) as { stage: string; count: number; total: number }[];

  const bySource = db
    .prepare(
      `SELECT c.source, COUNT(d.id) as count, COALESCE(SUM(d.amount), 0) as total
       FROM deals d JOIN clients c ON c.id = d.client_id
       WHERE 1=1 ${clause}
       GROUP BY c.source`
    )
    .all(...params) as { source: string; count: number; total: number }[];

  const closed = totals.won + totals.lost;
  const winRate = closed ? Math.round((totals.won / closed) * 100) : 0;

  return {
    ...totals,
    winRate,
    byStage,
    bySource,
    avgCheck: Math.round(totals.avg_check),
  };
}

export async function getRevenueAnalytics(session: import("@/types").SessionUser, months = 6) {
  const db = getDb();
  const { userScopeClause } = await import("@/lib/auth/scope");
  const { clause, params } = userScopeClause(session, "d.user_id");

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const rows = db
    .prepare(
      `SELECT substr(created_at, 1, 7) as month,
              COALESCE(SUM(amount), 0) as total,
              COUNT(*) as count
       FROM deals d
       WHERE stage = 'closed' AND created_at >= ? ${clause}
       GROUP BY month ORDER BY month ASC`
    )
    .all(since.toISOString(), ...params) as { month: string; total: number; count: number }[];

  return rows;
}

export async function getManagerPerformance(session: import("@/types").SessionUser) {
  const db = getDb();
  const { canAccessAllData } = await import("@/lib/auth/scope");

  if (!canAccessAllData(session.role)) {
    const deals = db
      .prepare(
        `SELECT COUNT(*) as deals,
                COALESCE(SUM(CASE WHEN stage = 'closed' THEN amount ELSE 0 END), 0) as revenue,
                SUM(CASE WHEN stage = 'closed' THEN 1 ELSE 0 END) as won
         FROM deals WHERE user_id = ?`
      )
      .get(session.id) as { deals: number; revenue: number; won: number };

    return [
      {
        user_id: session.id,
        name: session.name,
        deals: deals.deals,
        revenue: deals.revenue,
        won: deals.won,
      },
    ];
  }

  const rows = db
    .prepare(
      `SELECT u.id as user_id, u.name,
              COUNT(d.id) as deals,
              COALESCE(SUM(CASE WHEN d.stage = 'closed' THEN d.amount ELSE 0 END), 0) as revenue,
              SUM(CASE WHEN d.stage = 'closed' THEN 1 ELSE 0 END) as won
       FROM users u
       LEFT JOIN deals d ON d.user_id = u.id
       GROUP BY u.id, u.name
       ORDER BY revenue DESC`
    )
    .all() as { user_id: string; name: string; deals: number; revenue: number; won: number }[];

  return rows;
}

export async function getAnalyticsDashboard(session: import("@/types").SessionUser) {
  const { getCrmDashboardStats } = await import("@/services/crm-dashboard");
  const { getPendingTaskCount } = await import("@/services/tasks");
  const { getDashboardStats } = await import("@/services/leads");

  const [leads, crm, tasks, deals] = await Promise.all([
    getDashboardStats(),
    getCrmDashboardStats(session),
    getPendingTaskCount(session),
    getDealAnalytics(session),
  ]);

  return { leads, crm, pendingTasks: tasks, deals };
}
