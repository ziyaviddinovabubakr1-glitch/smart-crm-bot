"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/types";
import { CLIENT_SOURCES, CLIENT_STATUSES } from "@/config/constants";
import { updateClientAction } from "@/features/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";

export function ClientEditForm({
  client,
  onCancel,
}: {
  client: Client;
  onCancel: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [tags, setTags] = useState(client.tags.join(", "));

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set("tags", tags);
        startTransition(async () => {
          try {
            await updateClientAction(client.id, formData);
            toast.success("Данные клиента обновлены");
            router.refresh();
            onCancel();
          } catch {
            toast.error("Не удалось сохранить");
          }
        });
      }}
    >
      <div>
        <Label htmlFor="first_name">Имя</Label>
        <Input id="first_name" name="first_name" defaultValue={client.first_name} required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="last_name">Фамилия</Label>
        <Input id="last_name" name="last_name" defaultValue={client.last_name} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="phone">Телефон</Label>
        <Input id="phone" name="phone" defaultValue={client.phone} required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={client.email ?? ""} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="company">Компания</Label>
        <Input id="company" name="company" defaultValue={client.company ?? ""} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="status">Статус</Label>
        <Select id="status" name="status" defaultValue={client.status} className="mt-1 w-full">
          {CLIENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="source">Источник</Label>
        <Select id="source" name="source" defaultValue={client.source} className="mt-1 w-full">
          {CLIENT_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="tags">Теги (через запятую)</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1" />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Сохранение…" : "Сохранить изменения"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
