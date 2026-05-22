import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, withSession, withWriteSession } from "@/lib/api/helpers";
import { deleteTask, getTaskById, updateTask } from "@/services/tasks";
import type { TaskPriority, TaskStatus, TaskType } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withSession(request, async (session) => {
    const { id } = await params;
    const task = await getTaskById(id, session);
    if (!task) return jsonError("Not found", 404);
    return jsonOk(task);
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withWriteSession(request, async (session) => {
    const { id } = await params;
    const body = await parseJsonBody<{
      title?: string;
      description?: string | null;
      type?: TaskType;
      priority?: TaskPriority;
      status?: TaskStatus;
      due_date?: string | null;
      remind_at?: string | null;
      client_id?: string | null;
      lead_id?: string | null;
      deal_id?: string | null;
      assigned_to?: string | null;
    }>(request);

    const task = await updateTask(session, id, body);
    if (!task) return jsonError("Not found", 404);
    return jsonOk(task);
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withWriteSession(request, async (session) => {
    const { id } = await params;
    const task = await deleteTask(session, id);
    if (!task) return jsonError("Not found", 404);
    return jsonOk({ ok: true, id: task.id });
  });
}
