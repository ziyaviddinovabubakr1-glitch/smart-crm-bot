"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COMMUNICATION_DIRECTION_LABEL,
  COMMUNICATION_STATUS_LABEL,
  INTERACTION_TYPES,
  SENTIMENT_COLOR,
  SENTIMENT_LABEL,
} from "@/config/constants";
import type { Interaction, InteractionType } from "@/types";

type CommunicationHistoryProps = {
  communications: Interaction[];
  canWrite?: boolean;
};

const typeLabel = Object.fromEntries(INTERACTION_TYPES.map((t) => [t.value, t.label]));

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU");
}

function formatDuration(seconds: number | null) {
  if (seconds == null || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} мин ${s} сек` : `${s} сек`;
}

export function CommunicationHistory({
  communications,
  canWrite = false,
}: CommunicationHistoryProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<InteractionType | "all">("all");
  const [search, setSearch] = useState("");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return communications.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!q) return true;
      const haystack = [
        item.content,
        item.subject,
        item.summary,
        item.outcome,
        item.channel,
        ...item.ai_tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [communications, typeFilter, search]);

  async function reanalyze(id: string) {
    setAnalyzingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/interactions/${id}/analyze`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Не удалось выполнить анализ");
        return;
      }
      router.refresh();
    } catch {
      setError("Ошибка сети при ИИ-анализе");
    } finally {
      setAnalyzingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Поиск по тексту, теме, тегам…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as InteractionType | "all")}
          className="w-full sm:w-48"
        >
          <option value="all">Все типы</option>
          {INTERACTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <span className="text-sm text-neutral-500">
          {filtered.length} из {communications.length}
        </span>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {communications.length === 0 ? (
        <EmptyState
          title="История пуста"
          description="Добавьте первый звонок, письмо или встречу — они появятся здесь с ИИ-анализом."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Ничего не найдено"
          description="Измените фильтр или поисковый запрос."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{typeLabel[item.type] ?? item.type}</Badge>
                  {item.direction && (
                    <Badge className="bg-sky-50 text-sky-800">
                      {COMMUNICATION_DIRECTION_LABEL[item.direction] ?? item.direction}
                    </Badge>
                  )}
                  {item.sentiment && (
                    <Badge className={SENTIMENT_COLOR[item.sentiment]}>
                      {SENTIMENT_LABEL[item.sentiment]}
                      {item.sentiment_score != null && (
                        <span className="ml-1 opacity-80">
                          ({item.sentiment_score > 0 ? "+" : ""}
                          {item.sentiment_score.toFixed(2)})
                        </span>
                      )}
                    </Badge>
                  )}
                  <Badge className="bg-neutral-100 text-neutral-700">
                    {COMMUNICATION_STATUS_LABEL[item.status] ?? item.status}
                  </Badge>
                </div>
                <time className="text-xs text-neutral-500" dateTime={item.start_time ?? item.created_at}>
                  {formatDate(item.start_time ?? item.created_at)}
                </time>
              </div>

              {item.subject && (
                <p className="mt-2 text-sm font-medium text-neutral-900">{item.subject}</p>
              )}

              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">{item.content}</p>

              {(item.channel || item.duration) && (
                <p className="mt-2 text-xs text-neutral-500">
                  {[item.channel, formatDuration(item.duration)].filter(Boolean).join(" · ")}
                </p>
              )}

              {analyzingId === item.id ? (
                <div className="mt-3 space-y-2 rounded-lg bg-violet-50/50 p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : item.summary || item.outcome || item.ai_tags.length > 0 ? (
                <div className="mt-3 space-y-2 rounded-lg border border-violet-100 bg-violet-50/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
                    ИИ-аналитика
                  </p>
                  {item.summary && (
                    <p className="text-sm text-neutral-800">
                      <span className="font-medium">Саммари:</span> {item.summary}
                    </p>
                  )}
                  {item.outcome && (
                    <p className="text-sm text-neutral-800">
                      <span className="font-medium">Результат:</span> {item.outcome}
                    </p>
                  )}
                  {item.ai_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.ai_tags.map((tag) => (
                        <Badge key={tag} className="bg-white text-violet-800">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-neutral-500">ИИ-анализ ещё не выполнен</p>
              )}

              {canWrite && (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={analyzingId === item.id}
                    onClick={() => reanalyze(item.id)}
                  >
                    {analyzingId === item.id ? "Анализ…" : "Переанализировать ИИ"}
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
