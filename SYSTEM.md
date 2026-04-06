# Clinic MIS — Полная спецификация системы

> Медицинская информационная система для управления многопрофильной клиникой.

---

## 1. Обзор системы

### 1.1 Назначение
Единая платформа для управления всеми процессами клиники: запись пациентов, ведение ЭМК, расписание врачей, биллинг, аналитика, коммуникации, ДМС-расчёты, складской учёт.

### 1.2 Технологический стек

| Слой | Технология |
|------|-----------|
| Frontend | React 19, TypeScript 5.9, Vite, Ant Design 6 |
| State | Zustand (auth), TanStack React Query (server state) |
| Backend | NestJS 11, TypeScript 5.7, TypeORM 0.3 |
| База данных | PostgreSQL 16 |
| Кэш / Очереди | Redis 7 |
| Файловое хранилище | MinIO (S3-compatible) |
| Real-time | Socket.io (WebSocket) |
| Авторизация | JWT (access + refresh tokens), Passport.js |
| i18n | i18next (RU / UZ) |
| Контейнеризация | Docker Compose |

### 1.3 Архитектура
- **Модульный монолит** — каждый домен в отдельном NestJS-модуле
- **REST API** — основной протокол взаимодействия
- **WebSocket** — чат, уведомления, обновления в реальном времени
- **Soft delete** — все сущности используют мягкое удаление
- **UUID** — первичные ключи всех таблиц
- **Мультитенантность** — поддержка нескольких филиалов

---

## 2. Роли и права доступа

### 2.1 Роли системы

| Роль | Enum | Описание |
|------|------|----------|
| Владелец клиники | `owner` | Полный доступ ко всему. Финансы, аналитика, настройки |
| Главный врач | `chief_doctor` | Медицинское управление, протоколы, контроль качества |
| Врач | `doctor` | Приём пациентов, ЭМК, назначения, рецепты |
| Медсестра | `nurse` | Процедуры, витальные показатели, помощь врачу |
| Рецепшен | `admin` | Запись, регистрация пациентов, очередь, касса |
| Бухгалтер | `accountant` | Финансы, зарплаты, ДМС, налоги, отчёты |
| Сисадмин | `sysadmin` | Пользователи, роли, интеграции, бэкапы, логи |
| Пациент | `patient` | Личный кабинет, запись онлайн, результаты, чат |

### 2.2 Матрица прав доступа

```
Модуль                 | Owner | ChiefDoc | Doctor | Nurse | Admin | Account | Sysadm | Patient
-----------------------|-------|----------|--------|-------|-------|---------|--------|--------
Дашборд (свой)         |  ✓    |    ✓     |   ✓    |   ✓   |   ✓   |    ✓    |   ✓    |   ✓
Пациенты — список      |  ✓    |    ✓     |   ✓    |   ✓   |   ✓   |    —    |   —    |   —
Пациенты — создание    |  ✓    |    ✓     |   ✓    |   —   |   ✓   |    —    |   —    |   —
Пациенты — ЭМК         |  R    |    RW    |   RW   |   R   |   —   |    —    |   —    |   R*
Расписание — просмотр  |  ✓    |    ✓     |   ✓    |   ✓   |   ✓   |    —    |   —    |   ✓*
Расписание — управление|  ✓    |    ✓     |   —    |   —   |   ✓   |    —    |   —    |   —
Приёмы — ведение       |  —    |    ✓     |   ✓    |   ✓   |   —   |    —    |   —    |   —
Биллинг — услуги       |  ✓    |    R     |   R    |   —   |   ✓   |    ✓    |   —    |   —
Биллинг — счета        |  ✓    |    —     |   R    |   —   |   ✓   |    ✓    |   —    |   R*
Биллинг — касса        |  ✓    |    —     |   —    |   —   |   ✓   |    ✓    |   —    |   —
Финансы — отчёты       |  ✓    |    —     |   —    |   —   |   —   |    ✓    |   —    |   —
Финансы — зарплаты     |  ✓    |    —     |   —    |   —   |   —   |    ✓    |   —    |   —
Финансы — ДМС          |  ✓    |    R     |   —    |   —   |   —   |    ✓    |   —    |   —
Персонал               |  ✓    |    R     |   —    |   —   |   —   |    R    |   ✓    |   —
Филиалы                |  ✓    |    R     |   —    |   —   |   —   |    —    |   ✓    |   —
Отделения              |  ✓    |    ✓     |   R    |   R   |   R   |    —    |   ✓    |   —
Аналитика              |  ✓    |    ✓     |   R*   |   —   |   R   |    ✓    |   —    |   —
Документы — шаблоны    |  ✓    |    ✓     |   ✓    |   R   |   ✓   |    —    |   —    |   —
Чат                    |  ✓    |    ✓     |   ✓    |   ✓   |   ✓   |    ✓    |   ✓    |   ✓*
Задачи                 |  ✓    |    ✓     |   ✓    |   ✓   |   ✓   |    ✓    |   ✓    |   —
Уведомления            |  ✓    |    ✓     |   ✓    |   ✓   |   ✓   |    ✓    |   ✓    |   ✓
Настройки системы      |  ✓    |    —     |   —    |   —   |   —   |    —    |   ✓    |   —
Пользователи           |  ✓    |    —     |   —    |   —   |   —   |    —    |   ✓    |   —
Роли и права           |  ✓    |    —     |   —    |   —   |   —   |    —    |   ✓    |   —
Интеграции             |  ✓    |    —     |   —    |   —   |   —   |    —    |   ✓    |   —
Бэкапы                 |  —    |    —     |   —    |   —   |   —   |    —    |   ✓    |   —
Логи системные         |  R    |    —     |   —    |   —   |   —   |    —    |   ✓    |   —
Аудит                  |  ✓    |    R     |   —    |   —   |   —   |    —    |   ✓    |   —
Маркетинг              |  ✓    |    —     |   —    |   —   |   R   |    —    |   —    |   —
Склад / расходники     |  ✓    |    R     |   R    |   ✓   |   —   |    ✓    |   —    |   —
```

*R = только чтение, R* = только свои данные, ✓* = ограниченный доступ*

---

## 3. Модули системы

### 3.1 Аутентификация и авторизация (`auth`)

**Функции:**
- Вход по логину/email + пароль
- Двухфакторная аутентификация (SMS, Email, Authenticator)
- JWT-токены (access 15 мин + refresh 30 дней)
- Восстановление пароля (4 шага: запрос → код → новый пароль → готово)
- Приглашение сотрудника (ссылка → первый вход → установка пароля)
- Выбор филиала/кабинета при входе
- Онбординг при первом запуске (настройка клиники)
- Блокировка после N неудачных попыток
- Запомнить меня (30 дней)
- Переключение языка (RU / UZ)

**API:**
```
POST   /api/auth/login              — Вход в систему
POST   /api/auth/register           — Регистрация (первоначальная)
POST   /api/auth/refresh            — Обновление токена
POST   /api/auth/logout             — Выход
POST   /api/auth/forgot-password    — Запрос восстановления
POST   /api/auth/verify-code        — Проверка кода 2FA/восстановления
POST   /api/auth/reset-password     — Установка нового пароля
POST   /api/auth/invite             — Приглашение сотрудника
POST   /api/auth/accept-invite/:token — Принятие приглашения
GET    /api/auth/profile            — Текущий пользователь
PATCH  /api/auth/profile            — Обновление профиля
POST   /api/auth/change-password    — Смена пароля
POST   /api/auth/2fa/enable         — Включение 2FA
POST   /api/auth/2fa/verify         — Верификация 2FA-кода
POST   /api/auth/select-branch      — Выбор филиала
```

