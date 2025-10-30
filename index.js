const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const bot = new Telegraf(BOT_TOKEN);

// читаем каталог
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
  const name = (catalog.meta && catalog.meta.name) ? catalog.meta.name : 'FastEats';

  // сначала пробуем отправить фото с подписью
  try {
    if (catalog.meta && catalog.meta.logoUrl) {
      await ctx.replyWithPhoto(catalog.meta.logoUrl, {
        caption: 'Привет! Это ' + name + '. Команды:\\n/menu — меню\\n/order — оформление'
      });
      return;
    }
  } catch (err) {
    console.error('replyWithPhoto failed:', err);
  }

  // если фото не отправилось — отправляем текст
  await ctx.reply('Привет! Это ' + name + '. Команды:\n/menu — меню\n/order — оформление');
});

// /menu
bot.command('menu', (ctx) => {
  const catalog = getCatalog();
  if (!catalog.items || catalog.items.length === 0) return ctx.reply('Меню пусто');
  const text = catalog.items.map(function(i){
    return i.name + ' — $' + i.price + '\n' + (i.desc || '');
  }).join('\n\n');
  return ctx.reply(text);
});

// /order
bot.command('order', (ctx) => {
  const webAppUrl = process.env.WEBAPP_URL || (process.env.VERCEL_URL ? ('https://' + process.env.VERCEL_URL) : '');
  if (!webAppUrl) return ctx.reply('Оформление временно недоступно (админ не указал WEBAPP_URL).');
  return ctx.reply('Открыть оформление:', Markup.inlineKeyboard([
    Markup.button.webApp('Оформить заказ', webAppUrl)
  ]));
});

// static / express (если нужен)
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', function(req, res){ res.send('ok'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, async function(){
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
