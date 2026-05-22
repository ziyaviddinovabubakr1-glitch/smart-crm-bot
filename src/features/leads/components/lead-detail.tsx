"use client";

import { useState, useTransition } from "react";
import type { Lead, Note, Reminder, Activity } from "@/types";
import { LEAD_STATUSES, AI_TEMPERATURE_LABEL, SOURCE_LABEL } from "@/config/constants";
import {
  updateStatusAction,
  addNoteAction,
  addReminderAction,
  setNextCallAction,
  convertLeadAction,
} from "@/features/leads/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ActivityTimeline } from "@/features/leads/components/activity-timeline";
import { Badge } from "@/components/ui/badge";

const tempEmoji = AI_TEMPERATURE_LABEL;

interface LeadDetailProps {
  lead: Lead;
  notes: Note[];
  reminders: Reminder[];
  activities: Activity[];
}

export function LeadDetail({ lead, notes, reminders, activities }: LeadDetailProps) {
  const [note, setNote] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [remindComment, setRemindComment] = useState("");
  const [nextCall, setNextCall] = useState(
    lead.next_call ? lead.next_call.slice(0, 16) : ""
  );
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-neutral-500">Имя</p>
                <p className="font-medium">{lead.name}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Телефон</p>
                <p className="font-medium">{lead.phone ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Email</p>
                <p className="font-medium">{lead.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Оценка</p>
                <p className="font-medium">{lead.score}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Источник</p>
                <p className="font-medium">{SOURCE_LABEL[lead.source] ?? lead.source}</p>
              </div>
              {(lead.tags ?? []).length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-neutral-500">Теги</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {lead.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="status">Статус</Label>
                <Select
                  id="status"
                  className="mt-1"
                  value={lead.status}
                  onChange={(e) =>
                    startTransition(() => {
                      void updateStatusAction(lead.id, e.target.value as Lead["status"]);
                    })
                  }
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {lead.message && (
              <div className="rounded-lg bg-neutral-50 p-4">
                <p className="text-xs font-medium text-neutral-500">Сообщение Telegram</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{lead.message}</p>
              </div>
            )}
            {lead.status !== "won" && lead.status !== "lost" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <p className="text-sm font-medium text-emerald-900">Конвертация в клиента</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Создаст карточку клиента с данными лида и отметит лид как выигранный
                </p>
                <Button
                  className="mt-3"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await convertLeadAction(lead.id);
                    })
                  }
                >
                  Конвертировать в клиента
                </Button>
              </div>
            )}
            <div>
              <Label htmlFor="next_call">Следующий звонок</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="next_call"
                  type="datetime-local"
                  value={nextCall}
                  onChange={(e) => setNextCall(e.target.value)}
                />
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => {
                      void setNextCallAction(
                        lead.id,
                        nextCall ? new Date(nextCall).toISOString() : null
                      );
                    })
                  }
                >
                  Сохранить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Заметки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Добавить комментарий..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
              <Button
                disabled={pending || !note.trim()}
                onClick={() =>
                  startTransition(async () => {
                    await addNoteAction(lead.id, note);
                    setNote("");
                  })
                }
              >
                Добавить
              </Button>
            </div>
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg border border-neutral-100 p-3 text-sm">
                  <p>{n.content}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {new Date(n.created_at).toLocaleString("ru-RU")}
                  </p>
                </li>
              ))}
              {notes.length === 0 && (
                <p className="text-sm text-neutral-500">Заметок пока нет</p>
              )}
            </ul>
          </CardContent>
        </Card>

        <ActivityTimeline activities={activities} />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI-анализ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {lead.ai_temperature && (
              <Badge>{tempEmoji[lead.ai_temperature]}</Badge>
            )}
            <p>
              <span className="font-medium">Оценка:</span> {lead.ai_score}%
            </p>
            {lead.ai_summary ? (
              <p className="text-neutral-600">{lead.ai_summary}</p>
            ) : (
              <p className="text-neutral-500">AI анализ появится после сообщения</p>
            )}
            {(lead.ai_recommendations ?? []).length > 0 && (
              <ul className="list-inside list-disc space-y-1 text-neutral-600">
                {lead.ai_recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Напоминание</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
            />
            <Input
              placeholder="Комментарий (опционально)"
              value={remindComment}
              onChange={(e) => setRemindComment(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={pending || !remindAt}
              onClick={() =>
                startTransition(async () => {
                  await addReminderAction(
                    lead.id,
                    new Date(remindAt).toISOString(),
                    remindComment
                  );
                  setRemindAt("");
                  setRemindComment("");
                })
              }
            >
              Создать напоминание
            </Button>
            <ul className="space-y-2 pt-2">
              {reminders.map((r) => (
                <li key={r.id} className="text-xs text-neutral-600">
                  {new Date(r.remind_at).toLocaleString("ru-RU")} — {r.status}
                  {r.comment && `: ${r.comment}`}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
