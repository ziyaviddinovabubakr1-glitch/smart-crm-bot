import Link from "next/link";
import { getDashboardStats } from "@/services/leads";
import { getCrmDashboardStats } from "@/services/crm-dashboard";
import { getTasksDue, getRecentClientInteractions } from "@/services/interactions";
import { getUpcomingReminders } from "@/services/reminders";
import { getPendingTaskCount, getTasksDueToday } from "@/services/tasks";
import { getSession } from "@/lib/auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEAL_STAGES } from "@/config/constants";
import {
  Users,
  UserPlus,
  Briefcase,
  Wallet,
  CheckCircle,
  AlertCircle,
  Percent,
} from "lucide-react";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [stats, crm, reminders, recentActivities, tasks, crmTasks, pendingTaskCount] =
    await Promise.all([
    getDashboardStats(),
    getCrmDashboardStats(session),
    getUpcomingReminders(5),
    getRecentClientInteractions(session, 8),
    getTasksDue(session, 7),
    getTasksDueToday(session),
    getPendingTaskCount(session),
  ]);

  const stageLabel = Object.fromEntries(DEAL_STAGES.map((s) => [s.value, s.label]));

  return (
    <DashboardPageFrame title="Дашборд" description="Обзор CRM: клиенты, сделки, задачи">
      <div className="space-y-6 p-4 lg:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <StatCard label="Клиентов" value={crm.totalClients} icon={Users} />
          <StatCard label="Активных сделок" value={crm.activeDeals} icon={Briefcase} />
          <StatCard label="Задач сегодня" value={crmTasks.length} icon={CheckCircle} />
          <StatCard label="Задач в очереди" value={pendingTaskCount} icon={AlertCircle} />
          <StatCard
            label="Сумма в воронке"
            value={`${crm.pipelineAmount.toLocaleString("ru-RU")} ₽`}
            icon={Wallet}
          />
          <StatCard label="Лидов всего" value={stats.total} icon={UserPlus} />
          <StatCard label="Новых сегодня" value={stats.newToday} icon={UserPlus} />
          <StatCard label="Выиграно (лиды)" value={stats.paid} icon={CheckCircle} />
          <StatCard label="Просрочено" value={stats.overdue} icon={AlertCircle} />
          <StatCard label="Конверсия" value={`${stats.conversion}%`} icon={Percent} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Новые клиенты за 30 дней</CardTitle>
            </CardHeader>
            <CardContent>
              {crm.dailyClients.length === 0 ? (
                <p className="text-sm text-neutral-500">Пока нет данных</p>
              ) : (
                <div className="flex h-32 items-end gap-1">
                  {crm.dailyClients.map((day) => (
                    <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-neutral-900"
                        style={{ height: `${Math.max(8, day.count * 12)}px` }}
                        title={`${day.day}: ${day.count}`}
                      />
                      <span className="text-[10px] text-neutral-400">
                        {day.day.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Сумма по этапам</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {crm.stageTotals.length === 0 ? (
                <p className="text-sm text-neutral-500">Сделок пока нет</p>
              ) : (
                crm.stageTotals.map((row) => (
                  <div
                    key={row.stage}
                    className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
                  >
                    <span>{stageLabel[row.stage] ?? row.stage}</span>
                    <span className="font-medium">
                      {row.total.toLocaleString("ru-RU")} ₽ · {row.count}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Задачи на сегодня</CardTitle>
              <Link href="/tasks" className="text-sm text-primary hover:underline">
                Все задачи
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {crmTasks.length === 0 ? (
                <p className="text-sm text-neutral-500">Нет задач на сегодня</p>
              ) : (
                crmTasks.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="block rounded-lg bg-neutral-50 px-3 py-2 text-sm hover:bg-primary/5"
                  >
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-neutral-500">
                      {task.client_name ?? task.lead_name ?? "Без привязки"}
                      {task.due_date ? ` · ${formatDateTime(task.due_date)}` : ""}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Задачи (интеракции)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-neutral-500">Нет задач</p>
              ) : (
                tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/clients/${task.client_id}`}
                    className="block rounded-lg bg-neutral-50 px-3 py-2 text-sm hover:bg-neutral-100"
                  >
                    <p className="font-medium">{task.content}</p>
                    <p className="text-xs text-neutral-500">
                      {task.client_name} · {formatDateTime(task.scheduled_at!)}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Напоминания</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reminders.length === 0 ? (
                <p className="text-sm text-neutral-500">Нет напоминаний</p>
              ) : (
                reminders.map((r) => (
                  <Link
                    key={r.id}
                    href={`/leads/${r.lead_id}`}
                    className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm hover:bg-neutral-100"
                  >
                    <span className="font-medium">{r.lead?.name ?? "Лид"}</span>
                    <span className="text-neutral-500">{formatDateTime(r.remind_at)}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Последняя активность</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-neutral-500">Пока пусто</p>
              ) : (
                recentActivities.map((a) => (
                  <Link
                    key={a.id}
                    href={`/clients/${a.client_id}`}
                    className="block rounded-lg bg-neutral-50 px-3 py-2 text-sm hover:bg-neutral-100"
                  >
                    <p className="line-clamp-1">{a.content}</p>
                    <p className="text-xs text-neutral-500">
                      {formatDateTime(a.created_at)} · {a.type}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          <Link
            href="/clients"
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-neutral-800"
          >
            Клиенты
          </Link>
          <Link
            href="/deals"
            className="rounded-lg border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium hover:bg-neutral-50"
          >
            Сделки
          </Link>
          <Link
            href="/tasks"
            className="rounded-lg border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium hover:bg-neutral-50"
          >
            Задачи
          </Link>
          <Link
            href="/pipeline"
            className="rounded-lg border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium hover:bg-neutral-50"
          >
            Воронка лидов
          </Link>
          <Link
            href="/analytics"
            className="rounded-lg border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium hover:bg-neutral-50"
          >
            Аналитика
          </Link>
        </div>
      </div>
    </DashboardPageFrame>
  );
}
