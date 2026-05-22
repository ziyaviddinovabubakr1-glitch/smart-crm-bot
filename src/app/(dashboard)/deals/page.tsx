import { getSession } from "@/lib/auth";
import { hasPermission } from "@/core/permissions/roles";
import { getClients } from "@/services/clients";
import { getDealsByStage } from "@/services/deals";
import { DealsBoard } from "@/features/deals/components/deals-board";
import { CreateDealDialog } from "@/features/deals/components/create-deal-dialog";
import { DashboardPageFrame } from "@/components/layout/dashboard-page-frame";

export default async function DealsPage() {
  const session = await getSession();
  if (!session) return null;

  const [{ grouped, stages }, clientsResult] = await Promise.all([
    getDealsByStage(session),
    getClients({ page: 1, limit: 100, hideTest: true }, session),
  ]);

  const canWrite = hasPermission(session.role, "clients:write");

  return (
    <DashboardPageFrame
      title="Сделки"
      description="Воронка продаж · перетаскивайте карточки между этапами"
      actions={canWrite ? <CreateDealDialog clients={clientsResult.clients} /> : undefined}
    >
      <div className="p-4 lg:p-6">
        <DealsBoard grouped={grouped} stages={stages} />
      </div>
    </DashboardPageFrame>
  );
}
