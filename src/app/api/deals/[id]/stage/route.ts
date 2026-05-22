import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, withWriteSession } from "@/lib/api/helpers";
import { updateDealStage } from "@/services/deals";
import type { DealStage } from "@/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withWriteSession(request, async (session) => {
    const { id } = await params;
    const body = await parseJsonBody<{ stage?: DealStage }>(request);

    if (!body.stage) {
      return jsonError("stage required", 400);
    }

    const deal = await updateDealStage(session, id, body.stage);
    if (!deal) return jsonError("Not found", 404);
    return jsonOk(deal);
  });
}
