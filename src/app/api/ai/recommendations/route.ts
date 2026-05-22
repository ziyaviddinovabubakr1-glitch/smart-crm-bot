import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, withSession } from "@/lib/api/helpers";
import { getClientRecommendations } from "@/services/ai";

export async function POST(request: NextRequest) {
  return withSession(request, async (session) => {
    const body = await parseJsonBody<{ client_id?: string }>(request);
    if (!body.client_id) return jsonError("client_id required", 400);

    const result = await getClientRecommendations(body.client_id, session);
    if (!result) return jsonError("Client not found", 404);
    return jsonOk(result);
  });
}
