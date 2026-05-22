import { NextRequest, NextResponse } from "next/server";
import { createLeadFromTelegram } from "@/lib/telegram/intake";

type TelegramUpdate = {
  message?: {
    message_id: number;
    from?: { id: number; first_name?: string; last_name?: string; username?: string };
    chat: { id: number };
    text?: string;
    contact?: { phone_number: string };
  };
};

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (
    process.env.TELEGRAM_WEBHOOK_SECRET &&
    secret !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TelegramUpdate;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const msg = body.message;
  if (!msg?.text && !msg?.contact) {
    return NextResponse.json({ ok: true });
  }

  const from = msg.from;
  const name =
    [from?.first_name, from?.last_name].filter(Boolean).join(" ") ||
    from?.username ||
    "Пользователь Telegram";

  const text = msg.text ?? "Контакт передан";
  const phone = msg.contact?.phone_number;

  await createLeadFromTelegram({
    telegramUserId: String(from?.id ?? msg.chat.id),
    telegramChatId: String(msg.chat.id),
    name,
    text,
    phone,
  });

  return NextResponse.json({ ok: true });
}
