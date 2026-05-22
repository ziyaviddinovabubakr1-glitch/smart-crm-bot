"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckSquare,
  ChevronDown,
  Plus,
  Settings,
  UserCircle,
  Users,
  Briefcase,
} from "lucide-react";
import type { AppNotification } from "@/types";
import type { SessionUser } from "@/types";
import { GlobalSearchBar } from "@/components/layout/global-search-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppTopBar({
  session,
  unreadCount: initialUnread,
}: {
  session: SessionUser;
  unreadCount: number;
}) {
  const router = useRouter();
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const quickRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    void fetch("/api/notifications")
      .then((r) => r.json())
      .then((data: { notifications: AppNotification[]; unread: number }) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unread ?? 0);
      });
  }, [notifOpen]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setQuickOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200/80 bg-white/90 px-4 backdrop-blur-md lg:px-6">
      <GlobalSearchBar />

      <div className="flex items-center gap-2 sm:ml-auto">
        <div className="relative" ref={quickRef}>
          <Button
            size="sm"
            className="gap-1 bg-primary hover:bg-primary/90"
            onClick={() => setQuickOpen((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Создать</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </Button>
          {quickOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-neutral-200 bg-white py-1 shadow-xl">
              <QuickLink href="/clients?view=table" icon={UserCircle} label="Клиент" onClick={() => setQuickOpen(false)} />
              <QuickLink href="/deals" icon={Briefcase} label="Сделка" onClick={() => setQuickOpen(false)} />
              <QuickLink href="/leads" icon={Users} label="Лид" onClick={() => setQuickOpen(false)} />
              <QuickLink href="/tasks" icon={CheckSquare} label="Задача" onClick={() => setQuickOpen(false)} />
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Уведомления"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-neutral-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                <p className="font-semibold">Уведомления</p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => void markAllRead()}
                  >
                    Прочитать все
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-neutral-500">Нет уведомлений</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={cn(
                        "block w-full border-b border-neutral-50 px-4 py-3 text-left hover:bg-neutral-50",
                        !n.is_read && "bg-primary/5"
                      )}
                      onClick={() => {
                        setNotifOpen(false);
                        if (n.href) router.push(n.href);
                      }}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-neutral-500">{n.message}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Link
          href="/settings"
          className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 sm:flex"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {session.name.slice(0, 2).toUpperCase()}
          </div>
          <span className="max-w-[100px] truncate">{session.name}</span>
          <Settings className="h-4 w-4 text-neutral-400" />
        </Link>
      </div>
    </header>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof UserCircle;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
    >
      <Icon className="h-4 w-4 text-neutral-500" />
      {label}
    </Link>
  );
}
