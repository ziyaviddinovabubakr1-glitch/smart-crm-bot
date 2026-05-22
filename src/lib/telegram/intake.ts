import { createClientFromTelegram } from "@/services/clients";

export interface TelegramMessagePayload {
  telegramUserId: string;
  telegramChatId: string;
  name: string;
  text: string;
  phone?: string;
}

export async function createLeadFromTelegram(payload: TelegramMessagePayload) {
  try {
    const result = await createClientFromTelegram(payload);
    if (!result) return null;

    if (result.duplicate) {
      console.info("[telegram] duplicate client:", result.client.id);
    }

    return result.client;
  } catch (error) {
    console.error("Failed to create client from Telegram:", error);
    return null;
  }
}
