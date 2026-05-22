import { NextRequest, NextResponse } from "next/server";
import { notifyReminderDue } from "@/lib/telegram";
import { getDueReminders, markReminderNotified } from "@/services/reminders";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await getDueReminders();
  let sent = 0;
  const errors: string[] = [];

  for (const reminder of due) {
    const leadName = reminder.lead?.name ?? "Client";

    const result = await notifyReminderDue({
      leadName,
      remindAt: reminder.remind_at,
      comment: reminder.comment,
    });

    if (result.ok) {
      await markReminderNotified(reminder.id);
      sent++;
    } else if (!result.skipped) {
      errors.push(result.error);
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    sent,
    failed: errors.length,
    errors: errors.length ? errors : undefined,
  });
}
