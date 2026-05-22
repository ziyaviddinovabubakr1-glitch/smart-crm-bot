import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, withSession, withWriteSession } from "@/lib/api/helpers";
import { createTask, getTasks } from "@/services/tasks";
import type { TaskPriority, TaskStatus, TaskType } from "@/types";

export async function GET(request: NextRequest) {
  return withSession(request, async (session) => {
    const params = request.nextUrl.searchParams;
    const status = params.get("status") as TaskStatus | null;
    const tasks = await getTasks(session, status ? { status } : undefined);
    return jsonOk({ tasks });
  });
}

export async function POST(request: NextRequest) {
  return withWriteSession(request, async (session) => {
    const body = await parseJsonBody<{
      title?: string;
      description?: string | null;
      type?: TaskType;
      priority?: TaskPriority;
      due_date?: string | null;
      remind_at?: string | null;
      client_id?: string | null;
      lead_id?: string | null;
      deal_id?: string | null;
      assigned_to?: string | null;
    }>(request);

    if (!body.title?.trim()) {
      return jsonError("title required", 400);
    }

    const task = await createTask(session, {
      title: body.title,
      description: body.description,
      type: body.type,
      priority: body.priority,
      due_date: body.due_date,
      remind_at: body.remind_at,
      client_id: body.client_id,
      lead_id: body.lead_id,
      deal_id: body.deal_id,
      assigned_to: body.assigned_to,
    });

    return jsonOk(task, 201);
  });
}
