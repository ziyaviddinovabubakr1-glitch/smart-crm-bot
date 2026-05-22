"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Client } from "@/types";
import { clientFullName } from "@/lib/db/mappers";
import { bulkArchiveClientsAction } from "@/features/tasks/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CLIENT_STATUSES, SOURCE_LABEL } from "@/config/constants";
import { ClientStatusSelect } from "@/features/clients/components/client-status-select";

const statusLabel = Object.fromEntries(CLIENT_STATUSES.map((s) => [s.value, s.label]));
const statusColor = Object.fromEntries(CLIENT_STATUSES.map((s) => [s.value, s.color]));

function buildPageHref(
  page: number,
  query: { search?: string; status?: string; showTest?: string; view?: string }
) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.showTest === "1") params.set("showTest", "1");
  if (query.view === "table") params.set("view", "table");
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : "/clients";
}

export function ClientList({
  clients,
  page,
  pages,
  total,
  query,
  canWrite = false,
}: {
  clients: Client[];
  page: number;
  pages: number;
  total: number;
  query: { search?: string; status?: string; showTest?: string; view?: string };
  canWrite?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function toggleAll() {
    if (selected.length === clients.length) {
      setSelected([]);
    } else {
      setSelected(clients.map((c) => c.id));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function bulkArchive() {
    if (!selected.length || !confirm(`Архивировать ${selected.length} клиентов?`)) return;
    startTransition(async () => {
      await bulkArchiveClientsAction(selected);
      setSelected([]);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-500">
        <span>
          {total === 0
            ? "Клиентов не найдено"
            : `Показано ${clients.length} из ${total}${query.search ? ` по запросу «${query.search}»` : ""}`}
        </span>
        <div className="flex items-center gap-3">
          {canWrite && selected.length > 0 && (
            <Button size="sm" variant="outline" disabled={pending} onClick={bulkArchive}>
              В архив ({selected.length})
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/80 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                {canWrite && (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={clients.length > 0 && selected.length === clients.length}
                      onChange={toggleAll}
                      aria-label="Выбрать все"
                    />
                  </th>
                )}
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">Контакты</th>
                <th className="px-4 py-3">Компания</th>
                <th className="px-4 py-3">Источник</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Теги</th>
                <th className="px-4 py-3">Создан</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-neutral-50 transition hover:bg-primary/5">
                  {canWrite && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(client.id)}
                        onChange={() => toggleOne(client.id)}
                        aria-label={`Выбрать ${clientFullName(client)}`}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                      <Avatar name={clientFullName(client)} className="h-9 w-9 text-xs" />
                      <div>
                        <span className="font-medium text-neutral-900 hover:underline">
                          {clientFullName(client)}
                        </span>
                        {client.is_vip && (
                          <Badge className="ml-2 bg-warning/10 text-warning">VIP</Badge>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <div>{client.phone ?? "—"}</div>
                    <div className="text-xs text-neutral-500">{client.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">{client.company ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {SOURCE_LABEL[client.source] ?? client.source}
                  </td>
                  <td className="px-4 py-3">
                    {canWrite ? (
                      <ClientStatusSelect clientId={client.id} value={client.status} />
                    ) : (
                      <Badge className={statusColor[client.status]}>
                        {statusLabel[client.status] ?? client.status}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {client.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(client.created_at).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <p className="p-12 text-center text-neutral-500">
              {query.search
                ? "По вашему запросу ничего не найдено."
                : "Клиентов пока нет. Добавьте первого через форму выше."}
            </p>
          )}
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            Страница {page} из {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildPageHref(page - 1, query)} className="rounded border px-3 py-1 hover:bg-neutral-50">
                Назад
              </Link>
            )}
            {page < pages && (
              <Link href={buildPageHref(page + 1, query)} className="rounded border px-3 py-1 hover:bg-neutral-50">
                Далее
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
