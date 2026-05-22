import { NextRequest } from "next/server";
import { jsonOk, withSession } from "@/lib/api/helpers";
import { getManagerPerformance } from "@/services/analytics";

export async function GET(request: NextRequest) {
  return withSession(request, async (session) => {
    const managers = await getManagerPerformance(session);
    return jsonOk({ managers });
  });
}
