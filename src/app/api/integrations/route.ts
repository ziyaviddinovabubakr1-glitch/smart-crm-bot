import { NextRequest } from "next/server";
import { jsonOk, withSession } from "@/lib/api/helpers";
import { getIntegrations } from "@/services/integrations";

export async function GET(request: NextRequest) {
  return withSession(request, async (session) => {
    const integrations = await getIntegrations(session);
    return jsonOk({ integrations });
  });
}
