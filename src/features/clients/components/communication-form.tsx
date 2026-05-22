"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_DIRECTION_LABEL,
  INTERACTION_TYPES,
} from "@/config/constants";
import type { CommunicationDirection, InteractionType } from "@/types";

type CommunicationFormProps = {
  clientId: string;
  onSuccess?: () => void;
};

export function CommunicationForm({ clientId, onSuccess }: CommunicationFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<InteractionType>("call");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const scheduledAt = String(fd.get("scheduled_at") ?? "").trim();
    const startTime = String(fd.get("start_time") ?? "").trim();
    const endTime = String(fd.get("end_time") ?? "").trim();
    const durationRaw = String(fd.get("duration") ?? "").trim();
    const direction = String(fd.get("direction") ?? "").trim();

    try {
      const res = await fetch(`/api/clients/${clientId}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: fd.get("type"),
          content: String(fd.get("content") ?? "").trim(),
          subject: String(fd.get("subject") ?? "").trim() || null,
          direction: direction ? (direction as CommunicationDirection) : null,
          channel: String(fd.get("channel") ?? "").trim() || null,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          start_time: startTime ? new Date(startTime).toISOString() : null,
          end_time: endTime ? new Date(endTime).toISOString() : null,
          duration: durationRaw ? Number(durationRaw) : null,
          analyze: fd.get("analyze") === "on",
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Не удалось сохранить коммуникацию");
        return;
      }

      e.currentTarget.reset();
      setType("call");
      onSuccess?.();
    } catch {
      setError("Ошибка сети. Проверьте подключение.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4"
    >
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">Новая коммуникация</h3>
        <p className="text-xs text-neutral-500">Запись сохранится в историю с ИИ-анализом</p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="comm-type">Тип</Label>
          <Select
            id="comm-type"
            name="type"
            className="mt-1 w-full"
            value={type}
            onChange={(e) => setType(e.target.value as InteractionType)}
          >
            {INTERACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="comm-direction">Направление</Label>
          <Select id="comm-direction" name="direction" className="mt-1 w-full" defaultValue="">
            <option value="">—</option>
            {Object.entries(COMMUNICATION_DIRECTION_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="comm-channel">Канал</Label>
          <Select id="comm-channel" name="channel" className="mt-1 w-full" defaultValue="">
            <option value="">—</option>
            {COMMUNICATION_CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="comm-duration">Длительность (сек)</Label>
          <Input id="comm-duration" name="duration" type="number" min="0" className="mt-1" />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="comm-subject">Тема</Label>
          <Input id="comm-subject" name="subject" placeholder="Тема письма или встречи" className="mt-1" />
        </div>

        <div>
          <Label htmlFor="comm-start">Начало</Label>
          <Input id="comm-start" name="start_time" type="datetime-local" className="mt-1" />
        </div>

        <div>
          <Label htmlFor="comm-end">Окончание</Label>
          <Input id="comm-end" name="end_time" type="datetime-local" className="mt-1" />
        </div>

        {type === "task" && (
          <div>
            <Label htmlFor="comm-scheduled">Дедлайн задачи</Label>
            <Input id="comm-scheduled" name="scheduled_at" type="datetime-local" className="mt-1" />
          </div>
        )}

        <div className="sm:col-span-2 lg:col-span-4">
          <Label htmlFor="comm-content">Содержание *</Label>
          <Textarea
            id="comm-content"
            name="content"
            required
            rows={4}
            placeholder="Текст письма, заметки или транскрипция звонка..."
            className="mt-1"
          />
        </div>

        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-4">
          <input id="comm-analyze" name="analyze" type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          <Label htmlFor="comm-analyze" className="font-normal">
            Запустить ИИ-анализ после сохранения
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Сохранение…" : "Добавить в историю"}
      </Button>
    </form>
  );
}
