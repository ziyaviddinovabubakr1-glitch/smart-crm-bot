import { NextRequest } from "next/server";
import { jsonError, jsonOk, withWriteSession } from "@/lib/api/helpers";
import { updateTaskStatus } from "@/services/tasks";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withWriteSession(request, async (session) => {
    const { id } = await params;
    const task = await updateTaskStatus(session, id, "done");
    if (!task) return jsonError("Not found", 404);
    return jsonOk(task);
  });
}
