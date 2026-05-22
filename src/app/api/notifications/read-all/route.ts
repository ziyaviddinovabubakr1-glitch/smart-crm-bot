import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { markAllNotificationsRead } from "@/services/notifications";

export async function POST(request: Request) {
  const { session, error } = await requireApiSession(request as never);
  if (error || !session) return error!;

  await markAllNotificationsRead(session.id);
  return NextResponse.json({ ok: true });
}
