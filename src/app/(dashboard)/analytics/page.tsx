import {
  getAnalyticsOverview,
  getFunnelData,
  getSourcePerformance,
  getDailyLeads,
  getDealAnalytics,
} from "@/services/analytics";
import { getSession } from "@/lib/auth";
import { DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEAL_STAGES, LEAD_STATUSES, SOURCE_LABEL } from "@/config/constants";

export default async function AnalyticsPage() {
  const session = await getSession();
  const [overview, funnel, sources, daily, deals] = await Promise.all([
    getAnalyticsOverview(),
    getFunnelData(),
    getSourcePerformance(),
    getDailyLeads(14),
    session ? getDealAnalytics(session) : null,
  ]);

  const maxDaily = Math.max(...daily.map((d) => d.count), 1);
  const stageLabel = Object.fromEntries(DEAL_STAGES.map((s) => [s.value, s.label]));

  return (
    <DashboardPageFrame title="Аналитика" description="Метрики продаж, сделки и воронка лидов">
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-500">
              Всего лидов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{overview.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-500">
              Конверсия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{overview.conversion}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-500">
              Выиграно
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{overview.won}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-500">
              За неделю
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{overview.leadsThisWeek}</p>
          </CardContent>
        </Card>
      </div>

      {deals && (
        <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-500">Сделок</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-primary">{deals.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-500">Выручка</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{deals.revenue.toLocaleString("ru-RU")} ₽</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-500">Средний чек</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{deals.avgCheck.toLocaleString("ru-RU")} ₽</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-500">Win rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-success">{deals.winRate}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 px-4 pb-6 lg:grid-cols-2 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Воронка лидов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnel.map((row) => {
              const label =
                LEAD_STATUSES.find((s) => s.value === row.stage)?.label ?? row.stage;
              return (
                <div key={row.stage}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-neutral-500">
                      {row.count} ({row.pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-neutral-900 transition-all"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Эффективность источников</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sources.length === 0 ? (
              <p className="text-sm text-neutral-500">Данных пока нет</p>
            ) : (
              sources.map((row) => (
                <div
                  key={row.source}
                  className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
                >
                  <span>{SOURCE_LABEL[row.source] ?? row.source}</span>
                  <span className="text-neutral-600">
                    {row.won}/{row.total} выиграно ({row.conversion}%)
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {deals && (
          <Card>
            <CardHeader>
              <CardTitle>Воронка сделок</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deals.byStage.map((row) => (
                <div key={row.stage}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{stageLabel[row.stage] ?? row.stage}</span>
                    <span className="text-neutral-500">
                      {row.count} · {row.total.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${deals.total ? Math.round((row.count / deals.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className={deals ? "" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle>Лиды по дням (14 дней)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-end gap-1">
              {daily.map((row) => (
                <div key={row.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-neutral-900"
                    style={{ height: `${(row.count / maxDaily) * 100}%`, minHeight: row.count ? 4 : 0 }}
                    title={`${row.day}: ${row.count}`}
                  />
                  <span className="text-[9px] text-neutral-400">
                    {row.day.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPageFrame>
  );
}
