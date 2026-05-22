import Link from "next/link";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/core/permissions/roles";
import { getClients, getClientsGroupedByStatus } from "@/services/clients";
import { ClientList } from "@/features/clients/components/client-list";
import { ClientsBoard } from "@/features/clients/components/clients-board";
import { ClientsCreateSection } from "@/features/clients/components/clients-create-section";
import { ClientSearch } from "@/features/clients/components/client-search";
import { ClientStatusFilter } from "@/features/clients/components/client-status-filter";
import { ClientsViewToggle } from "@/features/clients/components/clients-view-toggle";
import { DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClientStatus } from "@/types";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: ClientStatus;
    page?: string;
    showTest?: string;
    view?: string;
    created?: string;
  }>;
}) {
  const session = await getSession();
  const { search, status, page: pageRaw, showTest, view: viewRaw, created } = await searchParams;
  const view = viewRaw === "board" ? "board" : "table";
  const page = Math.max(1, Number(pageRaw ?? 1));
  const canWrite = session ? hasPermission(session.role, "clients:write") : false;
  const listQuery = { search, status, showTest, view: view === "table" ? "table" : undefined };
  const hideTest = showTest !== "1";

  const result =
    session && view === "table"
      ? await getClients({ search, status, page, limit: 20, hideTest }, session)
      : { clients: [], page: 1, pages: 1, total: 0 };

  const grouped =
    session && view === "board"
      ? await getClientsGroupedByStatus({ search, hideTest }, session)
      : null;

  const boardTotal = grouped
    ? Object.values(grouped).reduce((sum, list) => sum + list.length, 0)
    : 0;

  return (
    <DashboardPageFrame
      title="Клиенты"
      description="Воронка продаж по статусам, быстрая смена этапа и источник прихода"
    >
      <div className="space-y-4 p-4 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Suspense fallback={<Input placeholder="Поиск…" className="max-w-md" disabled />}>
              <ClientSearch defaultValue={search} />
            </Suspense>
            {view === "table" && <ClientStatusFilter defaultValue={status} />}
            <Suspense fallback={null}>
              <ClientsViewToggle view={view} />
            </Suspense>
          </div>
          <Link
            href={
              search || status
                ? `/api/clients/export?${new URLSearchParams({
                    ...(search ? { search } : {}),
                    ...(status ? { status } : {}),
                  }).toString()}`
                : "/api/clients/export"
            }
          >
            <Button variant="outline" className="w-full sm:w-auto">
              Экспорт CSV
            </Button>
          </Link>
        </div>

        {canWrite && <ClientsCreateSection />}

        {created && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Клиент успешно создан и добавлен в список ниже.
          </p>
        )}

        {search && view === "table" && (
          <p className="text-sm text-neutral-500">
            Поиск по всем статусам — фильтр «Статус» не применяется, пока активен поиск.
          </p>
        )}

        {view === "board" && grouped ? (
          <div className="space-y-3">
            <p className="text-sm text-neutral-500">
              {boardTotal === 0
                ? "Клиентов не найдено"
                : `${boardTotal} клиентов в воронке${search ? ` по запросу «${search}»` : ""}`}
            </p>
            <ClientsBoard grouped={grouped} canWrite={canWrite} />
          </div>
        ) : (
          <ClientList
            clients={result.clients}
            page={result.page}
            pages={result.pages}
            total={result.total}
            query={listQuery}
            canWrite={canWrite}
          />
        )}
      </div>
    </DashboardPageFrame>
  );
}
