import { NextRequest } from "next/server";
import { jsonOk, withSession } from "@/lib/api/helpers";
import { getFunnelData } from "@/services/analytics";

export async function GET(request: NextRequest) {
  return withSession(request, async () => {
    const funnel = await getFunnelData();
    return jsonOk({ funnel });
  });
}