---

### 3.2 Пациенты (`patients`)

**Функции:**
- Регистрация пациента (ФИО, дата рождения, пол, контакты, паспорт, ДМС-полис)
- Поиск пациента (по ФИО, телефону, ID, паспорту)
- Карточка пациента (анкета, история посещений, ЭМК, документы, счета)
- Теги и группы пациентов
- Согласие на обработку данных
- Загрузка фото
- Импорт/экспорт базы пациентов
- Объединение дублей
- История обращений

**API:**
```
GET    /api/patients                — Список с пагинацией и фильтрами
POST   /api/patients                — Создание пациента
GET    /api/patients/:id            — Карточка пациента
PATCH  /api/patients/:id            — Обновление данных
DELETE /api/patients/:id            — Удаление (soft)
GET    /api/patients/search         — Быстрый поиск (autocomplete)
GET    /api/patients/:id/history    — История посещений
GET    /api/patients/:id/records    — ЭМК пациента
GET    /api/patients/:id/invoices   — Счета пациента
GET    /api/patients/:id/documents  — Документы пациента
POST   /api/patients/:id/consent    — Фиксация согласия
POST   /api/patients/:id/photo      — Загрузка фото
POST   /api/patients/import         — Импорт из файла
GET    /api/patients/export         — Экспорт (Excel/CSV)
POST   /api/patients/merge          — Объединение дублей
GET    /api/patients/:id/timeline   — Таймлайн пациента
```

**Модель данных:**
```
Patient {
  id: UUID (PK)
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: date
  gender: 'male' | 'female'
  phone?: string
  email?: string
  address?: string
  passportNumber?: string
  photoUrl?: string
  bloodType?: string ('A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-')
  allergies?: text
  tags?: string[]
  source?: string ('walk_in' | 'online' | 'referral' | 'marketing')
  insurancePolicyNumber?: string
  insuranceCompanyId?: UUID (FK → InsuranceCompany)
  notes?: text
  consentGiven: boolean
  consentDate?: timestamp
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt?: timestamp
}
```

---

### 3.3 Расписание и запись (`scheduling`)

**Функции:**
- Настройка графика работы врача (дни, часы, перерывы, слоты)
- Запись пациента на приём (рецепшен / онлайн)
- Визуальное расписание (день/неделя/месяц, Gantt-подобное)
- Управление кабинетами (привязка к врачам)
- Проверка конфликтов (врач, кабинет, пациент)
- Подтверждение записи (SMS/звонок)
- Отмена и перенос записи
- Онлайн-запись пациентом
- Очередь (живая очередь в клинике)
- Типы приёмов: первичный, повторный, процедура, консультация
- Мониторинг в реальном времени

**API:**
```
# Приёмы (Appointments)
GET    /api/appointments                 — Список приёмов (фильтры: дата, врач, статус, филиал)
POST   /api/appointments                 — Создание записи
GET    /api/appointments/:id             — Детали приёма
PATCH  /api/appointments/:id             — Обновление
DELETE /api/appointments/:id             — Отмена
PATCH  /api/appointments/:id/status      — Смена статуса
POST   /api/appointments/:id/confirm     — Подтверждение
POST   /api/appointments/:id/reschedule  — Перенос
GET    /api/appointments/slots           — Доступные слоты (врач + дата)
GET    /api/appointments/today           — Приёмы на сегодня
GET    /api/appointments/conflicts       — Проверка конфликтов

# Расписание врачей (Doctor Schedules)
GET    /api/schedules                    — Расписания (фильтр: врач, отделение)
POST   /api/schedules                    — Создание графика
PATCH  /api/schedules/:id               — Обновление
DELETE /api/schedules/:id               — Удаление
POST   /api/schedules/bulk              — Массовое создание (шаблон)
GET    /api/schedules/doctor/:id        — Расписание конкретного врача

# Кабинеты (Rooms)
GET    /api/rooms                        — Список кабинетов
POST   /api/rooms                        — Создание
PATCH  /api/rooms/:id                   — Обновление
DELETE /api/rooms/:id                   — Удаление

# Очередь (Queue)
GET    /api/queue                        — Текущая очередь
POST   /api/queue/call-next             — Вызов следующего
PATCH  /api/queue/:id/status            — Статус в очереди

# Онлайн-запись (Patient-facing)
GET    /api/public/doctors               — Список врачей для записи
GET    /api/public/slots                 — Доступные слоты
POST   /api/public/appointments          — Онлайн-запись
```

**Модели данных:**
```
Appointment {
  id: UUID (PK)
  patientId: UUID (FK → Patient)
  doctorId: UUID (FK → User)
  roomId?: UUID (FK → Room)
  serviceId?: UUID (FK → Service)
  branchId: UUID (FK → Branch)
  date: date
  startTime: time
  endTime: time
  type: 'primary' | 'follow_up' | 'procedure' | 'consultation'
  status: 'scheduled' | 'confirmed' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  source: 'reception' | 'online' | 'referral'
  cancellationReason?: string
  notes?: text
  isOnline: boolean
  reminderSent: boolean
  queuePosition?: integer
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt?: timestamp
}

DoctorSchedule {
  id: UUID (PK)
  doctorId: UUID (FK → User)
  roomId?: UUID (FK → Room)
  branchId: UUID (FK → Branch)
  dayOfWeek: integer (0-6)
  startTime: time
  endTime: time
  breakStart?: time
  breakEnd?: time
  slotDuration: integer (минуты, default 30)
  isActive: boolean
  validFrom?: date
  validUntil?: date
  createdAt: timestamp
}

Room {
  id: UUID (PK)
  branchId: UUID (FK → Branch)
  name: string
  number: string
  floor?: string
  type: 'consultation' | 'procedure' | 'surgery' | 'diagnostics' | 'other'
  isActive: boolean
  equipment?: string[]
  description?: string
  createdAt: timestamp
}
```

**Статусы приёма (flow):**
```
scheduled → confirmed → waiting → in_progress → completed
    ↓           ↓                       ↓
 cancelled   cancelled              cancelled
    ↓           ↓
 no_show     no_show
```

---

### 3.4 Электронная медицинская карта — ЭМК (`emr`)

**Функции:**
- Ведение приёма (жалобы, анамнез, осмотр, диагноз, рекомендации)
- Шаблоны осмотров (по специальностям)
- Диагнозы по МКБ-10
- Назначения и рецепты
- Направления к специалистам
- Подпись врача (электронная)
- Статусы записи: черновик → подписана → изменена
- Печать медицинских документов
- Прикрепление файлов (снимки, результаты)
- Витальные показатели (давление, пульс, температура, вес, рост)

