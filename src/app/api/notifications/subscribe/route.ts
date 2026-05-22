import { NextRequest } from "next/server";
import { jsonOk, parseJsonBody, withSession } from "@/lib/api/helpers";

export async function POST(request: NextRequest) {
  return withSession(request, async (session) => {
    const body = await parseJsonBody<{ endpoint?: string; keys?: Record<string, string> }>(request);

    console.info("[push-subscribe-stub]", session.id, body.endpoint ?? "no-endpoint");

    return jsonOk({
      ok: true,
      subscribed: true,
      message: "Web Push subscription stored (stub)",
    });
  });
}
