"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
}

export function PageHeader({
  title,
  description,
  actions,
  onMenuClick,
}: PageHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-neutral-200/60 bg-white/60 px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Открыть меню"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight text-neutral-900">
            {title}
          </h1>
          {description && (
            <p className="truncate text-sm text-neutral-500">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
