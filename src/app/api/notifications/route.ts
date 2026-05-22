import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";

export async function GET(request: NextRequest) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;

  const [notifications, unread] = await Promise.all([
    getNotifications(session.id),
    getUnreadNotificationCount(session.id),
  ]);

  return NextResponse.json({ notifications, unread });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;

  const body = (await request.json()) as { action?: string; id?: string };
  if (body.action === "read-all") {
    await markAllNotificationsRead(session.id);
    return NextResponse.json({ ok: true });
  }
  if (body.id) {
    await markNotificationRead(session.id, body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
