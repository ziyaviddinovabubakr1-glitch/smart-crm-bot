require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");
const express = require("express");
const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN?.trim();
const port = Number(process.env.PORT || 8080);
const IS_RENDER = Boolean(
  process.env.RENDER_EXTERNAL_URL || process.env.RENDER === "true"
);

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is required");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();
app.use(express.json());

// ID админа (ваш Telegram ID). Укажите в .env после деплоя
const ADMIN_ID = process.env.ADMIN_ID || "YOUR_TELEGRAM_USER_ID_HERE";

// URL CRM API
const CRM_URL = process.env.CRM_API_URL?.replace(/\/$/, "");
const WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET?.trim();
const CRM_API_KEY = process.env.CRM_API_KEY?.trim() || WEBHOOK_SECRET;

// ===== ФУНКЦИИ =====

function getCrmHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (CRM_API_KEY) {
    headers["x-bot-api-key"] = CRM_API_KEY;
  }
  return headers;
}

async function fetchCrmClients(limit = 10) {
  if (!CRM_URL) throw new Error("CRM_API_URL is not set");

  const { data } = await axios.get(`${CRM_URL}/api/bot/clients`, {
    headers: getCrmHeaders(),
    params: { limit },
  });

  return data;
}

async function searchCrm(query) {
  if (!CRM_URL) throw new Error("CRM_API_URL is not set");

  const { data } = await axios.get(`${CRM_URL}/api/bot/search`, {
    headers: getCrmHeaders(),
    params: { q: query },
  });

  return data;
}

function formatClientList(clients) {
  if (!clients?.length) {
    return "📋 Клиентов пока нет.";
  }

  return clients
    .map((client, index) => {
      const phone = client.phone ? `\n   📞 ${client.phone}` : "";
      return `${index + 1}. <b>${escapeHtml(client.name)}</b>${phone}\n   📊 ${client.status} · ${client.source}`;
    })
    .join("\n\n");
}

function formatSearchResults(results, query) {
  if (!results?.length) {
    return `🔍 По запросу «${escapeHtml(query)}» ничего не найдено.`;
  }

  const lines = results.map((item, index) => {
    const typeLabel =
      item.type === "client"
        ? "Клиент"
        : item.type === "deal"
          ? "Сделка"
          : "Лид";
    return `${index + 1}. <b>${escapeHtml(item.title)}</b> (${typeLabel})\n   ${escapeHtml(item.subtitle)}`;
  });

  return [`🔍 Результаты по «${escapeHtml(query)}»:`, "", ...lines].join("\n");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isAdmin(userId) {
  if (!ADMIN_ID || ADMIN_ID === "YOUR_TELEGRAM_USER_ID_HERE") return false;
  return String(userId) === String(ADMIN_ID);
}

// Отправка уведомления админу
async function notifyAdmin(message) {
  try {
    if (!ADMIN_ID || ADMIN_ID === "YOUR_TELEGRAM_USER_ID_HERE") return;
    await bot.telegram.sendMessage(ADMIN_ID, message, { parse_mode: "HTML" });
  } catch (e) {
    console.error("Ошибка отправки уведомления админу:", e.message);
  }
}

// Простая эмуляция ИИ-анализа
function analyzeMessage(text) {
  const lowerText = text.toLowerCase();
  let sentiment = "NEUTRAL";
  const tags = [];

  if (
    lowerText.includes("хочу") ||
    lowerText.includes("купить") ||
    lowerText.includes("заказать")
  ) {
    sentiment = "POSITIVE";
    tags.push("потенциальная_продажа");
  } else if (
    lowerText.includes("проблема") ||
    lowerText.includes("не работает") ||
    lowerText.includes("жалоба")
  ) {
    sentiment = "NEGATIVE";
    tags.push("жалоба");
  } else if (lowerText.includes("вопрос") || lowerText.includes("как")) {
    tags.push("вопрос");
  }

  return {
    sentiment,
    tags,
    summary: text.length > 50 ? `${text.substring(0, 50)}...` : text,
  };
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

async function sendLeadToCrm(ctx) {
  if (!CRM_URL) {
    throw new Error("CRM_API_URL is not set");
  }

  const payload = buildUpdateFromMessage(ctx);
  if (!payload?.message?.text && !payload?.message?.contact) {
    return false;
  }

  const headers = { "Content-Type": "application/json" };
  if (WEBHOOK_SECRET) {
    headers["x-telegram-bot-api-secret-token"] = WEBHOOK_SECRET;
  }

  await axios.post(`${CRM_URL}/api/telegram/webhook`, payload, { headers });
  return true;
}

function getUserName(ctx) {
  const from = ctx.from;
  return (
    [from?.first_name, from?.last_name].filter(Boolean).join(" ") ||
    from?.username ||
    "Пользователь Telegram"
  );
}

async function processIncomingMessage(ctx, textOverride) {
  const text =
    textOverride ??
    ctx.message?.text ??
    (ctx.message?.contact ? "Контакт передан" : "");

  const analysis = analyzeMessage(text);
  const userName = getUserName(ctx);

  await sendLeadToCrm(ctx);

  const tagsLine =
    analysis.tags.length > 0 ? analysis.tags.join(", ") : "нет";

  await notifyAdmin(
    [
      "🆕 <b>Новая заявка</b>",
      "",
      `👤 <b>Клиент:</b> ${escapeHtml(userName)}`,
      `🆔 <b>ID:</b> ${ctx.from?.id ?? "—"}`,
      `📝 <b>Текст:</b> ${escapeHtml(analysis.summary)}`,
      `🧠 <b>Настроение:</b> ${analysis.sentiment}`,
      `🏷 <b>Теги:</b> ${escapeHtml(tagsLine)}`,
    ].join("\n")
  );

  return analysis;
}

// ===== КОМАНДЫ БОТА =====

bot.start((ctx) => {
  ctx.reply(
    [
      "✅ Привет! Я CRM-бот.",
      "",
      "👤 Вы можете:",
      "• Оставить заявку",
      "• Поделиться контактом",
      "",
      "💼 Менеджеры могут использовать:",
      "/clients — список клиентов",
      "/search <тел> — поиск клиента",
    ].join("\n"),
    Markup.keyboard([
      Markup.button.contactRequest("📱 Поделиться телефоном"),
    ]).resize()
  );
});

bot.help((ctx) => {
  ctx.reply(
    [
      "Команды:",
      "/start — начать",
      "/help — справка",
      "/myid — узнать свой Telegram ID",
      "/clients — последние клиенты (только админ)",
      "/search +79991234567 — поиск по телефону (только админ)",
    ].join("\n")
  );
});

bot.command("myid", (ctx) => {
  ctx.reply(`🆔 Ваш Telegram ID: <code>${ctx.from.id}</code>`, {
    parse_mode: "HTML",
  });
});

bot.command("clients", async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.reply("⛔ Команда доступна только администратору.");
  }

  try {
    const data = await fetchCrmClients(10);
    await ctx.reply(`📋 <b>Последние клиенты</b> (всего: ${data.total})\n\n${formatClientList(data.clients)}`, {
      parse_mode: "HTML",
    });
  } catch (e) {
    console.error("[bot] clients error:", e.message);
    await ctx.reply("❌ Не удалось получить список клиентов. Проверьте CRM_API_URL и CRM_WEBHOOK_SECRET.");
  }
});

