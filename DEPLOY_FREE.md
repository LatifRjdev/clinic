# Бесплатный деплой для демонстрации клиенту

Пошаговая инструкция по развёртыванию Clinic MIS на бесплатных сервисах для демонстрации. Итоговая стоимость: **0 сомони**.

---

## Архитектура

```
┌──────────────────┐         ┌──────────────────┐
│  Пользователь    │────────▶│     Vercel       │  (Frontend, React)
│  (браузер)       │         │  *.vercel.app    │
└──────────────────┘         └────────┬─────────┘
                                      │ API calls
                                      ▼
                             ┌──────────────────┐
                             │   Render.com     │  (Backend, NestJS)
                             │  *.onrender.com  │
                             └────┬──────┬──────┘
                                  │      │
                         ┌────────┘      └──────────┐
                         ▼                          ▼
                  ┌─────────────┐           ┌─────────────┐
                  │    Neon     │           │   Upstash   │
                  │ PostgreSQL  │           │    Redis    │
                  └─────────────┘           └─────────────┘
```

| Сервис | Назначение | Бесплатный лимит |
|--------|-----------|------------------|
| **Vercel** | Frontend (React) | Безлимитный трафик, автодеплой из GitHub |
| **Render.com** | Backend (NestJS + WebSocket) | 750 часов/месяц, 512 MB RAM |
| **Neon.tech** | PostgreSQL | 0.5 GB, serverless |
| **Upstash** | Redis | 10 000 команд/день, 256 MB |
| — | Хранилище файлов | Пропускаем для демо (не нужно) |
| **UptimeRobot** | Защита от засыпания Render | Бесплатно, ping каждые 5 мин |

---

## Подготовка

### 1. Создай репозиторий на GitHub

```bash
cd /Users/latifrjdev/Desktop/clinic
git init
git add .
git commit -m "Initial commit"
```

Создай приватный репозиторий на github.com, затем:

```bash
git remote add origin https://github.com/YOUR_USERNAME/clinic-mis.git
git branch -M main
git push -u origin main
```

### 2. Зарегистрируйся на сервисах

Создай аккаунты (все позволяют вход через GitHub):
- https://vercel.com
- https://render.com
- https://neon.tech
- https://upstash.com
- https://uptimerobot.com

---

## Шаг 1. База данных — Neon (PostgreSQL)

1. Зайди на https://console.neon.tech
2. Нажми **Create Project**
3. Заполни:
   - **Project name:** `clinic-mis`
   - **PostgreSQL version:** 16
   - **Region:** ближайший (Frankfurt или Singapore)
4. Нажми **Create Project**

5. После создания скопируй **Connection string** — она выглядит так:
   ```
   postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

6. Сохрани это в блокноте — будет нужно дальше.

**Важно:** Neon автоматически ставит базу в режим "sleep" при простое, но просыпается за 1-2 секунды.

---

## Шаг 2. Redis — Upstash

1. Зайди на https://console.upstash.com
2. Нажми **Create Database**
3. Заполни:
   - **Name:** `clinic-redis`
   - **Type:** Regional
   - **Region:** ближайший (eu-west-1 или ap-southeast-1)
   - **TLS:** включи
4. Нажми **Create**

5. На странице базы найди раздел **REST API** или **Connect to your database**
6. Скопируй:
   - **Endpoint** (например: `eu1-xxx.upstash.io`)
   - **Port** (обычно 6379 или 6380)
   - **Password**

7. Построй строку подключения:
   ```
   rediss://default:YOUR_PASSWORD@eu1-xxx.upstash.io:6380
   ```

---

## Шаг 3. Хранилище файлов — ПРОПУСКАЕМ для демо

Для демонстрации хранилище файлов **не нужно**. Система работает полностью без него — просто не будут работать загрузка фото пациентов и прикрепление документов. Все остальные функции (запись, ЭМК, касса, финансы, аналитика, чат) работают.

**Не добавляй** переменные `S3_*` в Render — backend автоматически пропустит подключение к хранилищу.

Когда клиент утвердит проект и перейдёт на production-сервер — хранилище будет через встроенный MinIO в Docker (см. DEPLOY_PRODUCTION.md).

---

## Шаг 4. Backend — Render.com

### 4.1. Создание Web Service

1. Зайди на https://dashboard.render.com
2. Нажми **New → Web Service**
3. Подключи GitHub и выбери репозиторий `clinic-mis`
4. Заполни:
   - **Name:** `clinic-backend`
   - **Region:** Frankfurt (EU Central)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm ci --include=dev && npm run build`
   - **Start Command:** `node dist/main.js`
   - **Instance Type:** **Free**

