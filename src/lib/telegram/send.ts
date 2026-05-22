import { getTelegramConfig } from "./config";

const TELEGRAM_API = "https://api.telegram.org/bot";

export type TelegramSendResult =
  | { ok: true; messageId?: number }
  | { ok: false; error: string; skipped?: boolean };

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
  result?: { message_id?: number };
}

export async function sendTelegramMessage(text: string): Promise<TelegramSendResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "Message text is empty" };
  }

  const config = getTelegramConfig();
  if (!config) {
    return {
      ok: false,
      error: "Telegram is not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)",
      skipped: true,
    };
  }

  try {
    const res = await fetch(`${TELEGRAM_API}${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: trimmed,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    let payload: TelegramApiResponse | null = null;
    try {
      payload = (await res.json()) as TelegramApiResponse;
    } catch {
      payload = null;
    }

    if (!res.ok || !payload?.ok) {
      const error =
        payload?.description ??
        `Telegram API request failed (${res.status} ${res.statusText})`;
      console.error("[telegram] send failed:", error);
      return { ok: false, error };
    }

    return { ok: true, messageId: payload.result?.message_id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error";
    console.error("[telegram] send error:", message);
    return { ok: false, error: message };
  }
}
