export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export function getTelegramConfig(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId =
    process.env.TELEGRAM_CHAT_ID?.trim() ||
    process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();

  if (!botToken || !chatId) return null;

  return { botToken, chatId };
}

export function isTelegramConfigured(): boolean {
  return getTelegramConfig() !== null;
}
