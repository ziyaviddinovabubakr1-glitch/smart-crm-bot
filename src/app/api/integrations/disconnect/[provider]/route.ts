import { NextRequest } from "next/server";
import { jsonOk, withWriteSession } from "@/lib/api/helpers";
import { disconnectIntegration } from "@/services/integrations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  return withWriteSession(request, async (session) => {
    const { provider } = await params;
    await disconnectIntegration(session, provider);
    return jsonOk({ ok: true, provider });
  });
}
