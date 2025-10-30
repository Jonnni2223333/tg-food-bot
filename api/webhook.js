// api/webhook.js
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('Missing BOT_TOKEN env var');
}

// create bot instance
const bot = new Telegraf(BOT_TOKEN);

// helper to read catalog.json from repo root
function getCatalog(){
  try {
    const p = path.join(process.cwd(), 'catalog.json');
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { meta: { name: 'FastEats' }, items: [] };
  }
}

// basic commands
bot.start((ctx) => {
  const catalog = getCatalog();
  const name = (catalog.meta && catalog.meta.name) || 'FastEats';
  return ctx.reply(Привет! Это ${name}. Команды: /menu /order);
});

bot.command('menu', (ctx) => {
  const catalog = getCatalog();
  if (!catalog.items || catalog.items.length === 0) return ctx.reply('Меню пусто');
  const text = catalog.items.map(i => ${i.name} — $${i.price}\n${i.desc || ''}).join('\n\n');
  return ctx.reply(text);
});

bot.command('order', (ctx) => {
  const webAppUrl = process.env.WEBAPP_URL || (process.env.VERCEL_URL ? https://${process.env.VERCEL_URL} : '');
  if (!webAppUrl) return ctx.reply('Оформление временно недоступно (админ не указал WEBAPP_URL).');
  return ctx.reply('Открыть оформление:', {
    reply_markup: {
      inline_keyboard: [[{ text: 'Оформить заказ', web_app: { url: webAppUrl } }]]
    }
  });
});

// Vercel handler
module.exports = async (req, res) => {
  if (req.method === 'GET') return res.status(200).send('OK'); // health check
  try {
    await bot.handleUpdate(req.body);
    return res.status(200).send('OK');
  } catch (err) {
    console.error('Error handling update', err);
    return res.status(500).send('error');
  }
};

