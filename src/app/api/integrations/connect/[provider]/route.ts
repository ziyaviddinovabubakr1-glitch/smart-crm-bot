import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, withWriteSession } from "@/lib/api/helpers";
import { connectIntegration } from "@/services/integrations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  return withWriteSession(request, async (session) => {
    const { provider } = await params;
    let accessToken: string | null = null;

    try {
      const body = await parseJsonBody<{ access_token?: string }>(request);
      accessToken = body.access_token ?? null;
    } catch {
      // optional body
    }

    const result = await connectIntegration(session, provider, accessToken);
    if (!result.ok) return jsonError(result.error, 400);
    return jsonOk({ ok: true, provider });
  });
}
