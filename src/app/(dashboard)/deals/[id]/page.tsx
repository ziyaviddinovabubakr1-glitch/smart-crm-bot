import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/core/permissions/roles";
import { getDealById } from "@/services/deals";
import { getPipelineStages } from "@/services/pipeline-stages";
import { DealDetail } from "@/features/deals/components/deal-detail";
import { DashboardPageFrame } from "@/components/layout/dashboard-page-frame";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) notFound();

  const { id } = await params;
  const [deal, stages] = await Promise.all([getDealById(id, session), getPipelineStages()]);
  if (!deal) notFound();

  const canWrite = hasPermission(session.role, "clients:write");

  return (
    <DashboardPageFrame title={deal.title} description="Карточка сделки · этапы · клиент">
      <div className="p-4 lg:p-6">
        <DealDetail deal={deal} stages={stages} canWrite={canWrite} />
      </div>
    </DashboardPageFrame>
  );
}
