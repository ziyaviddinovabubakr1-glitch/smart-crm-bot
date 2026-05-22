"use client";

import { createTaskFormAction } from "@/features/tasks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TASK_PRIORITIES, TASK_TYPES } from "@/config/constants";
import type { Client } from "@/types";
import { clientFullName } from "@/lib/db/mappers";

export function CreateTaskForm({ clients }: { clients: Client[] }) {
  return (
    <form
      action={createTaskFormAction}
      className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 lg:grid-cols-6"
    >
      <div className="lg:col-span-2">
        <Label htmlFor="title">Задача</Label>
        <Input id="title" name="title" required placeholder="Перезвонить клиенту" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="type">Тип</Label>
        <Select id="type" name="type" defaultValue="call" className="mt-1 w-full">
          {TASK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="priority">Приоритет</Label>
        <Select id="priority" name="priority" defaultValue="medium" className="mt-1 w-full">
          {TASK_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="due_date">Дедлайн</Label>
        <Input id="due_date" name="due_date" type="datetime-local" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="client_id">Клиент</Label>
        <Select id="client_id" name="client_id" className="mt-1 w-full">
          <option value="">Без клиента</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {clientFullName(c)}
            </option>
          ))}
        </Select>
      </div>
      <div className="lg:col-span-6">
        <Label htmlFor="description">Описание</Label>
        <Textarea id="description" name="description" rows={2} className="mt-1" />
      </div>
      <div className="lg:col-span-6">
        <Button type="submit">Создать задачу</Button>
      </div>
    </form>
  );
}
