import { getDb, newId, nowIso } from "@/lib/db";
import { mapReminder, mapReminderWithLead } from "@/lib/db/mappers";
import type { Reminder, ReminderWithLead } from "@/types";

export async function getRemindersByLead(leadId: string) {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM reminders WHERE lead_id = ? ORDER BY remind_at ASC")
    .all(leadId) as Record<string, unknown>[];

  return rows.map(mapReminder) as Reminder[];
}

export async function getUpcomingReminders(limit = 5) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT r.*, l.name AS lead_name
       FROM reminders r
       JOIN leads l ON l.id = r.lead_id
       WHERE r.status = 'pending' AND r.remind_at >= ?
       ORDER BY r.remind_at ASC
       LIMIT ?`
    )
    .all(nowIso(), limit) as Record<string, unknown>[];

  return rows.map(mapReminderWithLead) as ReminderWithLead[];
}

export async function createReminder(leadId: string, remind_at: string, comment?: string) {
  const db = getDb();
  const id = newId();
  const now = nowIso();

  db.prepare(
    `INSERT INTO reminders (id, lead_id, remind_at, comment, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`
  ).run(id, leadId, remind_at, comment ?? null, now);
}

export async function getDueReminders() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT r.*, l.name AS lead_name
       FROM reminders r
       JOIN leads l ON l.id = r.lead_id
       WHERE r.status = 'pending'
         AND r.remind_at <= ?
         AND r.notified_at IS NULL`
    )
    .all(nowIso()) as Record<string, unknown>[];

  return rows.map(mapReminderWithLead) as ReminderWithLead[];
}

export async function markReminderNotified(id: string) {
  const db = getDb();
  db.prepare("UPDATE reminders SET notified_at = ? WHERE id = ?").run(nowIso(), id);
}
