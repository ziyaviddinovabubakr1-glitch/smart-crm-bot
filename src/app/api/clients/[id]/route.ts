import { NextRequest, NextResponse } from "next/server";
import { canWrite, requireApiSession } from "@/lib/auth/api";
import {
  archiveClient,
  getClientById,
  parseClientBody,
  updateClient,
} from "@/services/clients";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;

  const { id } = await params;
  const client = await getClientById(id, session);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(client);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;
  if (!canWrite(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const client = await updateClient(session, id, parseClientBody(body));
    if (!client) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid input";
    try {
      return NextResponse.json({ errors: JSON.parse(message) }, { status: 400 });
    } catch {
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;
  if (!canWrite(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const client = await archiveClient(session, id);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