### 4.2. Environment Variables

Нажми **Advanced** → **Add Environment Variable** и добавь:

```
NODE_ENV=production
APP_PORT=3000
APP_ENV=production

# База данных (из Шага 1) — одна строка из Neon dashboard
DATABASE_URL=postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
DB_SSL=true

# Redis (из Шага 2)
REDIS_HOST=eu1-xxx.upstash.io
REDIS_PORT=6380
REDIS_PASSWORD=password_from_upstash
REDIS_TLS=true

# JWT секреты — сгенерируй командой: openssl rand -hex 32
JWT_SECRET=сгенерируй_32_байта_в_hex
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=сгенерируй_ещё_32_байта_в_hex
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (добавишь после Шага 5)
FRONTEND_URL=https://clinic-frontend.vercel.app

# Хранилище файлов — пропускаем для демо (фото и документы не будут загружаться)
# S3_ENDPOINT, S3_ACCESS_KEY и т.д. — НЕ нужны для демо
```

### 4.3. Заполнение БД тестовыми данными (seed)

На бесплатном плане Render Shell недоступен, поэтому seed запускаем через Build Command.

**При первом деплое** временно измени Build Command:

```
npm ci --include=dev && npm run build && node dist/seeds/seed.js
```

После успешного деплоя (когда в логах увидишь `Seed completed!`) **верни обратно**:

```
npm ci --include=dev && npm run build
```

Это нужно чтобы seed не запускался при каждом деплое и не затирал данные.

**Альтернатива:** запусти seed локально со своего компьютера, указав Neon DATABASE_URL:

```bash
cd backend
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" DB_SSL=true npm run seed
```

### 4.4. Деплой

1. Нажми **Create Web Service**
2. Render начнёт сборку — это займёт 5-10 минут
3. Когда статус станет **Live**, скопируй URL: `https://clinic-backend.onrender.com`

### 4.5. Проверка

Открой в браузере:
```
https://clinic-backend.onrender.com/api/health
```

Должно вернуть `{"status":"ok"}`

---

## Шаг 5. Frontend — Vercel

### 5.1. Создание проекта

1. Зайди на https://vercel.com/new
2. Выбери репозиторий `clinic-mis`
3. Настрой:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`

### 5.2. Environment Variables

Добавь переменные:

```
VITE_API_URL=https://clinic-backend.onrender.com/api
VITE_SOCKET_URL=https://clinic-backend.onrender.com
```

### 5.3. Deploy

1. Нажми **Deploy**
2. Подожди 2-3 минуты
3. Когда готово — скопируй URL: `https://clinic-frontend.vercel.app`

### 5.4. Обнови Backend

Вернись в Render → **clinic-backend** → **Environment** → обнови:
```
FRONTEND_URL=https://clinic-frontend.vercel.app
```

И добавь также (для CORS):
```
CORS_ORIGIN=https://clinic-frontend.vercel.app
```

Сервис автоматически перезапустится.

---

## Шаг 6. Защита от засыпания — UptimeRobot

Render на бесплатном плане засыпает после 15 минут простоя. Чтобы этого избежать:

