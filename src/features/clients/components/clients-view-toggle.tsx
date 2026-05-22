"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function buildHref(searchParams: URLSearchParams, view: "board" | "table") {
  const params = new URLSearchParams(searchParams.toString());
  if (view === "board") {
    params.delete("view");
  } else {
    params.set("view", "table");
  }
  params.delete("page");
  const qs = params.toString();
  return qs ? `/clients?${qs}` : "/clients";
}

export function ClientsViewToggle({ view }: { view: "board" | "table" }) {
  const searchParams = useSearchParams();

  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5">
      <Link
        href={buildHref(searchParams, "board")}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition",
          view === "board"
            ? "bg-primary text-white shadow-sm"
            : "text-neutral-600 hover:bg-neutral-50"
        )}
      >
        Воронка
      </Link>
      <Link
        href={buildHref(searchParams, "table")}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition",
          view === "table"
            ? "bg-primary text-white shadow-sm"
            : "text-neutral-600 hover:bg-neutral-50"
        )}
      >
        Таблица
      </Link>
    </div>
  );
}
