import { NextRequest } from "next/server";
import { jsonOk, withSession } from "@/lib/api/helpers";
import { getAnalyticsDashboard } from "@/services/analytics";

export async function GET(request: NextRequest) {
  return withSession(request, async (session) => {
    const dashboard = await getAnalyticsDashboard(session);
    return jsonOk(dashboard);
  });
}
