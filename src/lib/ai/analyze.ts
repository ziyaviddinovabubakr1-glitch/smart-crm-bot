import type { AiInsight, AiTemperature } from "@/types";

/**
 * Analyze incoming Telegram message.
 * Uses OpenAI when configured; falls back to heuristic mock.
 */
export async function analyzeMessage(
  name: string,
  message: string
): Promise<AiInsight> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey });
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Sales assistant for internal CRM. Reply JSON only:
{"summary":"ru 1-2 sentences","recommendations":["..."],"temperature":"hot|warm|cold","score":0-100,"urgency":"low|medium|high"}`,
          },
          {
            role: "user",
            content: `Client: ${name}\nMessage: ${message}`,
          },
        ],
      });
      const raw = res.choices[0]?.message?.content;
      if (raw) {
        const p = JSON.parse(raw);
        return {
          summary: p.summary ?? "",
          recommendations: p.recommendations ?? [],
          temperature: (p.temperature as AiTemperature) ?? "warm",
          score: Number(p.score) || 50,
          urgency: p.urgency ?? "medium",
        };
      }
    } catch {
      // fall through to mock
    }
  }

  return mockAnalyze(message);
}

function mockAnalyze(message: string): AiInsight {
  const urgent = /срочно|сегодня|хочу|заказ/i.test(message);
  return {
    summary: message.slice(0, 120) || "Новая заявка из Telegram",
    recommendations: [
      urgent ? "Перезвонить в течение 30 минут" : "Связаться в рабочее время",
      "Уточнить потребность и бюджет",
    ],
    temperature: urgent ? "hot" : "warm",
    score: urgent ? 72 : 48,
    urgency: urgent ? "high" : "medium",
  };
}
