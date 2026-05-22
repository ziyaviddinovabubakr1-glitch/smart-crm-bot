import { notFound } from "next/navigation";
import Link from "next/link";
import { getActivitiesByLead } from "@/services/activities";
import { getLeadById } from "@/services/leads";
import { getNotesByLead } from "@/services/notes";
import { getRemindersByLead } from "@/services/reminders";
import { LeadDetail } from "@/features/leads/components/lead-detail";
import { DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { lead } = await getLeadById(id);
  if (!lead) notFound();

  const [notes, reminders, activities] = await Promise.all([
    getNotesByLead(id),
    getRemindersByLead(id),
    getActivitiesByLead(id),
  ]);

  return (
    <DashboardPageFrame
      title={lead.name}
      description="Карточка клиента"
      actions={
        <Link href="/leads">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Button>
        </Link>
      }
    >
      <div className="p-4 lg:p-6">
        <LeadDetail lead={lead} notes={notes} reminders={reminders} activities={activities} />
      </div>
    </DashboardPageFrame>
  );
}
