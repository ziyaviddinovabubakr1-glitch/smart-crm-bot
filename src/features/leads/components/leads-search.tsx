"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function LeadsSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(defaultValue ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    router.push(`/leads?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md gap-2">
      <Input
        placeholder="Поиск по имени, телефону, сообщению..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Button type="submit" variant="secondary" size="icon" aria-label="Поиск">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
