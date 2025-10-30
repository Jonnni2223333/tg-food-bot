# tg-food-bot (Vercel-ready)

Файлы:
- api/webhook.js — serverless webhook для Telegram (Vercel)
- catalog.json — каталог товаров (редактировать для кастомизации)
- public/index.html — фронтенд (каталог)

Деплой:
1. Подключить репозиторий к Vercel (Deploy from GitHub).
2. В Vercel → Project → Settings → Environment Variables добавить:
   - Key: BOT_TOKEN  Value: (токен от BotFather)
   - Key: WEBAPP_URL Value: https://<project>.vercel.app/ (заменить на фактический домен)
3. Redeploy проект.
4. Установить webhook:
   https://api.telegram.org/bot<ТВОЙ_ТОКЕН>/setWebhook?url=https://<project>.vercel.app/api/webhook
5. Тест: в Telegram напиши боту /start, /menu, /order.
