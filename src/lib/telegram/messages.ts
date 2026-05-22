export function formatNewLeadMessage(name: string, preview: string) {
  const text = preview.trim().slice(0, 200);
  return `🆕 <b>Новый лид:</b> ${escapeHtml(name)}${text ? `\n\n${escapeHtml(text)}` : ""}`;
}

export function formatReminderDueMessage(
  name: string,
  remindAt: string,
  comment?: string | null
) {
  const when = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(remindAt));

  const lines = [`⏰ <b>Напоминание:</b> позвонить ${escapeHtml(name)}`, `Время: ${when}`];
  if (comment?.trim()) {
    lines.push(escapeHtml(comment.trim()));
  }
  return lines.join("\n");
}

export function formatHighPriorityMessage(name: string, summary: string) {
  return `🧠 <b>Высокий приоритет:</b> ${escapeHtml(name)}\n${escapeHtml(summary.trim())}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
