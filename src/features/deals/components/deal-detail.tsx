"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DealWithClient, PipelineStage } from "@/types";
import { DEAL_STAGES, PAYMENT_STATUSES } from "@/config/constants";
import { clientFullName } from "@/lib/db/mappers";
import { moveDealStageAction, updateDealFormAction } from "@/features/deals/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";

const stageLabel = Object.fromEntries(DEAL_STAGES.map((s) => [s.value, s.label]));
const stageColor = Object.fromEntries(DEAL_STAGES.map((s) => [s.value, s.color]));

export function DealDetail({
  deal,
  stages,
  canWrite,
}: {
  deal: DealWithClient;
  stages: PipelineStage[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const clientName = deal.client
    ? clientFullName({
        first_name: deal.client.first_name,
        last_name: deal.client.last_name,
      })
    : "Клиент";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className={stageColor[deal.stage] ?? ""}>
                {stageLabel[deal.stage] ?? deal.stage}
              </Badge>
              <h2 className="mt-2 text-2xl font-semibold">{deal.title}</h2>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {deal.amount.toLocaleString("ru-RU")} {deal.currency}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Вероятность: {deal.probability}% · {PAYMENT_STATUSES.find((p) => p.value === deal.payment_status)?.label}
              </p>
            </div>
            {canWrite && (
              <div className="flex flex-wrap gap-2">
                {stages.map((stage) => (
                  <Button
                    key={stage.id}
                    size="sm"
                    variant={deal.stage === stage.value ? "default" : "outline"}
                    disabled={pending || deal.stage === stage.value}
                    onClick={() =>
                      startTransition(async () => {
                        await moveDealStageAction(deal.id, stage.value as never);
                        router.refresh();
                        toast.success(`Этап: ${stage.label}`);
                      })
                    }
                  >
                    {stage.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {canWrite ? (
          <Card>
            <CardHeader>
              <CardTitle>Редактирование сделки</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 sm:grid-cols-2"
                action={updateDealFormAction.bind(null, deal.id)}
              >
                <div className="sm:col-span-2">
                  <Label htmlFor="title">Название</Label>
                  <Input id="title" name="title" defaultValue={deal.title} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="amount">Сумма</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    defaultValue={deal.amount}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Валюта</Label>
                  <Input id="currency" name="currency" defaultValue={deal.currency} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="probability">Вероятность (%)</Label>
                  <Input
                    id="probability"
                    name="probability"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={deal.probability}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="payment_status">Оплата</Label>
                  <Select id="payment_status" name="payment_status" defaultValue={deal.payment_status} className="mt-1 w-full">
                    {PAYMENT_STATUSES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stage">Этап</Label>
                  <Select id="stage" name="stage" defaultValue={deal.stage} className="mt-1 w-full">
                    {DEAL_STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="close_date">Дата закрытия</Label>
                  <Input
                    id="close_date"
                    name="close_date"
                    type="date"
                    defaultValue={deal.close_date?.slice(0, 10) ?? ""}
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="comment">Комментарий</Label>
                  <Textarea
                    id="comment"
                    name="comment"
                    rows={4}
                    defaultValue={deal.comment ?? ""}
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={pending}>
                    Сохранить
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Детали</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="text-neutral-500">Комментарий:</span> {deal.comment ?? "—"}
              </p>
              <p>
                <span className="text-neutral-500">Дата закрытия:</span>{" "}
                {deal.close_date ? new Date(deal.close_date).toLocaleDateString("ru-RU") : "—"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Клиент</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/clients/${deal.client_id}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 transition-colors hover:bg-neutral-50"
            >
              <Avatar name={clientName} className="h-10 w-10" />
              <div>
                <p className="font-medium">{clientName}</p>
                <p className="text-xs text-neutral-500">
                  {deal.client?.phone ?? "—"}
                  {deal.client?.company ? ` · ${deal.client.company}` : ""}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Мета</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-neutral-500">Создана:</span>{" "}
              {new Date(deal.created_at).toLocaleString("ru-RU")}
            </p>
            <p>
              <span className="text-neutral-500">Обновлена:</span>{" "}
              {new Date(deal.updated_at).toLocaleString("ru-RU")}
            </p>
            <Link href="/deals" className="inline-block pt-2 text-sm text-neutral-600 hover:underline">
              ← В воронку
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
