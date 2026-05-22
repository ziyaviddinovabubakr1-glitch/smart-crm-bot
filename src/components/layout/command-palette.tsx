"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Search, UserCircle, Users } from "lucide-react";
import type { SearchResultItem } from "@/services/search";
import { cn } from "@/lib/utils";

type CommandPaletteContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  }
  return ctx;
}

const typeIcons = {
  client: UserCircle,
  deal: Briefcase,
  lead: Users,
};

const typeLabels = {
  client: "Клиент",
  deal: "Сделка",
  lead: "Лид",
};

function CommandPaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = (await res.json()) as { results: SearchResultItem[] };
        setResults(data.results ?? []);
        setActiveIndex(0);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const navigate = useCallback(
    (item: SearchResultItem) => {
      onClose();
      router.push(item.href);
    },
    [onClose, router]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[activeIndex]) {
        e.preventDefault();
        navigate(results[activeIndex]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, navigate, onClose, results]);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-neutral-900/40 p-4 pt-[12vh] backdrop-blur-sm">
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Глобальный поиск"
      >
        <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
          <Search className="h-5 w-5 text-neutral-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск клиентов, сделок, лидов…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
          <kbd className="hidden rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] text-neutral-500 sm:inline">
            Esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim().length < 1 && (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">
              Введите имя, телефон или email
            </p>
          )}
          {loading && (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">Поиск…</p>
          )}
          {!loading && query.trim().length >= 1 && results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">Ничего не найдено</p>
          )}
          {results.map((item, index) => {
            const Icon = typeIcons[item.type];
            return (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onClick={() => navigate(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  index === activeIndex ? "bg-neutral-100" : "hover:bg-neutral-50"
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                  <Icon className="h-4 w-4 text-neutral-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
                  <p className="truncate text-xs text-neutral-500">{item.subtitle}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wide text-neutral-400">
                  {typeLabels[item.type]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-neutral-100 px-4 py-2 text-xs text-neutral-400">
          ↑↓ навигация · Enter открыть · Esc закрыть
        </div>
      </div>
    </div>
  );
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      {open && <CommandPaletteDialog onClose={() => setOpen(false)} />}
    </CommandPaletteContext.Provider>
  );
}
