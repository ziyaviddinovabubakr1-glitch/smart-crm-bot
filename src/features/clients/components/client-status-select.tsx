"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClientStatus } from "@/types";
import { CLIENT_STATUSES } from "@/config/constants";
import { updateClientStatusAction } from "@/features/clients/actions";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const statusColor = Object.fromEntries(CLIENT_STATUSES.map((s) => [s.value, s.color]));

export function ClientStatusSelect({
  clientId,
  value,
  disabled = false,
  compact = false,
  className,
}: {
  clientId: string;
  value: ClientStatus;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(next: ClientStatus) {
    if (next === value) return;
    startTransition(async () => {
      await updateClientStatusAction(clientId, next);
      router.refresh();
    });
  }

  return (
    <Select
      value={value}
      disabled={disabled || pending}
      onChange={(e) => onChange(e.target.value as ClientStatus)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        compact ? "h-8 text-xs" : "h-9",
        statusColor[value],
        "border-0 font-medium shadow-none focus:ring-1",
        pending && "opacity-60",
        className
      )}
    >
      {CLIENT_STATUSES.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </Select>
  );
}
