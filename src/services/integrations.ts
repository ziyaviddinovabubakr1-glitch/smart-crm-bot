import { getDb, newId, nowIso } from "@/lib/db";
import type { SessionUser } from "@/types";

const PROVIDERS = ["telegram", "whatsapp", "instagram", "facebook", "email", "phone"] as const;

export type IntegrationProvider = (typeof PROVIDERS)[number];

export async function getIntegrations(session: SessionUser) {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM integrations WHERE user_id = ? ORDER BY provider ASC")
    .all(session.id) as Record<string, unknown>[];

  const connected = new Map(rows.map((r) => [r.provider as string, r]));

  return PROVIDERS.map((provider) => {
    const row = connected.get(provider);
    return {
      provider,
      is_active: row ? Boolean(row.is_active) : provider === "telegram" && Boolean(process.env.TELEGRAM_BOT_TOKEN),
      configured_at: (row?.configured_at as string | null) ?? null,
      status: row?.is_active || (provider === "telegram" && process.env.TELEGRAM_BOT_TOKEN)
        ? "connected"
        : "disconnected",
    };
  });
}

export async function connectIntegration(
  session: SessionUser,
  provider: string,
  accessToken?: string | null
) {
  if (!PROVIDERS.includes(provider as IntegrationProvider)) {
    return { ok: false as const, error: "unknown_provider" as const };
  }

  const db = getDb();
  const now = nowIso();
  const existing = db
    .prepare("SELECT id FROM integrations WHERE user_id = ? AND provider = ?")
    .get(session.id, provider) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE integrations SET access_token = ?, is_active = 1, configured_at = ? WHERE id = ?`
    ).run(accessToken ?? null, now, existing.id);
  } else {
    db.prepare(
      `INSERT INTO integrations (id, user_id, provider, access_token, refresh_token, is_active, configured_at, created_at)
       VALUES (?, ?, ?, ?, NULL, 1, ?, ?)`
    ).run(newId(), session.id, provider, accessToken ?? null, now, now);
  }

  return { ok: true as const };
}

export async function disconnectIntegration(session: SessionUser, provider: string) {
  const db = getDb();
  db.prepare(
    `UPDATE integrations SET is_active = 0, access_token = NULL WHERE user_id = ? AND provider = ?`
  ).run(session.id, provider);
  return { ok: true as const };
}
