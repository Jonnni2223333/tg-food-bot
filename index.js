// index.js — рабочая версия для простого запуска (без ошибок синтаксиса)
const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN || ''; // если пустой — бот не будет запускаться
const bot = new Telegraf(BOT_TOKEN);

// helper: читаем catalog.json
function getCatalog(){
  try {
    const p = path.join(__dirname, 'catalog.json');
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { meta: { name: 'FastEats', logoUrl: '' }, items: [] };
  }
}

// /start
bot.start(async (ctx) => {
  const catalog = getCatalog();
  const name = (catalog.meta && catalog.meta.name) || 'FastEats';
  // используем шаблонные строки (backticks) — правильно
  try {
    if (catalog.meta && catalog.meta.logoUrl) {
      await ctx.replyWithPhoto(catalog.meta.logoUrl, {
        caption: Привет! Это ${name}. Команды:\n/menu — меню\n/order — оформление
      });
      return;
    }
  } catch (e) {
    console.error('replyWithPhoto error:', e);
    // если не получилось фото — отправим текст
  }
  await ctx.reply(Привет! Это ${name}. Команды:\n/menu — меню\n/order — оформление);
});

// /menu
bot.command('menu', (ctx) => {
  const catalog = getCatalog();
  if (!catalog.items || catalog.items.length === 0) return ctx.reply('Меню пусто');
  const text = catalog.items.map(i => ${i.name} — $${i.price}\n${i.desc || ''}).join('\n\n');
  return ctx.reply(text);
});

// /order
bot.command('order', (ctx) => {
  const webAppUrl = process.env.WEBAPP_URL || (process.env.VERCEL_URL ? https://${process.env.VERCEL_URL} : '');
  if (!webAppUrl) return ctx.reply('Оформление временно недоступно (админ не указал WEBAPP_URL).');
  return ctx.reply('Открыть оформление:', Markup.inlineKeyboard([
    Markup.button.webApp('Оформить заказ', webAppUrl)
  ]));
});

// express static (если ты используешь этот файл для long-run сервера)
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => res.send('ok'));

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log('HTTP server on port', PORT);
  if (BOT_TOKEN) {
    try {
      await bot.launch();
      console.log('Bot launched (polling)');
    } catch (e) {
      console.error('bot.launch error', e);
    }
  } else {
    console.warn('BOT_TOKEN not set — bot not launched');
  }
});