**API:**
```
# Медицинские записи
GET    /api/medical-records                    — Список записей
POST   /api/medical-records                    — Создание записи
GET    /api/medical-records/:id                — Детали
PATCH  /api/medical-records/:id                — Обновление (черновик)
POST   /api/medical-records/:id/sign           — Подписание
POST   /api/medical-records/:id/amend          — Внесение изменений (после подписи)
GET    /api/medical-records/patient/:id        — Записи пациента
GET    /api/medical-records/appointment/:id    — Запись по приёму

# Шаблоны
GET    /api/templates                          — Список шаблонов
POST   /api/templates                          — Создание
PATCH  /api/templates/:id                      — Обновление
DELETE /api/templates/:id                      — Удаление
GET    /api/templates/specialty/:name          — Шаблоны по специальности

# Рецепты
GET    /api/prescriptions                      — Список рецептов
POST   /api/prescriptions                      — Создание рецепта
GET    /api/prescriptions/:id                  — Детали
PATCH  /api/prescriptions/:id                  — Обновление
GET    /api/prescriptions/patient/:id          — Рецепты пациента
POST   /api/prescriptions/:id/print            — Печать

# Направления
GET    /api/referrals                          — Список направлений
POST   /api/referrals                          — Создание
PATCH  /api/referrals/:id                      — Обновление
PATCH  /api/referrals/:id/status               — Смена статуса
GET    /api/referrals/patient/:id              — Направления пациента

# Витальные показатели
GET    /api/vitals/patient/:id                 — Показатели пациента
POST   /api/vitals                             — Запись показателей
GET    /api/vitals/patient/:id/chart           — Данные для графиков

# МКБ-10
GET    /api/icd10/search                       — Поиск диагноза
GET    /api/icd10/favorites                    — Частые диагнозы врача

# Файлы к записи
POST   /api/medical-records/:id/attachments    — Прикрепление файла
GET    /api/medical-records/:id/attachments    — Список файлов
DELETE /api/medical-records/:id/attachments/:fileId — Удаление
```

**Модели данных:**
```
MedicalRecord {
  id: UUID (PK)
  patientId: UUID (FK → Patient)
  doctorId: UUID (FK → User)
  appointmentId?: UUID (FK → Appointment)
  templateId?: UUID (FK → Template)
  complaints: text
  anamnesis: text
  examination: text
  diagnosis: text
  diagnosisCode?: string (МКБ-10)
  recommendations?: text
  notes?: text
  status: 'draft' | 'signed' | 'amended'
  signedAt?: timestamp
  amendedAt?: timestamp
  amendReason?: string
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt?: timestamp
}

Template {
  id: UUID (PK)
  name: string
  specialty: string
  content: jsonb {
    complaints?: string
    anamnesis?: string
    examination?: string
    diagnosis?: string
    recommendations?: string
  }
  isGlobal: boolean
  createdById: UUID (FK → User)
  createdAt: timestamp
}

Prescription {
  id: UUID (PK)
  patientId: UUID (FK → Patient)
  doctorId: UUID (FK → User)
  medicalRecordId?: UUID (FK → MedicalRecord)
  medications: jsonb [{
    name: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
  }]
  notes?: string
  status: 'active' | 'completed' | 'cancelled'
  createdAt: timestamp
}

Referral {
  id: UUID (PK)
  patientId: UUID (FK → Patient)
  referringDoctorId: UUID (FK → User)
  targetDoctorId?: UUID (FK → User)
  targetSpecialty: string
  reason: text
  notes?: text
  priority: 'routine' | 'urgent' | 'emergency'
  status: 'created' | 'scheduled' | 'completed' | 'cancelled'
  appointmentId?: UUID (FK → Appointment) — назначенный приём
  createdAt: timestamp
}

VitalSigns {
  id: UUID (PK)
  patientId: UUID (FK → Patient)
  recordedById: UUID (FK → User)
  appointmentId?: UUID (FK → Appointment)
  systolicBP?: integer (мм рт.ст.)
  diastolicBP?: integer
  heartRate?: integer (уд/мин)
  temperature?: decimal (°C)
  respiratoryRate?: integer (дых/мин)
  oxygenSaturation?: integer (%)
  weight?: decimal (кг)
  height?: decimal (см)
  bloodGlucose?: decimal (ммоль/л)
  notes?: string
  recordedAt: timestamp
  createdAt: timestamp
}
```

---

### 3.5 Биллинг и финансы (`billing`)

**Функции:**
- Каталог услуг (название, код, цена, длительность, категория)
- Прайс-лист (по категориям, отделениям)
- Создание счетов (auto из услуг приёма)
- Скидки (процент / фиксированная)
- Оплата (наличные, карта, перевод, ДМС)
- Касса (открытие/закрытие смены, инкассация)
- Чеки (печать, QR)
- Возвраты
- Дебиторская задолженность
- Доходы / расходы
- Зарплаты (оклад + % от услуг)
- ДМС-расчёты (реестры, акты сверки)
- Налоговая отчётность
- Финансовые отчёты (P&L, Cash Flow)

**API:**
```
# Услуги (Services)
GET    /api/services                    — Каталог услуг
POST   /api/services                    — Создание услуги
PATCH  /api/services/:id               — Обновление
DELETE /api/services/:id               — Удаление
GET    /api/services/categories         — Категории услуг
POST   /api/services/import             — Импорт прайса
GET    /api/services/export             — Экспорт прайса

# Счета (Invoices)
GET    /api/invoices                    — Список счетов
POST   /api/invoices                    — Создание счёта
GET    /api/invoices/:id                — Детали
PATCH  /api/invoices/:id               — Обновление
POST   /api/invoices/:id/pay            — Оплата
POST   /api/invoices/:id/refund         — Возврат
GET    /api/invoices/:id/receipt        — Чек (PDF)
GET    /api/invoices/patient/:id        — Счета пациента
GET    /api/invoices/overdue            — Просроченные

# Платежи (Payments)
GET    /api/payments                    — Список платежей
POST   /api/payments                    — Создание платежа
GET    /api/payments/:id                — Детали
GET    /api/payments/daily-report       — Дневной отчёт кассы

# Касса (Cash Register)
POST   /api/cash-register/open         — Открытие смены
POST   /api/cash-register/close        — Закрытие смены
GET    /api/cash-register/current       — Текущая смена
POST   /api/cash-register/encashment   — Инкассация

# Расходы (Expenses)
GET    /api/expenses                    — Список расходов
POST   /api/expenses                    — Добавление расхода
PATCH  /api/expenses/:id               — Обновление
DELETE /api/expenses/:id               — Удаление
GET    /api/expenses/categories         — Категории расходов

# Зарплаты (Payroll)
GET    /api/payroll                     — Начисления за период
POST   /api/payroll/calculate           — Расчёт за месяц
GET    /api/payroll/sheets              — Ведомости
POST   /api/payroll/sheets              — Формирование ведомости
PATCH  /api/payroll/sheets/:id/approve  — Утверждение
PATCH  /api/payroll/sheets/:id/pay      — Выплата
GET    /api/payroll/settings            — Настройки начислений
PATCH  /api/payroll/settings            — Обновление настроек

# ДМС (Insurance)
GET    /api/insurance/companies          — Страховые компании
POST   /api/insurance/companies          — Добавление
GET    /api/insurance/registries         — Реестры
POST   /api/insurance/registries         — Формирование реестра
PATCH  /api/insurance/registries/:id/status — Статус реестра
GET    /api/insurance/reconciliation/:id — Акт сверки
GET    /api/insurance/coverage/check     — Проверка покрытия

# Контрагенты (Counterparties)
GET    /api/counterparties              — Список
POST   /api/counterparties              — Создание
PATCH  /api/counterparties/:id          — Обновление
GET    /api/counterparties/:id/reconciliation — Акт сверки

# Финансовые отчёты
GET    /api/reports/revenue              — Отчёт по доходам
GET    /api/reports/expenses             — Отчёт по расходам
GET    /api/reports/profit-loss          — P&L
GET    /api/reports/cash-flow            — Cash Flow
GET    /api/reports/services             — По услугам
GET    /api/reports/doctors              — По врачам
GET    /api/reports/departments          — По отделениям
GET    /api/reports/custom               — Конструктор отчётов
GET    /api/reports/tax                  — Налоговый отчёт

# Налоги (Tax)
GET    /api/tax/calendar                 — Налоговый календарь
GET    /api/tax/reports                  — Налоговые отчёты
POST   /api/tax/calculate               — Калькулятор налогов
```

