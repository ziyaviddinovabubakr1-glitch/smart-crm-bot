import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, withSession } from "@/lib/api/helpers";
import { markAllNotificationsRead, markNotificationRead } from "@/services/notifications";

export async function POST(request: NextRequest) {
  return withSession(request, async (session) => {
    const body = await parseJsonBody<{ id?: string; all?: boolean }>(request);

    if (body.all) {
      await markAllNotificationsRead(session.id);
      return jsonOk({ ok: true });
    }

    if (body.id) {
      await markNotificationRead(session.id, body.id);
      return jsonOk({ ok: true });
    }

    return jsonError("id or all=true required", 400);
  });
}
