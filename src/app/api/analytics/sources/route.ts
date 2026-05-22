import { NextRequest } from "next/server";
import { jsonOk, withSession } from "@/lib/api/helpers";
import { getSourcePerformance } from "@/services/analytics";

export async function GET(request: NextRequest) {
  return withSession(request, async () => {
    const sources = await getSourcePerformance();
    return jsonOk({ sources });
  });
}
