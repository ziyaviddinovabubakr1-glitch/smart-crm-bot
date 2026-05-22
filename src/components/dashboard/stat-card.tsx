import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
            {value}
          </p>
        </div>
        <div className="rounded-lg bg-neutral-100 p-2">
          <Icon className="h-4 w-4 text-neutral-600" />
        </div>
      </div>
    </div>
  );
}
