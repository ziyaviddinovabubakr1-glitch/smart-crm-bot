import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import type { SessionUser } from "@/types";

export function verifyBotApiKey(request: NextRequest): boolean {
  const expected =
    process.env.BOT_API_KEY?.trim() ||
    process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  if (!expected) return false;

  const provided =
    request.headers.get("x-bot-api-key")?.trim() ||
    request.headers.get("x-telegram-bot-api-secret-token")?.trim();

  return provided === expected;
}

export function getBotAdminSession(): SessionUser | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, email, name, role FROM users
       WHERE role = 'admin'
       ORDER BY created_at ASC
       LIMIT 1`
    )
    .get() as
    | { id: string; email: string; name: string; role: SessionUser["role"] }
    | undefined;

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}