**Модели данных:**
```
Service {
  id: UUID (PK)
  name: string
  code: string (уникальный)
  description?: text
  category: string
  departmentId?: UUID (FK → Department)
  price: decimal
  duration: integer (минуты)
  isActive: boolean
  insuranceCovered: boolean
  createdAt: timestamp
}

Invoice {
  id: UUID (PK)
  patientId: UUID (FK → Patient)
  appointmentId?: UUID (FK → Appointment)
  invoiceNumber: string (авто: INV-2024-00001)
  totalAmount: decimal
  discountPercent?: decimal
  discountAmount: decimal
  finalAmount: decimal
  status: 'draft' | 'pending' | 'paid' | 'partially_paid' | 'cancelled' | 'refunded'
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'insurance' | 'mixed'
  insuranceCompanyId?: UUID (FK → InsuranceCompany)
  paidAt?: timestamp
  dueDate?: date
  notes?: string
  createdById: UUID (FK → User)
  branchId: UUID (FK → Branch)
  createdAt: timestamp
}

InvoiceItem {
  id: UUID (PK)
  invoiceId: UUID (FK → Invoice)
  serviceId: UUID (FK → Service)
  quantity: integer
  unitPrice: decimal
  discount?: decimal
  totalPrice: decimal
}

Payment {
  id: UUID (PK)
  invoiceId: UUID (FK → Invoice)
  amount: decimal
  method: 'cash' | 'card' | 'transfer' | 'insurance'
  transactionId?: string
  cashRegisterId?: UUID (FK → CashRegister)
  receivedById: UUID (FK → User)
  paidAt: timestamp
  createdAt: timestamp
}

Expense {
  id: UUID (PK)
  category: 'salary' | 'rent' | 'utilities' | 'supplies' | 'medications' | 'equipment' | 'marketing' | 'taxes' | 'other'
  description: string
  amount: decimal
  date: date
  counterpartyId?: UUID (FK → Counterparty)
  paymentMethod: 'cash' | 'card' | 'transfer'
  documentUrl?: string
  isRecurring: boolean
  recurringPeriod?: 'monthly' | 'quarterly' | 'yearly'
  createdById: UUID (FK → User)
  branchId: UUID (FK → Branch)
  createdAt: timestamp
}

InsuranceCompany {
  id: UUID (PK)
  name: string
  inn: string
  contactPerson?: string
  phone?: string
  email?: string
  contractNumber?: string
  contractValidUntil?: date
  isActive: boolean
  createdAt: timestamp
}

InsuranceRegistry {
  id: UUID (PK)
  insuranceCompanyId: UUID (FK → InsuranceCompany)
  registryNumber: string
  period: string (YYYY-MM)
  servicesCount: integer
  totalAmount: decimal
  status: 'forming' | 'sent' | 'accepted' | 'paid' | 'rejected'
  items: jsonb [{patientId, policyNumber, date, serviceId, amount}]
  createdById: UUID (FK → User)
  createdAt: timestamp
}

CashRegister {
  id: UUID (PK)
  branchId: UUID (FK → Branch)
  openedById: UUID (FK → User)
  closedById?: UUID (FK → User)
  openedAt: timestamp
  closedAt?: timestamp
  openingBalance: decimal
  closingBalance?: decimal
  totalIncome?: decimal
  totalRefunds?: decimal
  status: 'open' | 'closed'
}

Counterparty {
  id: UUID (PK)
  name: string
  inn: string
  type: 'supplier' | 'insurance' | 'landlord' | 'other'
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  balance: decimal
  isActive: boolean
  createdAt: timestamp
}

PayrollEntry {
  id: UUID (PK)
  userId: UUID (FK → User)
  period: string (YYYY-MM)
  baseSalary: decimal
  servicePercentage: decimal
  servicesAmount: decimal (auto-calc)
  bonuses: decimal
  deductions: decimal
  totalAmount: decimal
  status: 'calculated' | 'approved' | 'paid'
  paidAt?: timestamp
  createdAt: timestamp
}
```

---

### 3.6 Персонал и организация (`staff`)

**Функции:**
- Управление сотрудниками (CRUD)
- Профили (ФИО, специальность, квалификация, сертификаты)
- Отделения (создание, назначение заведующих)
- Филиалы (адрес, режим работы, кабинеты)
- Статистика врача (приёмы, средний чек, отзывы)
- Приглашение сотрудника (email/SMS)

**API:**
```
# Сотрудники (Staff)
GET    /api/staff                       — Список сотрудников
POST   /api/staff                       — Создание
GET    /api/staff/:id                   — Профиль
PATCH  /api/staff/:id                   — Обновление
DELETE /api/staff/:id                   — Удаление (soft)
PATCH  /api/staff/:id/status            — Блокировка / активация
POST   /api/staff/:id/reset-password    — Сброс пароля
GET    /api/staff/:id/statistics        — Статистика врача
GET    /api/staff/doctors               — Только врачи

# Отделения (Departments)
GET    /api/departments                 — Список
POST   /api/departments                 — Создание
PATCH  /api/departments/:id            — Обновление
DELETE /api/departments/:id            — Удаление

# Филиалы (Branches)
GET    /api/branches                    — Список филиалов
POST   /api/branches                    — Создание
PATCH  /api/branches/:id               — Обновление
DELETE /api/branches/:id               — Удаление
GET    /api/branches/:id/rooms          — Кабинеты филиала
GET    /api/branches/:id/staff          — Персонал филиала
```

**Модели данных:**
```
User (Staff) {
  id: UUID (PK)
  email: string (unique)
  login?: string (unique)
  passwordHash: string
  firstName: string
  lastName: string
  middleName?: string
  phone: string
  role: UserRole
  departmentId?: UUID (FK → Department)
  branchId?: UUID (FK → Branch)
  specialty?: string
  qualification?: string
  licenseNumber?: string
  photoUrl?: string
  isActive: boolean
  preferredLanguage: 'ru' | 'uz'
  twoFactorEnabled: boolean
  twoFactorSecret?: string
  lastLoginAt?: timestamp
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt?: timestamp
}

Department {
  id: UUID (PK)
  name: string
  code: string (unique)
  description?: text
  headDoctorId?: UUID (FK → User)
  branchId: UUID (FK → Branch)
  isActive: boolean
  createdAt: timestamp
}

Branch {
  id: UUID (PK)
  name: string
  address: string
  phone?: string
  email?: string
  workingHours: jsonb {
    monday: {start: '09:00', end: '18:00', isWorking: true},
    ...
  }
  isActive: boolean
  isMain: boolean
  createdAt: timestamp
}
```

---

### 3.7 Документы (`documents`)

