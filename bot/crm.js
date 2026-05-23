const CRM_WEBHOOK_PATH = "/api/telegram/webhook";

function getCrmConfig() {
  const baseUrl = process.env.CRM_API_URL?.replace(/\/$/, "");
  const secret = process.env.CRM_WEBHOOK_SECRET?.trim();

  if (!baseUrl) {
    throw new Error("CRM_API_URL is not set");
  }

  return { baseUrl, secret };
}

/**
 * Sends a Telegram-style update payload to Smart CRM webhook.
 * CRM creates a client + deal + interaction from incoming messages.
 */
async function sendLeadToCrm(updatePayload) {
  const { baseUrl, secret } = getCrmConfig();
  const headers = { "Content-Type": "application/json" };

  if (secret) {
    headers["x-telegram-bot-api-secret-token"] = secret;
  }

  const response = await fetch(`${baseUrl}${CRM_WEBHOOK_PATH}`, {
    method: "POST",
    headers,
    body: JSON.stringify(updatePayload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`CRM API ${response.status}: ${body || response.statusText}`);
  }

  return response.json().catch(() => ({ ok: true }));
}

function buildUpdateFromMessage(ctx) {
  const msg = ctx.message;
  if (!msg) return null;

  return {
    message: {
      message_id: msg.message_id,
      from: msg.from
        ? {
            id: msg.from.id,
            first_name: msg.from.first_name,
            last_name: msg.from.last_name,
            username: msg.from.username,
          }
        : undefined,
      chat: { id: msg.chat.id },
      text: msg.text,
      contact: msg.contact
        ? { phone_number: msg.contact.phone_number }
        : undefined,
    },
  };
}

module.exports = {
  sendLeadToCrm,
  buildUpdateFromMessage,
};
