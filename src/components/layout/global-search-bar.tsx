"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Search, UserCircle, Users } from "lucide-react";
import type { SearchResultItem } from "@/services/search";

const typeIcons = {
  client: UserCircle,
  deal: Briefcase,
  lead: Users,
};

export function GlobalSearchBar() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) {
          setResults([]);
          setError("Не удалось выполнить поиск. Обновите страницу.");
          return;
        }
        const data = (await res.json()) as { results?: SearchResultItem[] };
        setResults(data.results ?? []);
      } catch {
        setResults([]);
        setError("Ошибка сети");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goToItem(item: SearchResultItem) {
    setOpen(false);
    setQuery("");
    router.push(item.href);
  }

  const trimmed = query.trim();
  const showDropdown = open && trimmed.length >= 1;

  return (
    <div ref={wrapRef} className="relative w-full max-w-xl flex-1">
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 transition focus-within:border-primary/40 focus-within:bg-white">
        <Search className="h-4 w-4 shrink-0 text-neutral-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && trimmed) {
              e.preventDefault();
              setOpen(false);
              router.push(
                `/clients?view=table&search=${encodeURIComponent(trimmed)}`
              );
            }
            if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Поиск клиентов, сделок, лидов…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
          aria-label="Поиск"
        />
        <kbd className="hidden rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] text-neutral-400 sm:inline">
          Enter
        </kbd>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
          {loading && (
            <p className="px-4 py-6 text-center text-sm text-neutral-500">Поиск…</p>
          )}
          {!loading && error && (
            <p className="px-4 py-6 text-center text-sm text-red-600">{error}</p>
          )}
          {!loading && !error && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-neutral-500">
              Ничего не найдено по запросу «{trimmed}»
            </p>
          )}
          {!loading && !error && results.length > 0 && (
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.map((item) => {
                const Icon = typeIcons[item.type];
                return (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      type="button"
                      onClick={() => goToItem(item)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-neutral-50"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                        <Icon className="h-4 w-4 text-neutral-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-neutral-500">{item.subtitle}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!loading && trimmed && (
            <div className="border-t border-neutral-100 px-3 py-2">
              <Link
                href={`/clients?view=table&search=${encodeURIComponent(trimmed)}`}
                className="block rounded-lg px-2 py-2 text-sm text-primary hover:bg-primary/5"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
              >
                Показать все клиенты по запросу «{trimmed}»
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
