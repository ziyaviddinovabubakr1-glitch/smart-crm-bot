import { getSession } from "@/lib/auth";
import { hasPermission } from "@/core/permissions/roles";
import { getClients } from "@/services/clients";
import { getTasks } from "@/services/tasks";
import { CreateTaskForm } from "@/features/tasks/components/create-task-form";
import { TasksList } from "@/features/tasks/components/tasks-list";
import { DashboardPageFrame } from "@/components/layout/dashboard-page-frame";

export default async function TasksPage() {
  const session = await getSession();
  if (!session) return null;

  const [tasks, clientsResult] = await Promise.all([
    getTasks(session),
    getClients({ page: 1, limit: 100, hideTest: true }, session),
  ]);

  const canWrite = hasPermission(session.role, "clients:write");
  const pending = tasks.filter((t) => t.status === "pending").length;

  return (
    <DashboardPageFrame
      title="Задачи"
      description={`${pending} активных · звонки, встречи, напоминания`}
    >
      <div className="space-y-4 p-4 lg:p-6">
        {canWrite && <CreateTaskForm clients={clientsResult.clients} />}
        <TasksList tasks={tasks} canWrite={canWrite} />
      </div>
    </DashboardPageFrame>
  );
}