1. Зайди на https://uptimerobot.com
2. Зарегистрируйся (бесплатно)
3. Нажми **+ Add New Monitor**
4. Настрой:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Clinic Backend
   - **URL:** `https://clinic-backend.onrender.com/api/health`
   - **Monitoring Interval:** 5 минут
5. Нажми **Create Monitor**

Теперь UptimeRobot будет пинговать backend каждые 5 минут — он не будет засыпать.

---

## Шаг 7. Проверка работы

Открой `https://clinic-frontend.vercel.app`

### Тестовые учётные записи (после seed)

| Роль | Email | Пароль |
|------|-------|--------|
| Владелец | `owner@clinic.tj` | `Password123` |
| Главный врач | `chief@clinic.tj` | `Password123` |
| Врач | `doctor1@clinic.tj` | `Password123` |
| Медсестра | `nurse1@clinic.tj` | `Password123` |
| Рецепшен | `reception1@clinic.tj` | `Password123` |
| Бухгалтер | `accountant@clinic.tj` | `Password123` |
| Системный админ | `sysadmin@clinic.tj` | `Password123` |

**Уточни пароли в** `backend/src/seeds/seed.ts`

---

## Автоматический деплой

После первоначальной настройки:
- **Любой `git push` в ветку `main`** автоматически деплоит frontend (Vercel) и backend (Render)
- Изменения появятся на сайте через 3-5 минут

```bash
git add .
git commit -m "обновление"
git push
```

---

## Ограничения бесплатного варианта

| Ограничение | Что это значит |
|-------------|----------------|
| **Render засыпает** | Первый запрос после 15 мин простоя — 30-50 секунд (решается UptimeRobot) |
| **Neon 0.5 GB** | ~10 000-50 000 записей пациентов с историей |
| **Upstash 10k команд/день** | Достаточно для 5-20 активных пользователей |
| **Нет хранилища файлов** | Фото и документы не загружаются — всё остальное работает |
| **Нет SMS/Email** | Нужны отдельные API-ключи (Twilio, SendGrid) |
| **Нет резервных копий** | Neon делает авто-snapshots, но лучше подключить свои |

---

## Что делать если что-то не работает

### Backend не запускается
1. Открой **Render → clinic-backend → Logs**
2. Проверь ошибки подключения к БД и Redis
3. Убедись, что все environment variables заполнены

### Frontend показывает "Network Error"
1. Проверь в DevTools → Network, на какой URL идут запросы
2. Убедись, что `VITE_API_URL` указывает на правильный backend
3. Проверь CORS: в backend должен быть разрешён домен frontend

### База данных пустая
1. В Render открой **Shell**
2. Запусти: `npm run seed`

### WebSocket (чат) не работает
1. Проверь, что `VITE_SOCKET_URL` без `/api` в конце
2. Убедись, что backend поддерживает WSS (у Render по умолчанию да)

### Render сервис выключился
Бесплатный план даёт 750 часов/месяц = ~25 дней непрерывной работы. Если сервис простаивает, но UptimeRobot пингует его 24/7 — ты израсходуешь лимит.

**Решение:** настрой UptimeRobot только в рабочие часы (9:00-20:00) через advanced settings, либо апгрейдь до Starter ($7/мес).

---

## Стоимость

| Компонент | Стоимость |
|-----------|-----------|
| Vercel (Frontend) | **0 сомони** |
| Render (Backend) | **0 сомони** |
| Neon (PostgreSQL) | **0 сомони** |
| Upstash (Redis) | **0 сомони** |
| UptimeRobot | **0 сомони** |
| **ИТОГО** | **0 сомони/месяц** |

Подходит для:
- Демонстрации клиенту
- Тестирования
- Разработки
- Небольшой клиники (до 5 пользователей, до 1000 пациентов)

**Не подходит для:**
- Production в реальной клинике с медданными
- Нагрузки >10 одновременных пользователей
- Соответствия закону о персональных данных РТ

Для production смотри файл **DEPLOY_PRODUCTION.md**
