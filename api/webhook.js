// api/webhook.js — для Vercel serverless
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('No BOT_TOKEN set');
}

const bot = new Telegraf(BOT_TOKEN);

// helper to read catalog (same catalog.json in repo root)
function getCatalog(){
  try {
    const p = path.join(process.cwd(),'catalog.json');
    const raw = fs.readFileSync(p,'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { meta:{name:'FastEats'}, items:[] };
  }
}

// Minimal handlers (start/menu/order)
bot.start((ctx) => {
  const catalog = getCatalog();
  ctx.reply(Привет! Это ${catalog.meta.name}. Команды: /menu /order);
});

bot.command('menu', (ctx) => {
  const catalog = getCatalog();
  const lines = catalog.items.map(i=>${i.name} — $${i.price}\n${i.desc}).join('\n\n') || 'Меню пусто';
  ctx.reply(lines);
});

bot.command('order', (ctx) => {
  const webAppUrl = process.env.WEBAPP_URL || ${process.env.VERCEL_URL ? 'https://'+process.env.VERCEL_URL : ''};
  if (!webAppUrl) return ctx.reply('Оформление пока недоступно (админ не указал WEBAPP_URL)');
  return ctx.reply('Открыть оформление:', {
    reply_markup: {
      inline_keyboard: [[{ text: 'Оформить заказ', web_app: { url: webAppUrl } }]]
    }
  });
});

// Vercel handler
module.exports = async (req, res) => {
  if (req.method === 'GET') return res.status(200).send('OK');
  try {
    await bot.handleUpdate(req.body, res);
    return res.status(200).send('OK');
  } catch (e) {
    console.error('Webhook handler error', e);
    return res.status(500).send('err');
  }
}
