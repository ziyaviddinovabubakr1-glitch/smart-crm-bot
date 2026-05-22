"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Client, ClientStatus } from "@/types";
import { CLIENT_STATUSES, SOURCE_LABEL } from "@/config/constants";
import { updateClientStatusAction } from "@/features/clients/actions";
import { ClientStatusSelect } from "@/features/clients/components/client-status-select";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { clientFullName } from "@/lib/db/mappers";
import { cn } from "@/lib/utils";

export function ClientsBoard({
  grouped,
  canWrite = false,
}: {
  grouped: Record<ClientStatus, Client[]>;
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDrop(targetStatus: ClientStatus, clientId: string) {
    if (!canWrite) return;
    startTransition(async () => {
      await updateClientStatusAction(clientId, targetStatus);
      router.refresh();
    });
  }

  const totalClients = CLIENT_STATUSES.reduce(
    (sum, status) => sum + (grouped[status.value]?.length ?? 0),
    0
  );

  if (totalClients === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-12 text-center text-neutral-500">
        Клиентов пока нет. Добавьте первого через форму выше.
      </div>
    );
  }

  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-4", pending && "opacity-70")}>
      {CLIENT_STATUSES.map((status) => {
        const clients = grouped[status.value] ?? [];
        return (
          <div
            key={status.value}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border border-neutral-200/80 bg-neutral-50/80 shadow-sm",
              "border-t-4",
              status.columnColor
            )}
            onDragOver={(e) => canWrite && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const clientId = e.dataTransfer.getData("text/client-id");
              if (clientId) onDrop(status.value, clientId);
            }}
          >
            <div className="border-b border-neutral-200/80 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-neutral-800">{status.label}</span>
                <Badge className={status.color}>{clients.length}</Badge>
              </div>
            </div>
            <div className="flex min-h-[280px] flex-1 flex-col gap-2 p-2">
              {clients.map((client) => (
                <div
                  key={client.id}
                  draggable={canWrite}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/client-id", client.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className={cn(
                    "rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md",
                    canWrite && "cursor-grab active:cursor-grabbing"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Avatar name={clientFullName(client)} className="h-8 w-8 shrink-0 text-[10px]" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/clients/${client.id}`}
                        className="block truncate font-medium text-neutral-900 hover:text-primary hover:underline"
                      >
                        {clientFullName(client)}
                      </Link>
                      {client.company && (
                        <p className="truncate text-xs text-neutral-500">{client.company}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-neutral-600">
                    {client.phone && <p>{client.phone}</p>}
                    {client.email && <p className="truncate text-neutral-500">{client.email}</p>}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge className="text-[10px]">{SOURCE_LABEL[client.source] ?? client.source}</Badge>
                    {client.is_vip && (
                      <Badge className="bg-warning/10 text-[10px] text-warning">VIP</Badge>
                    )}
                  </div>

                  {canWrite && (
                    <div className="mt-3">
                      <ClientStatusSelect
                        clientId={client.id}
                        value={client.status}
                        compact
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
              {clients.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-400">
                  {canWrite ? "Перетащите клиента сюда" : "Пусто"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
