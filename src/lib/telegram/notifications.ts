import {
  formatHighPriorityMessage,
  formatNewLeadMessage,
  formatReminderDueMessage,
} from "./messages";
import { sendTelegramMessage } from "./send";

export async function notifyNewLeadCreated(params: {
  name: string;
  message?: string | null;
  aiSummary?: string | null;
  urgency?: "low" | "medium" | "high";
}) {
  const main = await sendTelegramMessage(
    formatNewLeadMessage(params.name, params.message ?? "")
  );

  if (!main.ok) return main;

  if (params.urgency === "high" && params.aiSummary?.trim()) {
    const followUp = await sendTelegramMessage(
      formatHighPriorityMessage(params.name, params.aiSummary)
    );
    if (!followUp.ok) return followUp;
  }

  return main;
}

export async function notifyReminderDue(params: {
  leadName: string;
  remindAt: string;
  comment?: string | null;
}) {
  return sendTelegramMessage(
    formatReminderDueMessage(params.leadName, params.remindAt, params.comment)
  );
}
