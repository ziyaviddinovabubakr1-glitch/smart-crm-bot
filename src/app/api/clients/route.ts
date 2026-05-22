import { NextRequest, NextResponse } from "next/server";
import { canWrite, requireApiSession } from "@/lib/auth/api";
import {
  createClient,
  exportClientsCsv,
  getClients,
  parseClientBody,
} from "@/services/clients";
import type { ClientStatus } from "@/types";

export async function GET(request: NextRequest) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;

  const params = request.nextUrl.searchParams;
  const result = await getClients(
    {
      page: Number(params.get("page") ?? 1),
      limit: Number(params.get("limit") ?? 20),
      search: params.get("search") ?? undefined,
      status: (params.get("status") as ClientStatus) ?? undefined,
      tag: params.get("tag") ?? undefined,
      userId: params.get("userId") ?? undefined,
    },
    session
  );

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;
  if (!canWrite(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const client = await createClient(session, parseClientBody(body));
    return NextResponse.json(client, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid input";
    try {
      return NextResponse.json({ errors: JSON.parse(message) }, { status: 400 });
    } catch {
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }
}
