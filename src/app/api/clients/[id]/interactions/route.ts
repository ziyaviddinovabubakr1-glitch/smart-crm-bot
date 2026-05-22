import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, withSession, withWriteSession } from "@/lib/api/helpers";
import { createCommunicationSchema } from "@/lib/validation/communications";
import { analyzeCommunicationById, createCommunication, getInteractionsByClient } from "@/services/interactions";
import type { InteractionType } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSession(request, async (session) => {
    const { id: clientId } = await params;
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withWriteSession(request, async (session) => {
    const { id: clientId } = await params;
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const parsed = createCommunicationSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Validation failed", 400, {
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const communication = await createCommunication(session, {
      client_id: clientId,
      ...parsed.data,
    });

    return jsonOk(communication, 201);
  });
}

export async function PATCH(request: NextRequest) {
  return withWriteSession(request, async (session) => {
    const body = await parseJsonBody<{ communication_id?: string; analyze?: boolean }>(request);
    if (!body.communication_id) {
      return jsonError("communication_id required", 400);
    }

    const result = await analyzeCommunicationById(session, body.communication_id);
    if (!result) return jsonError("Not found", 404);

    return jsonOk(result);
  });
}
