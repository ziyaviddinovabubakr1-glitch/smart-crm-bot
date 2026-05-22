import { analyzeCommunication } from "@/lib/ai/analyze-communication";
import { analyzeMessage } from "@/lib/ai/analyze";
import { clientFullName } from "@/lib/db/mappers";
import { getClientById } from "@/services/clients";
import { getInteractionsByClient } from "@/services/interactions";
import type { SessionUser } from "@/types";

export async function analyzeClientById(clientId: string, session: SessionUser) {
  const client = await getClientById(clientId, session);
  if (!client) return null;

  const interactions = await getInteractionsByClient(clientId, session, { limit: 30 });
  const transcript = interactions
    .map((i) => {
      const parts = [
        i.summary ? `[summary] ${i.summary}` : null,
        i.subject ? `[subject] ${i.subject}` : null,
        `[${i.type}] ${i.content}`,
      ].filter(Boolean);
      return parts.join(" ");
    })
    .join("\n");

  const insight = await analyzeMessage(
    clientFullName(client),
    transcript || client.phone || "Нет данных"
  );

  const latest = interactions[0];
  let communicationInsight = null;
  if (latest?.content) {
    communicationInsight = await analyzeCommunication({
      type: latest.type,
      content: latest.content,
      subject: latest.subject,
      direction: latest.direction,
      channel: latest.channel,
      clientName: clientFullName(client),
    });
  }

  return {
    client_id: clientId,
    ...insight,
    latest_communication: communicationInsight,
    communications_analyzed: interactions.length,
  };
}

export async function generateClientSummary(clientId: string, session: SessionUser) {
  const result = await analyzeClientById(clientId, session);
  if (!result) return null;

  return {
    client_id: clientId,
    summary: result.summary,
    score: result.score,
    temperature: result.temperature,
  };
}

export async function getClientRecommendations(clientId: string, session: SessionUser) {
  const result = await analyzeClientById(clientId, session);
  if (!result) return null;

  return {
    client_id: clientId,
    recommendations: result.recommendations,
    urgency: result.urgency,
    score: result.score,
  };
}

export async function generateAutoReply(input: { name: string; message: string; context?: string }) {
  const insight = await analyzeMessage(input.name, input.message);

  const reply =
    insight.temperature === "hot"
      ? `Здравствуйте, ${input.name}! Спасибо за обращение. Свяжусь с вами в ближайшие 30 минут.`
      : `Здравствуйте, ${input.name}! Получил ваше сообщение и скоро отвечу подробнее.`;

  return {
    reply,
    insight,
    context: input.context ?? null,
  };
}
