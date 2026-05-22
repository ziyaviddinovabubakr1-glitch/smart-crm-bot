"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CLIENT_STATUSES } from "@/config/constants";
import { Select } from "@/components/ui/select";
import type { ClientStatus } from "@/types";

function buildUrl(searchParams: URLSearchParams, status: ClientStatus | "") {
  const params = new URLSearchParams(searchParams.toString());
  if (status) {
    params.set("status", status);
  } else {
    params.delete("status");
  }
  params.delete("page");
  const qs = params.toString();
  return qs ? `/clients?${qs}` : "/clients";
}

export function ClientStatusFilter({ defaultValue }: { defaultValue?: ClientStatus }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <Select
      className="w-full max-w-[180px]"
      value={defaultValue ?? ""}
      onChange={(e) => {
        router.replace(buildUrl(searchParams, e.target.value as ClientStatus | ""));
      }}
    >
      <option value="">Все статусы</option>
      {CLIENT_STATUSES.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </Select>
  );
}
