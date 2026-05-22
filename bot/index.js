require("dotenv").config();

const express = require("express");
const { Telegraf, Markup } = require("telegraf");
const { sendLeadToCrm, buildUpdateFromMessage } = require("./crm");

const BOT_TOKEN = process.env.BOT_TOKEN?.trim();
const PORT = Number(process.env.PORT || 8080);
const USE_WEBHOOK =
  process.env.RENDER === "true" ||
  process.env.RENDER_EXTERNAL_URL ||
  process.env.USE_WEBHOOK === "true";

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is required");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

async function forwardToCrm(ctx) {
  const update = buildUpdateFromMessage(ctx);
  if (!update?.message?.text && !update?.message?.contact) {
    return false;
  }

  await sendLeadToCrm(update);
  return true;
}

bot.start(async (ctx) => {
  await ctx.reply(
    [
      "👋 Добро пожаловать в Smart CRM!",
      "",
      "Оставьте заявку — менеджер свяжется с вами.",
      "",
      "• Напишите сообщение с вашим вопросом",
      "• Или нажмите «Поделиться телефоном»",
    ].join("\n"),
    Markup.keyboard([
      Markup.button.contactRequest("📱 Поделиться телефоном"),
    ]).resize()
  );
});

bot.help(async (ctx) => {
  await ctx.reply(
    [
      "Команды:",
      "/start — начать заново",
      "/help — эта справка",
      "",
      "Просто отправьте текст или контакт — заявка попадёт в CRM.",
    ].join("\n")
  );
});

bot.on("contact", async (ctx) => {
  try {
    await forwardToCrm(ctx);
    await ctx.reply(
      "✅ Спасибо! Ваш контакт принят. Мы скоро свяжемся с вами.",
      Markup.removeKeyboard()
    );
  } catch (error) {
    console.error("[bot] contact error:", error);
    await ctx.reply("⚠️ Не удалось сохранить заявку. Попробуйте позже.");
  }
});

bot.on("text", async (ctx) => {
  const text = ctx.message.text?.trim();
  if (!text || text.startsWith("/")) return;

  try {
    await forwardToCrm(ctx);
    await ctx.reply("✅ Заявка принята! Менеджер свяжется с вами в ближайшее время.");
  } catch (error) {
    console.error("[bot] text error:", error);
    await ctx.reply("⚠️ Не удалось сохранить заявку. Попробуйте позже.");
  }
});

bot.catch((error, ctx) => {
  console.error("[bot] unhandled:", error);
  ctx.reply("⚠️ Произошла ошибка. Попробуйте ещё раз.").catch(() => {});
});

async function startWebhook() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "crm-telegram-bot" });
  });

  app.use(bot.webhookCallback("/webhook"));

  const publicUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.PUBLIC_URL ||
    `http://localhost:${PORT}`;

  app.listen(PORT, async () => {
    const webhookUrl = `${publicUrl.replace(/\/$/, "")}/webhook`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`Webhook mode: ${webhookUrl}`);
    console.log(`Health check: ${publicUrl}/health`);
  });
}

async function startPolling() {
  await bot.launch();
  console.log("Polling mode started (local development)");
}

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

if (USE_WEBHOOK) {
  startWebhook().catch((error) => {
    console.error("Failed to start webhook server:", error);
    process.exit(1);
  });
} else {
  startPolling().catch((error) => {
    console.error("Failed to start polling:", error);
    process.exit(1);
  });
}
