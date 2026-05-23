import { NextRequest, NextResponse } from "next/server";
import { getBotAdminSession, verifyBotApiKey } from "@/lib/bot/auth";
import { globalSearch } from "@/services/search";

export async function GET(request: NextRequest) {
  if (!verifyBotApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ error: "Query parameter q is required" }, { status: 400 });
  }

  const session = getBotAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No admin user in CRM" }, { status: 503 });
  }

  const results = await globalSearch(session, q, 8);

  return NextResponse.json({
    query: q,
    results: results.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
    })),
  });
}
