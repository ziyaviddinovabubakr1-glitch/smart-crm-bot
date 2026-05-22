import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, withSession, withWriteSession } from "@/lib/api/helpers";
import { updateCommunicationSchema } from "@/lib/validation/communications";
import { analyzeCommunicationById, getInteractionById, updateInteraction } from "@/services/interactions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSession(request, async (session) => {
    const { id } = await params;
    const communication = await getInteractionById(id, session);
    if (!communication) return jsonError("Not found", 404);
    return jsonOk(communication);
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withWriteSession(request, async (session) => {
    const { id } = await params;
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const parsed = updateCommunicationSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Validation failed", 400, {
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const communication = await updateInteraction(session, id, parsed.data);
    if (!communication) return jsonError("Not found", 404);
    return jsonOk(communication);
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withWriteSession(request, async (session) => {
    const { id } = await params;
    const communication = await analyzeCommunicationById(session, id);
    if (!communication) return jsonError("Not found", 404);
    return jsonOk(communication);
  });
}
