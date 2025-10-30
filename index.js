const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('ERROR: set BOT_TOKEN env var');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// helper to read catalog
function getCatalog(){
  const p = path.join(__dirname,'catalog.json');
  const raw = fs.readFileSync(p,'utf8');
  return JSON.parse(raw);
}

// /start
bot.start(async (ctx) => {
  const catalog = getCatalog();
  const name = (catalog.meta && catalog.meta.name) || 'FastEats';
  try {
    if (catalog.meta && catalog.meta.logoUrl) {
      await ctx.replyWithPhoto(catalog.meta.logoUrl, {
        caption: Привет! Это ${name}. Команды:\n/menu — меню\n/order — оформление
      });
      return;
    }
  } catch (e) {
    console.error('replyWithPhoto failed', e);
  }
  await ctx.reply(Привет! Это ${name}. Команды:\n/menu — меню\n/order — оформление);
});

// /menu - текст
bot.command('menu', (ctx) => {
  const catalog = getCatalog();
  const lines = catalog.items.map(i=>${i.name} — $${i.price}\n${i.desc}).join('\n\n');
  return ctx.reply(lines);
});

// /order - открывает веб-приложение (web app)
bot.command('order', async (ctx) => {
  const webAppUrl = process.env.WEBAPP_URL  (process.env.RAILWAY_STATIC_URL  '');
  // если WEBAPP_URL не задан — пробуем относительный путь
  const url = webAppUrl || ${process.env.PROJECT_URL || ''};
  // создаём кнопку Web App — если url пустой, даём простой текст
  if (!url) {
    return ctx.reply('Оформление доступно по ссылке на сайт (админ пока не указал WEBAPP_URL).');
  }
  return ctx.reply('Открыть оформление:', Markup.inlineKeyboard([
    Markup.button.webApp('Оформить заказ', url)
  ]));
});

// Admin command to update meta quickly (only admin id)
bot.command('setmeta', async (ctx) => {
  const adminId = process.env.ADMIN_ID;
  if (adminId && String(ctx.from.id) !== String(adminId)) return ctx.reply('Нет доступа');
  const args = ctx.message.text.split(' ').slice(1).join(' ');
  if (!args) return ctx.reply('Использование: /setmeta {"name":"...","logoUrl":"...","themeColor":"#..."}');
  try {
    const p = path.join(__dirname,'catalog.json');
    const data = JSON.parse(fs.readFileSync(p,'utf8'));
    const metaUpdate = JSON.parse(args);
    data.meta = {...data.meta, ...metaUpdate};
    fs.writeFileSync(p, JSON.stringify(data,null,2));
    return ctx.reply('Meta обновлена');
  } catch (e) {
    return ctx.reply('Ошибка: ' + e.message);
  }
});

// express app serves static front (public/)
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

// health
app.get('/health', (req,res)=>res.send('ok'));

// optional webhook endpoint (if later you set webhook)
app.post('/webhook', (req,res)=>{
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> {
  console.log('HTTP server on', PORT);
  bot.launch().then(()=>console.log('Bot launched'));
});