**Функции:**
- Загрузка файлов (изображения, PDF, DICOM)
- Привязка к пациенту / записи / счёту
- Шаблоны документов (справки, направления, заключения)
- Генерация PDF (из шаблона + данные)
- Печать документов
- Хранилище MinIO (S3)

**API:**
```
POST   /api/documents/upload            — Загрузка файла
GET    /api/documents/:id               — Скачивание
DELETE /api/documents/:id               — Удаление
GET    /api/documents/entity/:type/:id  — Документы сущности
GET    /api/document-templates          — Шаблоны документов
POST   /api/document-templates          — Создание шаблона
POST   /api/document-templates/:id/generate — Генерация PDF
```

**Модель данных:**
```
Document {
  id: UUID (PK)
  fileName: string
  originalName: string
  mimeType: string
  size: integer (bytes)
  storagePath: string (MinIO key)
  entityType: 'patient' | 'medical_record' | 'invoice' | 'insurance' | 'other'
  entityId: UUID
  uploadedById: UUID (FK → User)
  description?: string
  createdAt: timestamp
  deletedAt?: timestamp
}

DocumentTemplate {
  id: UUID (PK)
  name: string
  type: 'certificate' | 'referral' | 'conclusion' | 'receipt' | 'prescription' | 'other'
  content: text (HTML/Handlebars template)
  variables: string[] (placeholder names)
  isActive: boolean
  createdById: UUID (FK → User)
  createdAt: timestamp
}
```

---

### 3.8 Чат и коммуникации (`chat`)

**Функции:**
- Чат между сотрудниками (1-на-1, группы)
- Чат врач ↔ пациент
- Отправка файлов
- Real-time через WebSocket
- История сообщений
- Непрочитанные / статус доставки
- Системные сообщения

**API:**
```
GET    /api/chat/rooms                   — Список чатов
POST   /api/chat/rooms                   — Создание чата
GET    /api/chat/rooms/:id               — Детали чата
GET    /api/chat/rooms/:id/messages      — Сообщения (пагинация)
POST   /api/chat/rooms/:id/messages      — Отправка сообщения
PATCH  /api/chat/rooms/:id/read          — Отметить прочитанным
POST   /api/chat/rooms/:id/members       — Добавление участника
DELETE /api/chat/rooms/:id/members/:uid  — Удаление участника
```

**WebSocket events:**
```
# Client → Server
ws:join-room        {roomId}
ws:leave-room       {roomId}
ws:send-message     {roomId, content, type}
ws:typing           {roomId}

# Server → Client
ws:new-message      {message}
ws:user-typing      {roomId, userId}
ws:message-read     {roomId, userId}
ws:user-online      {userId}
ws:user-offline     {userId}
```

**Модели данных:**
```
ChatRoom {
  id: UUID (PK)
  name?: string
  type: 'direct' | 'group' | 'patient'
  createdById: UUID (FK → User)
  lastMessageAt?: timestamp
  createdAt: timestamp
}

ChatRoomMember {
  id: UUID (PK)
  chatRoomId: UUID (FK → ChatRoom)
  userId: UUID (FK → User)
  lastReadAt?: timestamp
  joinedAt: timestamp
}

ChatMessage {
  id: UUID (PK)
  chatRoomId: UUID (FK → ChatRoom)
  senderId: UUID (FK → User)
  content: text
  type: 'text' | 'file' | 'system'
  fileUrl?: string
  fileName?: string
  isRead: boolean
  createdAt: timestamp
  deletedAt?: timestamp
}
```

---

### 3.9 Задачи (`tasks`)

**Функции:**
- Создание задач (от руководства, между коллегами)
- Назначение исполнителя
- Приоритеты (low, normal, high, urgent)
- Статусы (new → in_progress → review → completed)
- Комментарии к задачам
- Дедлайны
- Фильтрация по отделению, исполнителю, статусу

**API:**
```
GET    /api/tasks                        — Список задач
POST   /api/tasks                        — Создание
GET    /api/tasks/:id                    — Детали
PATCH  /api/tasks/:id                    — Обновление
DELETE /api/tasks/:id                    — Удаление
PATCH  /api/tasks/:id/status             — Смена статуса
GET    /api/tasks/:id/comments           — Комментарии
POST   /api/tasks/:id/comments           — Добавление комментария
GET    /api/tasks/my                     — Мои задачи
GET    /api/tasks/created                — Созданные мной
```

**Модели данных:**
```
Task {
  id: UUID (PK)
  title: string
  description?: text
  createdById: UUID (FK → User)
  assigneeId?: UUID (FK → User)
  departmentId?: UUID (FK → Department)
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'new' | 'in_progress' | 'review' | 'completed' | 'cancelled'
  dueDate?: date
  completedAt?: timestamp
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt?: timestamp
}

TaskComment {
  id: UUID (PK)
  taskId: UUID (FK → Task)
  authorId: UUID (FK → User)
  content: text
  createdAt: timestamp
}
```

---

### 3.10 Уведомления (`notifications`)

**Функции:**
- Push-уведомления (in-app)
- Email-уведомления (SMTP)
- SMS-уведомления (Playmobile/SMS.uz)
- Telegram-бот
- Типы: запись, сообщение, задача, направление, системное
- Настройка каналов по типу уведомления
- Автоматические напоминания (за 24ч, 2ч до приёма)
- Real-time через WebSocket

**API:**
```
GET    /api/notifications                — Список уведомлений
PATCH  /api/notifications/:id/read       — Отметить прочитанным
PATCH  /api/notifications/read-all       — Прочитать все
GET    /api/notifications/unread-count   — Кол-во непрочитанных
DELETE /api/notifications/:id            — Удаление
GET    /api/notifications/settings       — Настройки уведомлений
PATCH  /api/notifications/settings       — Обновление настроек

# SMS
POST   /api/sms/send                     — Отправка SMS
POST   /api/sms/bulk                     — Массовая отправка
GET    /api/sms/balance                  — Баланс шлюза
GET    /api/sms/history                  — История отправок
```

**Модель данных:**
```
Notification {
  id: UUID (PK)
  userId: UUID (FK → User)
  type: 'appointment' | 'message' | 'task' | 'referral' | 'payment' | 'system'
  title: string
  body: text
  isRead: boolean
  link?: string
  metadata?: jsonb
  createdAt: timestamp
}

NotificationSettings {
  id: UUID (PK)
  userId: UUID (FK → User)
  channel: 'push' | 'email' | 'sms' | 'telegram'
  appointmentReminder: boolean
  newMessage: boolean
  newTask: boolean
  paymentReceived: boolean
  systemAlerts: boolean
}

SmsLog {
  id: UUID (PK)
  phone: string
  message: text
  status: 'sent' | 'delivered' | 'failed'
  provider: string
  providerMessageId?: string
  sentAt: timestamp
  deliveredAt?: timestamp
}
```

---

### 3.11 Аудит и логирование (`audit`)

**Функции:**
- Запись всех действий пользователей
- Фильтрация по пользователю, действию, модулю, дате
- Экспорт логов
- Хранение IP-адресов
- Неизменяемые записи (append-only)

**API:**
```
GET    /api/audit                        — Список записей (с фильтрами)
GET    /api/audit/:id                    — Детали записи
GET    /api/audit/export                 — Экспорт
GET    /api/audit/user/:id               — Действия пользователя
GET    /api/audit/entity/:type/:id       — Действия над сущностью
```

