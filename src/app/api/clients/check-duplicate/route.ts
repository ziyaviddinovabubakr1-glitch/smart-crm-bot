import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { findDuplicateClients } from "@/services/duplicates";

export async function GET(request: NextRequest) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;

  const phone = request.nextUrl.searchParams.get("phone");
  const email = request.nextUrl.searchParams.get("email");
  const duplicates = await findDuplicateClients(session, { phone, email });

  return NextResponse.json({ duplicates });
}
