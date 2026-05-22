import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/core/permissions/roles";
import { getClientById } from "@/services/clients";
import { getClientFieldDefinitions } from "@/services/custom-fields";
import { getDeals } from "@/services/deals";
import { getInteractionsByClient, getNotesByClient } from "@/services/interactions";
import { ClientCard } from "@/features/clients/components/client-card";
import { DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { clientFullName } from "@/lib/db/mappers";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; converted?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const { created, converted } = await searchParams;
  const client = await getClientById(id, session);
  if (!client) notFound();

  const [deals, interactions, notes, fieldDefinitions] = await Promise.all([
    getDeals(session, id),
    getInteractionsByClient(id, session),
    getNotesByClient(id, session),
    getClientFieldDefinitions(),
  ]);

  const canWrite = hasPermission(session.role, "clients:write");

  return (
    <DashboardPageFrame
      title={clientFullName(client)}
      description="Карточка клиента · сделки · история · заметки"
    >
      <div className="space-y-4 p-4 lg:p-6">
        {converted === "1" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Лид успешно конвертирован в клиента.
          </div>
        )}
        {created === "1" && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Клиент успешно создан и сохранён в базе.{" "}
            <Link href="/clients" className="font-medium underline">
              Вернуться к списку
            </Link>
          </div>
        )}

        <ClientCard
          client={client}
          deals={deals}
          interactions={interactions}
          notes={notes}
          fieldDefinitions={fieldDefinitions}
          canWrite={canWrite}
        />
      </div>
    </DashboardPageFrame>
  );
}