**Модель данных:**
```
AuditLog {
  id: UUID (PK)
  userId: UUID (FK → User)
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'print'
  entityType: string (patient, appointment, medical_record, invoice, ...)
  entityId?: UUID
  module: string
  description: string
  oldValues?: jsonb
  newValues?: jsonb
  ipAddress: string
  userAgent?: string
  createdAt: timestamp
}
```

---

### 3.12 Аналитика (`analytics`)

**Функции:**
- Дашборды по ролям (KPI-карточки, графики, виджеты)
- Статистика приёмов (по дням, врачам, услугам)
- Финансовая аналитика (выручка, средний чек, конверсия)
- Загрузка врачей (% занятости слотов)
- Удовлетворённость пациентов (оценки, NPS)
- Маркетинг (источники пациентов, конверсия)
- Экспорт отчётов (PDF, Excel)

**API:**
```
GET    /api/analytics/dashboard/:role    — Дашборд по роли
GET    /api/analytics/appointments       — Статистика приёмов
GET    /api/analytics/revenue            — Статистика выручки
GET    /api/analytics/doctors            — Загрузка врачей
GET    /api/analytics/patients           — Статистика пациентов
GET    /api/analytics/services           — Популярные услуги
GET    /api/analytics/marketing          — Маркетинг-аналитика
GET    /api/analytics/satisfaction       — Удовлетворённость
GET    /api/analytics/departments        — По отделениям
GET    /api/analytics/branches           — По филиалам
GET    /api/analytics/trends             — Тренды (сравнение периодов)
```

---

### 3.13 Склад и расходники (`inventory`)

**Функции:**
- Учёт медикаментов и расходных материалов
- Приход / расход / списание
- Минимальные остатки (уведомления при низком уровне)
- Поставщики
- Срок годности (контроль)
- Привязка расхода к приёму / процедуре

**API:**
```
GET    /api/inventory                    — Список позиций
POST   /api/inventory                    — Добавление позиции
PATCH  /api/inventory/:id               — Обновление
GET    /api/inventory/low-stock          — Низкие остатки
POST   /api/inventory/receipt            — Оприходование
POST   /api/inventory/write-off          — Списание
GET    /api/inventory/movements          — Движение товаров
GET    /api/inventory/expiring           — Истекающий срок годности
```

**Модели данных:**
```
InventoryItem {
  id: UUID (PK)
  name: string
  sku: string (unique)
  category: 'medication' | 'supply' | 'equipment' | 'other'
  unit: string ('шт' | 'мл' | 'г' | 'упак')
  quantity: decimal
  minQuantity: decimal
  price: decimal
  expirationDate?: date
  supplierId?: UUID (FK → Counterparty)
  branchId: UUID (FK → Branch)
  location?: string
  isActive: boolean
  createdAt: timestamp
}

InventoryMovement {
  id: UUID (PK)
  itemId: UUID (FK → InventoryItem)
  type: 'receipt' | 'consumption' | 'write_off' | 'transfer'
  quantity: decimal
  reason?: string
  appointmentId?: UUID (FK → Appointment)
  performedById: UUID (FK → User)
  createdAt: timestamp
}
```

---

### 3.14 Телемедицина (`telemedicine`)

**Функции:**
- Видеоконсультация (WebRTC)
- Предварительная анкета пациента
- Чат во время консультации
- Запись консультации (с согласия)
- Демонстрация экрана / файлов
- Таймер консультации
- Оценка после консультации

**API:**
```
POST   /api/telemedicine/sessions         — Создание сессии
GET    /api/telemedicine/sessions/:id     — Детали сессии
POST   /api/telemedicine/sessions/:id/join — Присоединение
POST   /api/telemedicine/sessions/:id/end  — Завершение
GET    /api/telemedicine/sessions/:id/token — Токен для WebRTC
```

---

### 3.15 Маркетинг (`marketing`)

**Функции:**
- Источники пациентов (отслеживание)
- SMS/Email рассылки
- Акции и скидки
- Программа лояльности
- Отзывы и рейтинг клиники
- Конверсия по каналам

**API:**
```
GET    /api/marketing/campaigns           — Список кампаний
POST   /api/marketing/campaigns           — Создание
GET    /api/marketing/sources             — Источники пациентов
GET    /api/marketing/promotions          — Акции
POST   /api/marketing/promotions          — Создание акции
GET    /api/marketing/reviews             — Отзывы
GET    /api/marketing/loyalty             — Программа лояльности
```

---

### 3.16 Системное управление (`system`)

**Функции:**
- Управление пользователями (CRUD, блокировка, сброс пароля)
- Настройка ролей и матрицы прав
- Интеграции (SMS, платежи, лаборатория, ЕГИСЗ, Email, Telegram)
- Резервное копирование (расписание, ручное, восстановление)
- Системные логи (structured + raw, real-time)
- Настройки системы (безопасность, хранилище, SMTP)
- Обновления системы
- Мониторинг (CPU, RAM, диск, сервисы)

**API:**
```
# Пользователи (Users)
GET    /api/users                        — Список
POST   /api/users                        — Создание
PATCH  /api/users/:id                   — Обновление
DELETE /api/users/:id                   — Удаление
PATCH  /api/users/:id/block              — Блокировка
POST   /api/users/:id/reset-password     — Сброс пароля

# Роли (Roles)
GET    /api/roles                        — Список ролей
POST   /api/roles                        — Создание кастомной роли
PATCH  /api/roles/:id                   — Обновление
DELETE /api/roles/:id                   — Удаление
GET    /api/roles/:id/permissions        — Матрица прав
PATCH  /api/roles/:id/permissions        — Обновление прав

# Интеграции
GET    /api/integrations                 — Список интеграций
PATCH  /api/integrations/:id            — Настройка
POST   /api/integrations/:id/test        — Тест подключения

# Бэкапы
GET    /api/backups                      — Список бэкапов
POST   /api/backups                      — Создание бэкапа
POST   /api/backups/:id/restore          — Восстановление
DELETE /api/backups/:id                  — Удаление
GET    /api/backups/settings             — Настройки
PATCH  /api/backups/settings             — Обновление настроек

# Системные логи
GET    /api/system-logs                  — Логи (с фильтрами)
GET    /api/system-logs/stream           — SSE/WebSocket стрим
GET    /api/system-logs/export           — Экспорт

# Настройки
GET    /api/settings                     — Все настройки
PATCH  /api/settings                     — Обновление
GET    /api/settings/storage             — Состояние хранилища

# Мониторинг
GET    /api/monitoring/status            — Статус системы
GET    /api/monitoring/services          — Статус сервисов
GET    /api/monitoring/metrics           — CPU, RAM, диск
GET    /api/monitoring/active-users      — Активные пользователи

# Обновления
GET    /api/updates/current              — Текущая версия
GET    /api/updates/available            — Доступное обновление
POST   /api/updates/install              — Установка обновления
GET    /api/updates/history              — История обновлений
```

---

## 4. Маршруты фронтенда (Routes)

### 4.1 Публичные маршруты (без авторизации)

```
/login                              — Вход в систему
/forgot-password                    — Восстановление пароля
/invite/:token                      — Принятие приглашения
/online-booking                     — Онлайн-запись (пациент)
```

### 4.2 Общие маршруты (все авторизованные)

