import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, withSession } from "@/lib/api/helpers";
import { generateAutoReply } from "@/services/ai";

export async function POST(request: NextRequest) {
  return withSession(request, async () => {
    const body = await parseJsonBody<{ name?: string; message?: string; context?: string }>(request);
    if (!body.name || !body.message) {
      return jsonError("name and message required", 400);
    }

    const result = await generateAutoReply({
      name: body.name,
      message: body.message,
      context: body.context,
    });
    return jsonOk(result);
  });
}
