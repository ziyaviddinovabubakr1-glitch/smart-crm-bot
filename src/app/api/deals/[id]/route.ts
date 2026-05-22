import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, withSession, withWriteSession } from "@/lib/api/helpers";
import { deleteDeal, getDealById, updateDeal, updateDealStage } from "@/services/deals";
import type { DealStage, PaymentStatus } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withSession(request, async (session) => {
    const { id } = await params;
    const deal = await getDealById(id, session);
    if (!deal) return jsonError("Not found", 404);
    return jsonOk(deal);
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withWriteSession(request, async (session) => {
    const { id } = await params;
    const body = await parseJsonBody<Record<string, unknown>>(request);

    const deal = await updateDeal(session, id, {
      title: body.title as string | undefined,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      currency: body.currency as string | undefined,
      probability: body.probability !== undefined ? Number(body.probability) : undefined,
      payment_status: body.payment_status as PaymentStatus | undefined,
      stage: body.stage as DealStage | undefined,
      close_date: (body.close_date as string | null | undefined) ?? undefined,
      comment: (body.comment as string | null | undefined) ?? undefined,
    });

    if (!deal) return jsonError("Not found", 404);
    return jsonOk(deal);
  });
}

export async function PATCH(request: NextRequest, ctx: Params) {
  return PUT(request, ctx);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withWriteSession(request, async (session) => {
    const { id } = await params;
    const deal = await deleteDeal(session, id);
    if (!deal) return jsonError("Not found", 404);
    return jsonOk({ ok: true, id: deal.id });
  });
}
