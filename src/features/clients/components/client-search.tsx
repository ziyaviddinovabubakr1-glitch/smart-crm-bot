"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

function buildClientsUrl(
  searchParams: URLSearchParams,
  search: string | null
): string {
  const params = new URLSearchParams(searchParams.toString());

  if (search) {
    params.set("search", search);
    params.delete("status");
  } else {
    params.delete("search");
  }

  if (!params.has("view")) {
    params.set("view", "table");
  }

  params.delete("page");
  params.delete("created");

  const qs = params.toString();
  return qs ? `/clients?${qs}` : "/clients?view=table";
}

export function ClientSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const [value, setValue] = useState(defaultValue ?? "");
  const isTyping = useRef(false);

  useEffect(() => {
    if (!isTyping.current) {
      setValue(defaultValue ?? "");
    }
  }, [defaultValue]);

  useEffect(() => {
    const trimmed = value.trim();
    const current = (searchParams.get("search") ?? "").trim();
    if (trimmed === current) return;

    const timer = setTimeout(() => {
      isTyping.current = false;
      router.replace(buildClientsUrl(searchParams, trimmed || null));
    }, 400);

    return () => clearTimeout(timer);
  }, [value, router, paramsKey, searchParams]);

  return (
    <Input
      placeholder="Поиск: имя, телефон, email, компания…"
      value={value}
      onChange={(e) => {
        isTyping.current = true;
        setValue(e.target.value);
      }}
      className="max-w-md"
    />
  );
}
