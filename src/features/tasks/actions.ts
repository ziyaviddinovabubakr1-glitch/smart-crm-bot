"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth";
import { hasPermission } from "@/core/permissions/roles";
import { createTask, updateTaskStatus } from "@/services/tasks";
import type { SessionUser, TaskPriority, TaskStatus, TaskType } from "@/types";

function sessionUser(session: NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>): SessionUser {
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

export async function createTaskFormAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (!hasPermission(session.user.role, "clients:write")) throw new Error("FORBIDDEN");

  await createTask(sessionUser(session), {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    type: (formData.get("type") as TaskType) ?? "task",
    priority: (formData.get("priority") as TaskPriority) ?? "medium",
    due_date: String(formData.get("due_date") ?? "") || null,
    client_id: String(formData.get("client_id") ?? "") || null,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function completeTaskAction(taskId: string) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (!hasPermission(session.user.role, "clients:write")) throw new Error("FORBIDDEN");

  await updateTaskStatus(sessionUser(session), taskId, "done" satisfies TaskStatus);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function bulkArchiveClientsAction(ids: string[]) {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (!hasPermission(session.user.role, "clients:write")) throw new Error("FORBIDDEN");

  const { archiveClient } = await import("@/services/clients");
  for (const id of ids) {
    await archiveClient(sessionUser(session), id);
  }
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}
