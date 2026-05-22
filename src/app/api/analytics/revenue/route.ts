import { NextRequest } from "next/server";
import { jsonOk, withSession } from "@/lib/api/helpers";
import { getDealAnalytics, getRevenueAnalytics } from "@/services/analytics";

export async function GET(request: NextRequest) {
  return withSession(request, async (session) => {
    const months = Number(request.nextUrl.searchParams.get("months") ?? 6);
    const [revenue, deals] = await Promise.all([
      getRevenueAnalytics(session, months),
      getDealAnalytics(session),
    ]);
    return jsonOk({ revenue, deals });
  });
}
