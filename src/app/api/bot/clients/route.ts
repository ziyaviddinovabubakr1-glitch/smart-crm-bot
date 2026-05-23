import { NextRequest, NextResponse } from "next/server";
import { getBotAdminSession, verifyBotApiKey } from "@/lib/bot/auth";
import { clientFullName } from "@/lib/db/mappers";
import { getClients } from "@/services/clients";

export async function GET(request: NextRequest) {
  if (!verifyBotApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = getBotAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No admin user in CRM" }, { status: 503 });
  }

  const limit = Math.min(
    20,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 10))
  );

  const result = await getClients({ page: 1, limit }, session);

  return NextResponse.json({
    clients: result.clients.map((client) => ({
      id: client.id,
      name: clientFullName(client),
      phone: client.phone,
      email: client.email,
      status: client.status,
      source: client.source,
      created_at: client.created_at,
    })),
    total: result.total,
  });
}
