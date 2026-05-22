import { NextRequest, NextResponse } from "next/server";
import { canWrite, requireApiSession } from "@/lib/auth/api";
import { createDeal, getDeals } from "@/services/deals";
import type { DealStage, PaymentStatus } from "@/types";

export async function GET(request: NextRequest) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;

  const clientId = request.nextUrl.searchParams.get("clientId") ?? undefined;
  const deals = await getDeals(session, clientId);
  return NextResponse.json({ deals });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;
  if (!canWrite(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.client_id || !body.title) {
    return NextResponse.json({ error: "client_id and title required" }, { status: 400 });
  }

  const deal = await createDeal(session, {
    client_id: String(body.client_id),
    title: String(body.title),
    amount: Number(body.amount ?? 0),
    currency: String(body.currency ?? "RUB"),
    probability: body.probability !== undefined ? Number(body.probability) : undefined,
    payment_status: body.payment_status as PaymentStatus | undefined,
    stage: body.stage as DealStage | undefined,
    close_date: body.close_date ?? null,
    comment: body.comment ?? null,
  });

  return NextResponse.json(deal, { status: 201 });
}