```
/                                   — Дашборд (redirect по роли)
/profile                            — Профиль
/profile/settings                   — Настройки профиля
/notifications                      — Уведомления
/chat                               — Чат
/chat/:roomId                       — Конкретный чат
```

### 4.3 Владелец клиники (`owner`)

```
/owner/dashboard                    — Дашборд владельца
/owner/finances                     — Финансовый обзор
/owner/finances/revenue             — Доходы
/owner/finances/expenses            — Расходы
/owner/finances/profit-loss         — P&L отчёт
/owner/insurance                    — ДМС / Страховые
/owner/staff                        — Управление персоналом
/owner/staff/:id                    — Карточка сотрудника
/owner/branches                     — Филиалы
/owner/branches/:id                 — Настройка филиала
/owner/analytics                    — Аналитика
/owner/analytics/doctors            — Статистика врачей
/owner/analytics/services           — Статистика услуг
/owner/analytics/marketing          — Маркетинг
/owner/marketing                    — Маркетинг кампании
/owner/marketing/promotions         — Акции
/owner/price-list                   — Прайс-лист
/owner/audit                        — Журнал аудита
/owner/settings                     — Настройки клиники
```

### 4.4 Главный врач (`chief_doctor`)

```
/chief/dashboard                    — Дашборд главврача
/chief/schedule                     — Управление расписанием
/chief/schedule/doctors             — Расписание врачей
/chief/monitoring                   — Мониторинг приёмов
/chief/protocols                    — Протоколы лечения
/chief/quality                      — Контроль качества
/chief/records                      — Медицинские записи
/chief/statistics                   — Статистика врачей
/chief/departments                  — Отделения
/chief/prescriptions                — Контроль назначений
/chief/reports                      — Отчёты
```

### 4.5 Врач (`doctor`)

```
/doctor/dashboard                   — Дашборд врача
/doctor/appointments                — Мои приёмы (сегодня)
/doctor/appointments/:id            — Ведение приёма (осмотр)
/doctor/patients                    — Мои пациенты
/doctor/patients/:id                — Карточка пациента / ЭМК
/doctor/schedule                    — Моё расписание
/doctor/telemedicine                — Телемедицина
/doctor/telemedicine/:sessionId     — Видеоконсультация
/doctor/lab-results                 — Результаты анализов
/doctor/templates                   — Шаблоны осмотров
/doctor/referrals                   — Направления
/doctor/prescriptions               — Рецепты
/doctor/certificates                — Справки и документы
/doctor/vitals/:patientId           — Витальные показатели
```

### 4.6 Медсестра (`nurse`)

```
/nurse/dashboard                    — Дашборд медсестры
/nurse/procedures                   — Процедуры (сегодня)
/nurse/procedures/:id               — Выполнение процедуры
/nurse/vitals                       — Ввод витальных показателей
/nurse/vitals/:patientId            — Показатели пациента
/nurse/log                          — Журнал процедур
/nurse/treatment-room               — Управление кабинетом
/nurse/tasks                        — Задачи
/nurse/supplies                     — Расходники
```

### 4.7 Рецепшен (`admin`)

```
/reception/dashboard                — Дашборд рецепшена
/reception/booking                  — Запись пациента (wizard)
/reception/registration             — Регистрация пациента
/reception/schedule                 — Расписание (обзор)
/reception/schedule/:doctorId       — Расписание врача
/reception/queue                    — Управление очередью
/reception/pos                      — Касса / оплата
/reception/patients                 — Поиск пациентов
/reception/patients/:id             — Карточка пациента
/reception/appointments             — Управление записями
/reception/appointments/:id         — Детали записи
/reception/documents                — Печать документов
/reception/sms                      — SMS-уведомления
```

### 4.8 Бухгалтер (`accountant`)

```
/accountant/dashboard               — Дашборд бухгалтера
/accountant/revenue                 — Доходы / выручка
/accountant/expenses                — Расходы
/accountant/payroll                 — Зарплаты
/accountant/payroll/settings        — Настройки начислений
/accountant/insurance               — ДМС-расчёты
/accountant/insurance/registries    — Реестры
/accountant/tax                     — Налоговая отчётность
/accountant/tax/calendar            — Налоговый календарь
/accountant/counterparties          — Контрагенты
/accountant/counterparties/:id      — Карточка контрагента
/accountant/reports                 — Финансовые отчёты
/accountant/reports/builder         — Конструктор отчётов
```

### 4.9 Сисадмин (`sysadmin`)

```
/admin/dashboard                    — Дашборд сисадмина
/admin/users                        — Управление пользователями
/admin/users/:id                    — Карточка пользователя
/admin/roles                        — Роли и права
/admin/roles/:id                    — Настройка роли (матрица)
/admin/integrations                 — Интеграции
/admin/integrations/:id             — Настройка интеграции
/admin/backups                      — Бэкапы
/admin/logs                         — Системные логи
/admin/settings                     — Настройки системы
/admin/updates                      — Обновления
/admin/monitoring                   — Мониторинг системы
```

### 4.10 Пациент (`patient`)

```
/patient/dashboard                  — Личный кабинет
/patient/booking                    — Онлайн-запись
/patient/appointments               — Мои записи
/patient/appointments/:id           — Детали записи
/patient/lab-results                — Результаты анализов
/patient/documents                  — Мои документы
/patient/chat                       — Чат с врачом
/patient/telemedicine/:sessionId    — Видеоконсультация
/patient/reviews                    — Отзывы
/patient/profile                    — Профиль
/patient/payments                   — История оплат
```

---

## 5. Интеграции

### 5.1 SMS-шлюз
- **Провайдеры:** Playmobile, SMS.uz, Eskiz
- **Использование:** напоминания о записи, коды 2FA, рассылки
- **API:** REST, webhook для статусов доставки

### 5.2 Платёжные системы
- **Провайдеры:** Payme, Click, Uzum Bank
- **Использование:** онлайн-оплата услуг, пополнение баланса
- **API:** redirect / webhook flow

### 5.3 Лабораторная информационная система (ЛИС)
- **Протокол:** HL7 FHIR / REST API
- **Использование:** отправка направлений, получение результатов
- **Синхронизация:** по расписанию + webhook

### 5.4 ЕГИСЗ (государственная система)
- **Протокол:** SOAP / REST
- **Использование:** передача данных о пациентах, отчётность
- **Безопасность:** сертификат ЭЦП

### 5.5 Email (SMTP)
- **Использование:** уведомления, приглашения, отчёты
- **Провайдеры:** собственный SMTP / SendGrid

### 5.6 Telegram Bot
- **Использование:** уведомления, запись, напоминания
- **API:** Telegram Bot API + Webhook

---

## 6. Бизнес-правила

### 6.1 Запись на приём
- Нельзя записать на занятый слот (врач/кабинет/пациент)
- Длительность приёма = длительность услуги (default 30 мин)
- Автоматическое напоминание за 24ч и 2ч (SMS)
- Онлайн-запись требует подтверждения рецепшеном (опционально)
- При no-show → пометка в карточке пациента
- Отмена менее чем за 2ч — предупреждение

### 6.2 Медицинские записи
- Черновик можно редактировать свободно
- После подписи — только через механизм amendment (с причиной)
- Подписанную запись нельзя удалить
- Доступ к ЭМК: врач (свои записи RW, чужие R), главврач (все RW), пациент (свои R)

