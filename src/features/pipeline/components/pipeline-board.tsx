"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Lead, LeadStatus } from "@/types";
import { LEAD_STATUSES, SOURCE_LABEL } from "@/config/constants";
import { moveLeadStageAction } from "@/features/leads/actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type GroupedLeads = Record<LeadStatus, Lead[]>;

export function PipelineBoard({ grouped }: { grouped: GroupedLeads }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDrop(targetStatus: LeadStatus, leadId: string) {
    startTransition(async () => {
      await moveLeadStageAction(leadId, targetStatus);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-4",
        pending && "opacity-70"
      )}
    >
      {LEAD_STATUSES.map((stage) => {
        const leads = grouped[stage.value] ?? [];
        return (
          <div
            key={stage.value}
            className="flex w-72 shrink-0 flex-col rounded-xl border border-neutral-200 bg-neutral-50/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const leadId = e.dataTransfer.getData("text/lead-id");
              if (leadId) onDrop(stage.value, leadId);
            }}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{stage.label}</span>
                <Badge>{leads.length}</Badge>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-2 min-h-[200px]">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/lead-id", lead.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="cursor-grab rounded-lg border border-neutral-200 bg-white p-3 shadow-sm active:cursor-grabbing"
                >
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {lead.name}
                  </Link>
                  {lead.phone && (
                    <p className="mt-1 text-xs text-neutral-500">{lead.phone}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <Badge className="text-[10px]">{SOURCE_LABEL[lead.source] ?? lead.source}</Badge>
                    <span className="text-[10px] text-neutral-500">
                      оценка {lead.score}
                    </span>
                  </div>
                  {(lead.tags ?? []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {lead.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {leads.length === 0 && (
                <p className="py-8 text-center text-xs text-neutral-400">
                  Перетащите карточку сюда
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
