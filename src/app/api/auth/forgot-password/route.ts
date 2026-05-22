import { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/helpers";
import { createPasswordResetToken } from "@/services/auth";
import { sendEmailNotificationStub } from "@/services/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{ email?: string }>(request);
    if (!body.email?.trim()) {
      return jsonError("email required", 400);
    }

    const result = await createPasswordResetToken(body.email);
    if (result.token) {
      await sendEmailNotificationStub({
        to: result.email!,
        subject: "Сброс пароля CRM",
        body: `Токен сброса: ${result.token}\nДействителен 1 час.`,
      });
    }

    return jsonOk({ ok: true, message: "If the email exists, reset instructions were sent" });
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
}
