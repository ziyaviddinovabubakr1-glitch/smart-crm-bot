"use client";

import { AppSidebar } from "./app-sidebar";
import { AppTopBar } from "./app-top-bar";
import { CommandPaletteProvider } from "./command-palette";
import { SessionSync } from "./session-sync";
import { MobileNavProvider, useMobileNav } from "./mobile-nav-context";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

function ShellInner({
  children,
  session,
  unreadNotifications,
}: {
  children: React.ReactNode;
  session: SessionUser;
  unreadNotifications: number;
}) {
  const { open, closeMenu } = useMobileNav();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-neutral-200/80 bg-white/90 backdrop-blur-sm lg:block">
        <AppSidebar session={session} />
      </aside>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-neutral-900/20 lg:hidden"
          aria-label="Закрыть меню"
          onClick={closeMenu}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 border-r border-neutral-200/80 bg-white/95 backdrop-blur-sm transition-transform lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AppSidebar session={session} onNavigate={closeMenu} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar session={session} unreadCount={unreadNotifications} />
        {children}
      </div>
    </div>
  );
}

export function DashboardShell({
  children,
  session,
  unreadNotifications = 0,
}: {
  children: React.ReactNode;
  session: SessionUser;
  unreadNotifications?: number;
}) {
  return (
    <MobileNavProvider>
      <CommandPaletteProvider>
        <SessionSync />
        <ShellInner session={session} unreadNotifications={unreadNotifications}>
          {children}
        </ShellInner>
      </CommandPaletteProvider>
    </MobileNavProvider>
  );
}
