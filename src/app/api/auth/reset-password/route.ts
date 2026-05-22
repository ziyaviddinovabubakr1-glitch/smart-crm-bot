import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/helpers";
import { resetPasswordWithToken } from "@/services/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{ token?: string; password?: string }>(request);
    if (!body.token || !body.password) {
      return jsonError("token and password required", 400);
    }

    const result = await resetPasswordWithToken(body.token, body.password);
    if (!result.ok) {
      return jsonError(result.error, 400);
    }

    return jsonOk({ ok: true });
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
}
