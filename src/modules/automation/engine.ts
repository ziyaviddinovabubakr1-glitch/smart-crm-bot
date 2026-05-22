import { getDb } from "@/lib/db";
import type { CrmEvent } from "@/core/events";
import { getLeadById } from "@/services/leads";
import { notifyNewLeadCreated, sendTelegramMessage } from "@/lib/telegram";
import { createReminder } from "@/services/reminders";

interface RuleRow {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  enabled: number;
}

function loadRules(trigger: string): RuleRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM automation_rules WHERE enabled = 1 AND trigger = ?")
    .all(trigger) as unknown as RuleRow[];
}

async function executeAction(action: string, event: CrmEvent) {
  if (event.type === "lead.created" && action === "notify.telegram.new_lead") {
    const { lead } = await getLeadById(event.leadId);
    if (!lead) return;
    await notifyNewLeadCreated({
      name: lead.name,
      message: lead.message,
      aiSummary: lead.ai_summary,
      urgency: lead.score >= 80 ? "high" : "medium",
    });
    return;
  }

  if (event.type === "deal.won" && action === "notify.telegram.deal_won") {
    const { lead } = await getLeadById(event.leadId);
    if (!lead) return;
    await sendTelegramMessage(`✅ <b>Deal won:</b> ${lead.name}`);
    return;
  }

  if (
    event.type === "lead.status_changed" &&
    action === "notify.telegram.stage_change"
  ) {
    const { lead } = await getLeadById(event.leadId);
    if (!lead) return;
    await sendTelegramMessage(
      `🔄 <b>Stage:</b> ${lead.name}\n${event.from} → ${event.to}`
    );
    return;
  }

  if (event.type === "lead.no_activity" && action === "create.reminder") {
    const days = "days" in event ? event.days : 3;
    const remindAt = new Date(Date.now() + days * 86400000).toISOString();
    await createReminder(event.leadId, remindAt, "No activity follow-up");
    return;
  }
}

export async function runAutomation(event: CrmEvent) {
  const rules = loadRules(event.type);
  for (const rule of rules) {
    try {
      await executeAction(rule.action, event);
    } catch (error) {
      console.error(`[automation] rule "${rule.name}" failed:`, error);
    }
  }
}
