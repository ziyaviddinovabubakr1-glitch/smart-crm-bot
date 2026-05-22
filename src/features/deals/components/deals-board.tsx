"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DealWithClient, PipelineStage } from "@/types";
import { moveDealStageAction } from "@/features/deals/actions";
import { Badge } from "@/components/ui/badge";
import { clientFullName } from "@/lib/db/mappers";
import { cn } from "@/lib/utils";

const stageAccent: Record<string, string> = {
  new: "border-t-blue-500",
  contact: "border-t-sky-500",
  proposal: "border-t-violet-500",
  negotiation: "border-t-amber-500",
  payment: "border-t-orange-500",
  closed: "border-t-emerald-500",
  rejected: "border-t-neutral-400",
};

export function DealsBoard({
  grouped,
  stages,
}: {
  grouped: Record<string, DealWithClient[]>;
  stages: PipelineStage[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDrop(targetStage: string, dealId: string) {
    startTransition(async () => {
      await moveDealStageAction(dealId, targetStage as never);
      router.refresh();
    });
  }

  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-4", pending && "opacity-70")}>
      {stages.map((stage) => {
        const deals = grouped[stage.value] ?? [];
        const total = deals.reduce((sum, d) => sum + d.amount, 0);
        return (
          <div
            key={stage.id}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border border-neutral-200/80 bg-neutral-50/80 shadow-sm",
              "border-t-4",
              stageAccent[stage.value] ?? "border-t-neutral-300"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dealId = e.dataTransfer.getData("text/deal-id");
              if (dealId) onDrop(stage.value, dealId);
            }}
          >
            <div className="border-b border-neutral-200/80 px-3 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-800">{stage.label}</span>
                <Badge>{deals.length}</Badge>
              </div>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {total.toLocaleString("ru-RU")} ₽
              </p>
            </div>
            <div className="flex min-h-[240px] flex-1 flex-col gap-2 p-2">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/deal-id", deal.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="group cursor-grab rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                >
                  <Link href={`/deals/${deal.id}`} className="block">
                    <p className="font-medium text-neutral-900 group-hover:text-neutral-700">
                      {deal.title}
                    </p>
                    {deal.client && (
                      <p className="mt-1 text-xs text-neutral-500">
                        {clientFullName({
                          first_name: deal.client.first_name,
                          last_name: deal.client.last_name,
                        })}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-semibold text-neutral-800">
                      {deal.amount.toLocaleString("ru-RU")} {deal.currency}
                    </p>
                  </Link>
                </div>
              ))}
              {deals.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-400">
                  Перетащите сделку сюда
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
