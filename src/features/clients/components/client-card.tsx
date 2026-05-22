"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Client, ClientNote, ClientFieldDefinition, DealWithClient, Interaction } from "@/types";
import { clientFullName } from "@/lib/db/mappers";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CLIENT_STATUSES, DEAL_STAGES } from "@/config/constants";
import { ClientEditForm } from "@/features/clients/components/client-edit-form";
import { CommunicationForm } from "@/features/clients/components/communication-form";
import { CommunicationHistory } from "@/features/clients/components/communication-history";
import {
  addNoteFormAction,
  archiveClientAction,
  createDealFormAction,
} from "@/features/clients/actions";

type Tab = "info" | "deals" | "history" | "notes";

const statusLabel = Object.fromEntries(CLIENT_STATUSES.map((s) => [s.value, s.label]));
const statusColor = Object.fromEntries(CLIENT_STATUSES.map((s) => [s.value, s.color]));

export function ClientCard({
  client,
  deals,
  interactions,
  notes,
  fieldDefinitions,
  canWrite,
}: {
  client: Client;
  deals: DealWithClient[];
  interactions: Interaction[];
  notes: ClientNote[];
  fieldDefinitions: ClientFieldDefinition[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("info");
  const [editing, setEditing] = useState(false);

  const tabs: { id: Tab; label: string }[] = [
    { id: "info", label: "Инфо" },
    { id: "deals", label: "Сделки" },
    { id: "history", label: "История" },
    { id: "notes", label: "Заметки" },
  ];

  async function onArchive() {
    if (!confirm("Переместить клиента в архив?")) return;
    await archiveClientAction(client.id);
    router.push("/clients");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={clientFullName(client)} className="h-14 w-14 text-lg" />
          <div>
            <h2 className="text-xl font-semibold">{clientFullName(client)}</h2>
            <p className="text-sm text-neutral-500">
              {client.phone} · {client.email ?? "без email"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge className={statusColor[client.status]}>
                {statusLabel[client.status] ?? client.status}
              </Badge>
              {client.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
        {canWrite && (
          <div className="flex flex-wrap gap-2">
            {client.phone && (
              <a href={`tel:${client.phone}`}>
                <Button variant="outline" type="button">
                  Позвонить
                </Button>
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`}>
                <Button variant="outline" type="button">
                  Написать
                </Button>
              </a>
            )}
            <Button variant="outline" type="button" onClick={() => { setTab("info"); setEditing(true); }}>
              Редактировать
            </Button>
            <Button variant="outline" type="button" onClick={() => setTab("notes")}>
              + Заметка
            </Button>
            <Button variant="outline" type="button" onClick={() => setTab("deals")}>
              + Сделка
            </Button>
            <Button variant="outline" type="button" onClick={onArchive}>
              В архив
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-neutral-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Редактирование" : "Контактная информация"}</CardTitle>
          </CardHeader>
          <CardContent>
            {editing && canWrite ? (
              <ClientEditForm client={client} onCancel={() => setEditing(false)} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Компания" value={client.company ?? "—"} />
                <InfoRow label="Источник" value={client.source} />
                <InfoRow
                  label="Создан"
                  value={new Date(client.created_at).toLocaleString("ru-RU")}
                />
                <InfoRow
                  label="Обновлён"
                  value={new Date(client.updated_at).toLocaleString("ru-RU")}
                />
                {fieldDefinitions.map((field) => (
                  <InfoRow
                    key={field.id}
                    label={field.label}
                    value={String(client.custom_fields[field.field_key] ?? "—")}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "deals" && (
        <div className="space-y-4">
          {canWrite && (
            <form
              action={createDealFormAction}
              className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-4"
            >
              <input type="hidden" name="client_id" value={client.id} />
              <div className="sm:col-span-2">
                <Label>Название сделки</Label>
                <Input name="title" required defaultValue="Новая сделка" className="mt-1" />
              </div>
              <div>
                <Label>Сумма</Label>
                <Input name="amount" type="number" min="0" defaultValue="0" className="mt-1" />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  Добавить сделку
                </Button>
              </div>
            </form>
          )}
          {deals.length === 0 ? (
            <p className="text-sm text-neutral-500">Сделок пока нет</p>
          ) : (
            deals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium">{deal.title}</p>
                  <p className="text-sm text-neutral-500">
                    {DEAL_STAGES.find((s) => s.value === deal.stage)?.label ?? deal.stage} ·{" "}
                    {deal.amount.toLocaleString("ru-RU")} {deal.currency}
                  </p>
                </div>
                <Link href={`/deals/${deal.id}`} className="text-sm text-neutral-600 hover:underline">
                  Открыть сделку
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          {canWrite && (
            <CommunicationForm clientId={client.id} onSuccess={() => router.refresh()} />
          )}
          <CommunicationHistory communications={interactions} canWrite={canWrite} />
        </div>
      )}

      {tab === "notes" && (
        <div className="space-y-4">
          {canWrite && (
            <form action={addNoteFormAction} className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
              <input type="hidden" name="client_id" value={client.id} />
              <Label>Новая заметка</Label>
              <Textarea name="text" required rows={3} />
              <Button type="submit">Сохранить заметку</Button>
            </form>
          )}
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
              <p>{note.text}</p>
              <p className="mt-2 text-xs text-neutral-500">
                {new Date(note.created_at).toLocaleString("ru-RU")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
