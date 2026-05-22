import { getLeadsByStatus } from "@/services/leads";
import { DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { PipelineBoard } from "@/features/pipeline/components/pipeline-board";

export default async function PipelinePage() {
  const grouped = await getLeadsByStatus();

  return (
    <DashboardPageFrame
      title="Воронка лидов"
      description="Kanban по стадиям — перетаскивайте карточки"
    >
      <div className="p-4 lg:p-6">
        <PipelineBoard grouped={grouped} />
      </div>
    </DashboardPageFrame>
  );
}
