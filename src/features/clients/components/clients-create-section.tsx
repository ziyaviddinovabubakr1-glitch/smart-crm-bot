"use client";

import { useRouter } from "next/navigation";
import { ClientForm } from "@/features/clients/components/client-form";

export function ClientsCreateSection() {
  const router = useRouter();

  return (
    <ClientForm
      onSuccess={(clientId, searchName) => {
        router.refresh();
        const params = new URLSearchParams({ view: "table", created: clientId });
        if (searchName) params.set("search", searchName);
        router.push(`/clients?${params.toString()}`);
      }}
    />
  );
}
