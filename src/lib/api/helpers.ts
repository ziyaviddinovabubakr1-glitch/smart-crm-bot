import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import type { SessionUser } from "@/types";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function parseJsonBody<T = Record<string, unknown>>(request: NextRequest): Promise<T> {
  return (await request.json()) as T;
}

export async function withSession(
  request: NextRequest,
  handler: (session: SessionUser) => Promise<NextResponse>
) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;
  return handler(session);
}

export async function withWriteSession(
  request: NextRequest,
  handler: (session: SessionUser) => Promise<NextResponse>
) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;
  if (session.role === "viewer") {
    return jsonError("Forbidden", 403);
  }
  return handler(session);
}

export function wantsJson(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  const contentType = request.headers.get("content-type") ?? "";
  return accept.includes("application/json") || contentType.includes("application/json");
}
