"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lead, LeadStatus } from "@/types";
import { LEAD_STATUSES, AI_TEMPERATURE_LABEL, SOURCE_LABEL } from "@/config/constants";
import { updateStatusAction } from "@/features/leads/actions";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";

const tempEmoji = AI_TEMPERATURE_LABEL;

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();

  async function onStatusChange(id: string, status: LeadStatus) {
    await updateStatusAction(id, status);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3">Клиент</th>
              <th className="px-4 py-3">Сообщение</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">AI</th>
              <th className="px-4 py-3">След. звонок</th>
              <th className="px-4 py-3">Создан</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-neutral-50 hover:bg-neutral-50/80">
                <td className="px-4 py-3">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {lead.name}
                  </Link>
                  {lead.phone && (
                    <p className="text-xs text-neutral-500">{lead.phone}</p>
                  )}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-neutral-600">
                  {lead.message ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Select
                    className="h-8 min-w-[130px] text-xs"
                    value={lead.status}
                    onChange={(e) =>
                      onStatusChange(lead.id, e.target.value as LeadStatus)
                    }
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium">{lead.ai_score}%</span>
                  {lead.ai_temperature && (
                    <Badge variant="default" className="ml-1">
                      {tempEmoji[lead.ai_temperature] ?? lead.ai_temperature}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {lead.next_call
                    ? new Date(lead.next_call).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(lead.created_at).toLocaleDateString("ru-RU")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <p className="p-12 text-center text-neutral-500">
            Лиды появятся после сообщений в Telegram
          </p>
        )}
      </div>
    </div>
  );
}