### 6.3 Биллинг
- Счёт создаётся автоматически при завершении приёма
- Скидка не может превышать 100%
- Возврат только с подтверждением (кто, причина)
- ДМС: проверка покрытия перед оказанием услуги
- Касса: смена должна быть закрыта в конце дня

### 6.4 Зарплаты
- Расчёт: оклад + % от оказанных услуг за период
- Ведомость: Черновик → Утверждена → Выплачена
- Утверждает владелец или бухгалтер
- Процент и оклад настраиваются per role/per user

### 6.5 Безопасность
- Пароль: мин. 8 символов, цифра + спецсимвол
- Блокировка после 5 неудачных попыток входа (на 30 мин)
- Сессия: 15 мин access token + 30 дней refresh
- 2FA обязательна для: owner, accountant, sysadmin (настраиваемо)
- Все действия пишутся в аудит-лог
- Soft delete — данные не удаляются физически
- IP whitelist (опционально)

### 6.6 Мультифилиальность
- Каждый сотрудник привязан к филиалу (может быть несколько)
- Выбор филиала при входе
- Данные фильтруются по филиалу (если не owner/sysadmin)
- Пациент — глобальная сущность (не привязан к филиалу)

---

## 7. Нефункциональные требования

### 7.1 Производительность
- Время ответа API: < 200ms (95-й перцентиль)
- Время загрузки страницы: < 2 сек
- Поддержка до 100 одновременных пользователей
- Пагинация: default 20, max 100 записей

### 7.2 Безопасность
- HTTPS only
- JWT с ротацией refresh-токенов
- CORS whitelist
- Rate limiting (100 req/min per user)
- Input validation (class-validator)
- SQL injection protection (TypeORM параметризация)
- XSS protection (React escaping + CSP)
- Audit log всех действий

### 7.3 Доступность
- ARIA-атрибуты на всех интерактивных элементах
- Клавиатурная навигация
- Контрастность текста WCAG AA
- Screen reader совместимость

### 7.4 Локализация
- Русский (основной)
- Узбекский (переключение)
- i18next — все строки в JSON файлах
- Форматы: даты (DD.MM.YYYY), валюта (UZS), телефон (+998)

### 7.5 Надёжность
- Автоматические бэкапы (ежедневно)
- Graceful degradation при недоступности внешних сервисов
- Retry-политика для интеграций
- Мониторинг статуса сервисов

---

## 8. Структура базы данных — Сводная ER-диаграмма

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Branch     │────<│  Department  │────<│    Room      │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       │              ┌─────┴─────┐               │
       │              │           │               │
┌──────┴───────┐  ┌───┴──┐  ┌────┴────┐  ┌───────┴───────┐
│    User      │──│ Task │  │Schedule │  │  Appointment  │
│ (Staff)      │  └──────┘  │ Doctor  │  │               │
└──────────────┘            └─────────┘  └───────────────┘
  │    │    │                                │    │
  │    │    │         ┌──────────────┐       │    │
  │    │    └────────>│ AuditLog     │       │    │
  │    │              └──────────────┘       │    │
  │    │                                     │    │
  │    │    ┌───────────────┐                │    │
  │    └───>│ ChatMessage   │                │    │
  │         └───────────────┘                │    │
  │         ┌───────────────┐                │    │
  │         │ Notification  │                │    │
  │         └───────────────┘                │    │
  │                                          │    │
  │         ┌──────────────┐                 │    │
  └────────>│MedicalRecord │<────────────────┘    │
            └──────────────┘                      │
                 │    │                           │
            ┌────┘    └────┐                      │
            │              │                      │
     ┌──────┴───┐  ┌──────┴──────┐               │
     │Prescription│ │  Referral   │               │
     └──────────┘  └─────────────┘               │
                                                  │
┌──────────────┐     ┌──────────────┐            │
│   Patient    │────<│   Invoice    │<───────────┘
└──────────────┘     └──────────────┘
  │                       │
  │                  ┌────┴────┐
  │                  │         │
  │           ┌──────┴──┐ ┌───┴──────┐
  │           │InvItem  │ │ Payment  │
  │           └─────────┘ └──────────┘
  │
  │    ┌──────────────┐
  └───>│ VitalSigns   │
       └──────────────┘
  │
  │    ┌──────────────┐
  └───>│  Document    │
       └──────────────┘

┌──────────────────┐     ┌──────────────────┐
│InsuranceCompany  │────<│InsuranceRegistry │
└──────────────────┘     └──────────────────┘

┌──────────────┐     ┌──────────────────┐
│ Counterparty │────<│    Expense       │
└──────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│ InventoryItem    │────<│InventoryMovement │
└──────────────────┘     └──────────────────┘

┌──────────────┐
│ CashRegister │
└──────────────┘

┌──────────────┐
│ PayrollEntry │
└──────────────┘

┌──────────────────┐
│    Service       │
└──────────────────┘
```

---

## 9. Деплой

### 9.1 Development
```bash
docker-compose up -d          # PostgreSQL + Redis + MinIO
cd backend && npm run start:dev
cd frontend && npm run dev
```

### 9.2 Production
- **Вариант 1:** Docker Compose (single server)
- **Вариант 2:** Kubernetes (масштабирование)
- Nginx reverse proxy + SSL (Let's Encrypt)
- PostgreSQL managed (или replicated)
- Redis Sentinel (или managed)
- MinIO / S3 для файлов
- CI/CD: GitHub Actions → Docker build → Deploy

### 9.3 Переменные окружения
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=clinic_user
DB_PASSWORD=clinic_password
DB_DATABASE=clinic_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=clinic-files

# SMS Gateway
SMS_PROVIDER=playmobile
SMS_API_KEY=
SMS_SENDER_NAME=Clinic

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@clinic.uz

# Telegram
TELEGRAM_BOT_TOKEN=

# App
APP_URL=https://clinic.uz
APP_PORT=3000
FRONTEND_URL=https://clinic.uz
```

---

## 10. Фазы разработки

### Фаза 1 — MVP (Core)
- [x] Авторизация (login, JWT, роли)
- [x] Пациенты (CRUD, поиск)
- [x] Расписание (графики, запись, кабинеты)
- [x] ЭМК (базовая: осмотр, диагноз)
- [x] Биллинг (услуги, счета, оплата)
- [x] Чат (базовый)
- [x] Задачи (базовые)

### Фаза 2 — Расширение
- [ ] ДМС-расчёты (реестры, акты сверки)
- [ ] Зарплаты (расчёт, ведомости)
- [ ] Шаблоны осмотров
- [ ] Рецепты и направления
- [ ] Витальные показатели
- [ ] Документы (шаблоны, генерация PDF)
- [ ] SMS-уведомления
- [ ] Складской учёт

### Фаза 3 — Автоматизация
- [ ] Онлайн-запись (пациент)
- [ ] Личный кабинет пациента
- [ ] Телемедицина (видеоконсультации)
- [ ] Telegram-бот
- [ ] Маркетинг (рассылки, акции)
- [ ] Аналитика (расширенная)
- [ ] Конструктор отчётов

### Фаза 4 — Интеграции и масштабирование
- [ ] Интеграция с ЛИС
- [ ] Интеграция с ЕГИСЗ
- [ ] Платёжные системы (Payme, Click)
- [ ] Мультифилиальность (полная)
- [ ] Мобильное приложение (React Native)
- [ ] Мониторинг и алертинг
- [ ] Auto-бэкапы и восстановление
