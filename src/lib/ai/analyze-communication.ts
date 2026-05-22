import type { CommunicationDirection, InteractionType, Sentiment } from "@/types";

export type CommunicationAiInsight = {
  summary: string;
  outcome: string;
  sentiment: Sentiment;
  sentiment_score: number;
  tags: string[];
  ai_analysis: Record<string, unknown>;
};

type AnalyzeInput = {
  type: InteractionType;
  content: string;
  subject?: string | null;
  direction?: CommunicationDirection | null;
  channel?: string | null;
  clientName?: string;
};

export async function analyzeCommunication(
  input: AnalyzeInput
): Promise<CommunicationAiInsight> {
  const apiKey = process.env.OPENAI_API_KEY;
  const text = [input.subject, input.content].filter(Boolean).join("\n\n");

  if (apiKey && text.trim()) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey });
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `CRM assistant. Analyze a ${input.type} communication. Reply JSON only:
{"summary":"ru 1-2 sentences","outcome":"ru result/next step","sentiment":"positive|neutral|negative","sentiment_score":-1..1,"tags":["..."],"key_points":["..."],"risk_level":"low|medium|high","recommended_action":"ru"}`,
          },
          {
            role: "user",
            content: `Client: ${input.clientName ?? "—"}
Type: ${input.type}
Direction: ${input.direction ?? "—"}
Channel: ${input.channel ?? "—"}
Text:
${text}`,
          },
        ],
      });

      const raw = res.choices[0]?.message?.content;
      if (raw) {
        const p = JSON.parse(raw) as Record<string, unknown>;
        const sentiment = normalizeSentiment(String(p.sentiment ?? "neutral"));
        return {
          summary: String(p.summary ?? "").trim() || fallbackSummary(input),
          outcome: String(p.outcome ?? p.recommended_action ?? "").trim() || "Требуется follow-up",
          sentiment,
          sentiment_score: clampScore(Number(p.sentiment_score), sentiment),
          tags: normalizeTags(p.tags),
          ai_analysis: {
            key_points: Array.isArray(p.key_points) ? p.key_points : [],
            risk_level: p.risk_level ?? "medium",
            recommended_action: p.recommended_action ?? null,
          },
        };
      }
    } catch {
      // fallback below
    }
  }

  return mockAnalyzeCommunication(input);
}

function normalizeSentiment(value: string): Sentiment {
  if (value === "positive" || value === "negative") return value;
  return "neutral";
}

function clampScore(raw: number, sentiment: Sentiment): number {
  if (!Number.isFinite(raw)) {
    return sentiment === "positive" ? 0.6 : sentiment === "negative" ? -0.6 : 0;
  }
  return Math.max(-1, Math.min(1, raw));
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean).slice(0, 8);
}

function fallbackSummary(input: AnalyzeInput): string {
  const preview = input.content.trim().slice(0, 120);
  return preview || `Коммуникация: ${input.type}`;
}

function mockAnalyzeCommunication(input: AnalyzeInput): CommunicationAiInsight {
  const text = `${input.subject ?? ""} ${input.content}`.toLowerCase();
  const negative = /жалоб|плох|отказ|дорог|не устра|разочар|проблем/i.test(text);
  const positive = /спасиб|готов|соглас|оплат|интерес|хочу|давайте|отлич/i.test(text);
  const sentiment: Sentiment = negative ? "negative" : positive ? "positive" : "neutral";
  const tags: string[] = [];

  if (/продаж|куп|заказ|сделк/i.test(text)) tags.push("продажа");
  if (/вопрос|уточн|как|сколько/i.test(text)) tags.push("вопрос");
  if (negative) tags.push("жалоба");
  if (input.type === "call") tags.push("звонок");
  if (input.type === "email") tags.push("email");

  return {
    summary: fallbackSummary(input),
    outcome: positive
      ? "Клиент заинтересован — зафиксируйте следующий шаг и срок."
      : negative
        ? "Есть негатив — нужен быстрый ответ менеджера."
        : "Стандартный контакт — уточните потребность и зафиксируйте follow-up.",
    sentiment,
    sentiment_score: sentiment === "positive" ? 0.55 : sentiment === "negative" ? -0.55 : 0,
    tags: tags.length ? tags : ["коммуникация"],
    ai_analysis: {
      key_points: [input.content.trim().slice(0, 160)],
      risk_level: negative ? "high" : positive ? "low" : "medium",
      recommended_action: positive ? "Назначить следующий контакт" : "Ответить клиенту",
      source: "heuristic",
    },
  };
}
