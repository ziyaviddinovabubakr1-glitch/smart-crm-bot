import { Suspense } from "react";
import { getLeads } from "@/services/leads";
import { LeadsTable } from "@/features/leads/components/leads-table";
import { DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { LeadsSearch } from "@/features/leads/components/leads-search";

async function LeadsContent({ q }: { q?: string }) {
  const { leads } = await getLeads(q);
  return <LeadsTable leads={leads} />;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <DashboardPageFrame title="Лиды" description="Заявки из Telegram и других источников">
      <div className="space-y-4 p-4 lg:p-6">
        <Suspense fallback={<div className="h-9 max-w-md animate-pulse rounded-lg bg-neutral-200" />}>
          <LeadsSearch defaultValue={q} />
        </Suspense>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-neutral-200" />}>
          <LeadsContent q={q} />
        </Suspense>
      </div>
    </DashboardPageFrame>
  );
}
