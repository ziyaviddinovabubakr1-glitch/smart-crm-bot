import { NextRequest, NextResponse } from "next/server";
import { jsonError, jsonOk, parseJsonBody, withSession, withWriteSession } from "@/lib/api/helpers";
import { createCommunicationSchema } from "@/lib/validation/communications";
import { canWrite, requireApiSession } from "@/lib/auth/api";
import {
  createCommunication,
  getInteractionsByClient,
  updateInteractionStatus,
} from "@/services/interactions";
import type { InteractionStatus, InteractionType } from "@/types";

export async function GET(request: NextRequest) {
  return withSession(request, async (session) => {
    const clientId = request.nextUrl.searchParams.get("clientId");
    if (!clientId) return jsonError("clientId required", 400);

    const type = request.nextUrl.searchParams.get("type") as InteractionType | null;
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;

    const communications = await getInteractionsByClient(clientId, session, {
      type: type ?? undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return jsonOk({ communications, interactions: communications });
  });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;
  if (!canWrite(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await parseJsonBody<Record<string, unknown> & { client_id?: string }>(request);
  if (!body.client_id) return jsonError("client_id required", 400);

  const parsed = createCommunicationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, {
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const communication = await createCommunication(session, {
    client_id: String(body.client_id),
    ...parsed.data,
  });

  return jsonOk(communication, 201);
}

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;
  if (!canWrite(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await parseJsonBody<{ id?: string; status?: InteractionStatus }>(request);
  if (!body.id || !body.status) {
    return jsonError("id and status required", 400);
  }

  const communication = await updateInteractionStatus(session, body.id, body.status);
  if (!communication) return jsonError("Not found", 404);

  return jsonOk(communication);
}
