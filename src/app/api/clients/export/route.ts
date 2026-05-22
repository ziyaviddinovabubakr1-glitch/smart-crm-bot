import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { exportClientsCsv } from "@/services/clients";
import type { ClientStatus } from "@/types";

export async function GET(request: NextRequest) {
  const { session, error } = await requireApiSession(request);
  if (error || !session) return error!;

  const params = request.nextUrl.searchParams;
  const csv = await exportClientsCsv(session, {
    search: params.get("search") ?? undefined,
    status: (params.get("status") as ClientStatus) ?? undefined,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clients.csv"',
    },
  });
}
