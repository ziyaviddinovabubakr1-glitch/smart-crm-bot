"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Kanban,
  CheckSquare,
  Settings,
  LogOut,
  UserCircle,
  Briefcase,
  Search,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { mainNavigation } from "@/config/navigation";
import { ROLES } from "@/config/constants";
import { useCommandPalette } from "@/components/layout/command-palette";
import type { SessionUser } from "@/types";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "user-circle": UserCircle,
  "bar-chart": BarChart3,
  kanban: Kanban,
  briefcase: Briefcase,
  "check-square": CheckSquare,
  settings: Settings,
} as const;

interface AppSidebarProps {
  session?: SessionUser | null;
  onNavigate?: () => void;
}

export function AppSidebar({ session, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const { setOpen } = useCommandPalette();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-neutral-200 px-4">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900 text-xs font-bold text-white">
            {siteConfig.shortName[0]}
          </div>
          <span className="font-semibold tracking-tight">{siteConfig.name}</span>
        </Link>
      </div>

      <div className="p-3 pb-2">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            onNavigate?.();
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Поиск…</span>
          <kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="px-3 pb-3">
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
          Быстрое создание
        </p>
        <div className="space-y-0.5">
          <Link
            href="/clients?view=table"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Клиент
          </Link>
          <Link
            href="/deals"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Сделка
          </Link>
          <Link
            href="/leads"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Лид
          </Link>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3 pt-0">
        {mainNavigation.map((item) => {
          const Icon = iconMap[item.icon];
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-3">
        {session && (
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium">{session.name}</p>
            <p className="truncate text-xs text-neutral-500">
              {ROLES.find((r) => r.value === session.role)?.label ?? session.role}
            </p>
          </div>
        )}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </form>
      </div>
    </div>
  );
}
