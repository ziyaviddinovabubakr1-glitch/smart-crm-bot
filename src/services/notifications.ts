import { getDb, newId, nowIso } from "@/lib/db";
import { mapNotification } from "@/lib/db/mappers";
import type { AppNotification } from "@/types";

export async function getNotificationSettings(userId: string) {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM user_notification_settings WHERE user_id = ?")
    .get(userId) as Record<string, unknown> | undefined;

  if (!row) {
    return {
      user_id: userId,
      email_enabled: false,
      in_app_enabled: true,
      updated_at: nowIso(),
    };
  }

  return {
    user_id: row.user_id as string,
    email_enabled: Boolean(row.email_enabled),
    in_app_enabled: Boolean(row.in_app_enabled),
    updated_at: row.updated_at as string,
  };
}

export async function updateNotificationSettings(
  userId: string,
  input: { email_enabled?: boolean; in_app_enabled?: boolean }
) {
  const db = getDb();
  const current = await getNotificationSettings(userId);
  const emailEnabled = input.email_enabled ?? current.email_enabled;
  const inAppEnabled = input.in_app_enabled ?? current.in_app_enabled;
  const updatedAt = nowIso();

  db.prepare(
    `INSERT INTO user_notification_settings (user_id, email_enabled, in_app_enabled, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       email_enabled = excluded.email_enabled,
       in_app_enabled = excluded.in_app_enabled,
       updated_at = excluded.updated_at`
  ).run(userId, emailEnabled ? 1 : 0, inAppEnabled ? 1 : 0, updatedAt);

  return getNotificationSettings(userId);
}

export async function createNotification(
  userId: string,
  input: {
    type?: string;
    title: string;
    message: string;
    href?: string | null;
  }
) {
  const settings = await getNotificationSettings(userId);
  if (!settings.in_app_enabled) return null;

  const db = getDb();
  const id = newId();
  const now = nowIso();

  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, href, is_read, read_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, NULL, ?)`
  ).run(
    id,
    userId,
    input.type ?? "info",
    input.title,
    input.message,
    input.href ?? null,
    now
  );

  return mapNotification(
    db.prepare("SELECT * FROM notifications WHERE id = ?").get(id) as Record<string, unknown>
  );
}

export async function getNotifications(userId: string, limit = 20): Promise<AppNotification[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM notifications WHERE user_id = ?
       ORDER BY is_read ASC, created_at DESC LIMIT ?`
    )
    .all(userId, limit) as Record<string, unknown>[];

  return rows.map(mapNotification);
}

export async function getUnreadNotificationCount(userId: string) {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0")
    .get(userId) as { c: number };
  return row.c;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const db = getDb();
  db.prepare(
    `UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ? AND user_id = ?`
  ).run(nowIso(), notificationId, userId);
}

export async function markAllNotificationsRead(userId: string) {
  const db = getDb();
  db.prepare(
    `UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0`
  ).run(nowIso(), userId);
}

export async function sendEmailNotificationStub(input: {
  to: string;
  subject: string;
  body: string;
}) {
  console.info("[email-stub]", input.to, input.subject, input.body.slice(0, 120));
  return { ok: true, provider: "stub" as const };
}