bot.command("search", async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.reply("⛔ Команда доступна только администратору.");
  }

  const query = ctx.message.text.split(" ").slice(1).join(" ").trim();
  if (!query) {
    return ctx.reply(
      "❌ Введите номер телефона или имя после команды.\nПример: /search +79991234567"
    );
  }

  try {
    const data = await searchCrm(query);
    await ctx.reply(formatSearchResults(data.results, query), { parse_mode: "HTML" });
  } catch (e) {
    console.error("[bot] search error:", e.message);
    await ctx.reply("❌ Ошибка поиска. Проверьте CRM_API_URL и CRM_WEBHOOK_SECRET.");
  }
});

// ===== ОБРАБОТКА СООБЩЕНИЙ =====

bot.on("contact", async (ctx) => {
  try {
    await processIncomingMessage(ctx, "Контакт передан");
    await ctx.reply(
      "✅ Спасибо! Ваш контакт принят. Мы скоро свяжемся с вами.",
      Markup.removeKeyboard()
    );
  } catch (e) {
    console.error("[bot] contact error:", e.message);
    await ctx.reply("⚠️ Не удалось сохранить заявку. Попробуйте позже.");
  }
});

bot.on("text", async (ctx) => {
  const text = ctx.message.text?.trim();
  if (!text || text.startsWith("/")) return;

  try {
    await processIncomingMessage(ctx, text);
    await ctx.reply(
      "✅ Заявка принята! Менеджер свяжется с вами в ближайшее время."
    );
  } catch (e) {
    console.error("[bot] text error:", e.message);
    await ctx.reply("⚠️ Не удалось сохранить заявку. Попробуйте позже.");
  }
});

bot.catch((err, ctx) => {
  console.error("[bot] unhandled:", err);
  ctx.reply("⚠️ Произошла ошибка. Попробуйте ещё раз.").catch(() => {});
});

// ===== ЗАПУСК (WEBHOOK / POLLING) =====

const webhookPath = `/webhook/${BOT_TOKEN}`;

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "crm-bot", uptime: process.uptime() });
});

function startProductionServer() {
  app.use(bot.webhookCallback(webhookPath));

  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(
      `🌐 Domain: ${process.env.RENDER_EXTERNAL_URL || "http://localhost:" + port}`
    );

    if (process.env.RENDER_EXTERNAL_URL && BOT_TOKEN) {
      const webhookUrl = `${process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "")}${webhookPath}`;
      bot.telegram
        .setWebhook(webhookUrl)
        .then(() => console.log("✅ Webhook set to:", webhookUrl))
        .catch((err) => console.error("❌ Webhook error:", err));
    } else if (process.env.PUBLIC_URL && BOT_TOKEN) {
      const webhookUrl = `${process.env.PUBLIC_URL.replace(/\/$/, "")}${webhookPath}`;
      bot.telegram
        .setWebhook(webhookUrl)
        .then(() => console.log("✅ Webhook set to:", webhookUrl))
        .catch((err) => console.error("❌ Webhook error:", err));
    } else {
      console.log("ℹ️ Running in local mode or missing env vars");
    }

    console.log(`Health check: http://0.0.0.0:${port}/health`);
  });
}

async function startPolling() {
  await bot.launch();
  console.log("Polling mode started (local development)");
}

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

if (IS_RENDER || process.env.USE_WEBHOOK === "true") {
  startProductionServer();
} else {
  startPolling().catch((error) => {
    console.error("Failed to start polling:", error);
    process.exit(1);
  });
}
