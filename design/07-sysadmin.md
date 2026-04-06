# Администратор системы — Design Prompts (Stitch)

> Роль: Сисадмин. Управляет пользователями, ролями, интеграциями, бэкапами, логами, настройками, мониторингом.

---

## 7.1 Дашборд сисадмина

```
Разработайте современный, профессионально выглядящий интерфейс дашборда системного администратора МИС клиники. Веб-приложение, desktop-first, адаптивный дизайн.

Визуальный стиль:
- Технический dashboard мониторинга с data-dense компоновкой
- Цветовая схема: основной #1E40AF, фон #F8FAFC, онлайн #10B981, warning #F59E0B, error #EF4444, neutral #94A3B8
- Тёмная тема как переключаемая опция для серверной комнаты
- Типографика Inter для интерфейса, JetBrains Mono для технических метрик и числовых показателей
- Компактные отступы, максимальная информационная плотность

Макет и структура:
- Sidebar (collapsible 240px → 64px): Дашборд, Пользователи, Роли, Интеграции, Бэкапы, Логи, Настройки, Обновления, Мониторинг — иконки Lucide/Phosphor + текст
- Хедер (sticky, 56px): логотип МИС, глобальный поиск, уведомления колокольчик с badge, переключатель RU/UZ, тема light/dark toggle, аватар с dropdown
- KPI-карточки (4 в ряд): Uptime % (large число green с animated pulse dot), Активных пользователей онлайн (число + sparkline), CPU/RAM (dual gauge — circular progress), Ошибки за 24ч (число red + trend arrow)
- Виджет "Хранилище": горизонтальный segmented bar (БД / Файлы / Бэкапы / Свободно) с легендой и процентами
- Виджет "Статус сервисов" (table grid): PostgreSQL, Redis, MinIO, SMS-шлюз, Email SMTP — каждый: status dot (animated pulse green/static red), имя, uptime %, latency ms (colored: green <100ms, yellow <500ms, red >500ms), последний check timestamp
- Виджет "Активные пользователи" (compact table): ФИО, роль badge colored, IP mono, время входа relative, действие последнее
- Виджет "Alerts Timeline" (vertical timeline): timestamp mono, severity badge, сообщение, модуль badge — последние 20 событий, auto-scroll
- Quick Actions панель: кнопки "Создать бэкап", "Очистить кэш", "Перезапуск сервиса", "Выгрузить логи"

Элементы UI:
- Status dots с animated pulse для online-сервисов, static gray для offline
- CPU/RAM gauges — circular progress с градиентом (green → yellow → red по заполнению)
- Latency числа с цветовой кодировкой порогов
- Severity badges: DEBUG #94A3B8, INFO #3B82F6, WARN #F59E0B, ERROR #EF4444, CRITICAL #EF4444 с pulse
- Storage segmented bar с hover-tooltip на каждом сегменте
- KPI-карточки: белый фон, border-radius 12px, shadow 0 1px 3px rgba(0,0,0,0.08)

UX-аспекты:
- Real-time обновление через WebSocket, subtle flash при изменении значений
- Click на сервис → детальная страница мониторинга
- Click на ошибку в timeline → полный лог с контекстом
- Click на пользователя → карточка пользователя
- Auto-refresh каждые 10 секунд с индикатором последнего обновления

Брендинг:
- Логотип клиники в sidebar (полный в развёрнутом, иконка в свёрнутом)
- Единый визуальный язык мониторинга на всех виджетах

Доступность:
- Все status dots дублируются текстовым label (Онлайн/Офлайн)
- Gauges имеют числовое значение рядом с визуализацией
- Charts дублируются табличным представлением
- Контраст минимум 4.5:1 для всех текстов

Тренды:
- Terminal aesthetic для timeline логов
- Glassmorphism для KPI-карточек (backdrop-filter: blur)
- Animated status pulse dots
- Gradient circular gauges
- Мягкие тени вместо жёстких border
```

---

## 7.2 Управление пользователями

```
Разработайте современный, профессионально выглядящий интерфейс управления пользователями для системного администратора МИС клиники. Веб-приложение, desktop-first.

Визуальный стиль:
- Admin-panel CRUD дизайн, чистый и функциональный
- Цветовая схема: основной #1E40AF, фон #F8FAFC, активен #10B981, заблокирован #EF4444, warning #F59E0B
- Просторная таблица с чёткой визуальной иерархией
- Типографика Inter, email/логины моноширинным шрифтом
- Достаточное белое пространство между строками таблицы

Макет и структура:
- Хедер страницы: заголовок "Пользователи" + badge с общим количеством, справа — кнопки "+ Добавить пользователя" (primary), "Пригласить по email" (outlined), "Экспорт" (ghost, иконка download)
- Панель фильтров: поиск (ФИО, email, логин) с иконкой лупы, фильтры — Роль (multi-select dropdown: Владелец/Главврач/Врач/Медсестра/Рецепшен/Бухгалтер/Сисадмин), Филиал (dropdown), Отделение (dropdown), Статус (pills: Все/Активные/Заблокированные), 2FA (pills: Все/Включён/Выключен)
- DataTable с sticky header, sortable columns: checkbox select, Аватар (32px circle, initials fallback), ФИО (bold primary), Email (mono, gray), Роль (colored badge unique per role), Отделение, Филиал, Статус (badge: Активен green / Заблокирован red), Последний вход (relative time + tooltip exact datetime), 2FA badge (shield icon green если включён), Действия (три точки dropdown: Редактировать, Заблокировать/Разблокировать, Сбросить пароль, Удалить)
- Bulk actions toolbar (appears on checkbox select): "Заблокировать выбранных", "Экспорт выбранных", "Удалить выбранных"
- Пагинация: показ записей, page size selector, номера страниц

Элементы UI:
- Role badges с уникальным цветом: Владелец #7C3AED, Главврач #1E40AF, Врач #3B82F6, Медсестра #10B981, Рецепшен #F59E0B, Бухгалтер #6366F1, Сисадмин #EF4444
- Аватар circle с initials + случайный цвет фона на основе имени
- 2FA shield badge: зелёный если включён, серый если нет
- Status toggle при быстрой блокировке — switch с confirmation
- Hover на строке — подсветка фона + появление action кнопок
- Confirmation dialog для destructive actions (блокировка, удаление)

UX-аспекты:
- Поиск instant с debounce 300ms, подсветка найденных символов
- Блокировка/разблокировка через toggle с confirmation modal
- Сброс пароля — modal с опциями: автогенерация + отправить email/SMS, или задать вручную
- Bulk select + bulk operations для массовых действий
- Пригласить по email — modal с полем email + выбор роли, отправляет invite link
- Пустое состояние с иллюстрацией "Нет пользователей, соответствующих фильтрам"

Брендинг:
- Единый стиль badges и таблиц во всей МИС
- Role цвета согласованы на всех экранах системы

Доступность:
- Таблица с proper <th> headers и aria-sort
- Модальные окна с focus trap и Escape для закрытия
- Destructive actions требуют подтверждения, кнопки с aria-label
- Keyboard navigation по строкам таблицы

Тренды:
- Smooth modal transitions (scale + fade)
- Copy-to-clipboard animation (иконка → checkmark → обратно)
- Role badge с subtle gradient
- Skeleton loading при загрузке таблицы
```

---

## 7.3 Карточка пользователя

```
Разработайте современный, профессионально выглядящий интерфейс карточки пользователя для системного администратора МИС клиники. Веб-приложение, desktop-first.

Визуальный стиль:
- Детальный profile view с tab-навигацией
- Цветовая схема: основной #1E40AF, фон #F8FAFC, success #10B981, danger #EF4444, warning #F59E0B
- Чистая компоновка с карточками-секциями
- Типографика Inter, данные сессий моноширинным шрифтом

Макет и структура:
- Breadcrumb: Пользователи → ФИО пользователя
- Шапка карточки: аватар (64px), ФИО (h1), email mono, роль badge, статус badge (Активен/Заблокирован), кнопки справа — "Заблокировать" (outlined red), "Сбросить пароль" (outlined), "Сохранить" (primary)
- Tab-навигация (underline style): Профиль | Активность | Сессии | Права доступа
- Tab "Профиль": форма в 2 колонки — Фамилия, Имя, Отчество, Email, Телефон, Логин (readonly), Роль (select), Филиал (select), Отделение (select), 2FA toggle + QR-код если включаем, Язык интерфейса (RU/UZ), Аватар upload dropzone
- Tab "Активность": activity log timeline — дата/время mono, действие (Вход, Выход, Изменение данных, Создание записи...), IP-адрес mono, User-Agent, модуль. Фильтры: период, тип действия. Пагинация
- Tab "Сессии": таблица активных сессий — Устройство/Браузер (иконка + текст), IP-адрес mono, Местоположение geo, Начало сессии, Последняя активность, кнопка "Завершить" (red outlined) per row + "Завершить все кроме текущей" (button top)
- Tab "Права доступа": индивидуальные override-права поверх роли. Матрица как в 7.5, но с тремя состояниями checkbox: наследуется от роли (gray check), разрешено (green check), запрещено (red x). Legend вверху

Элементы UI:
- Аватар upload с drag-and-drop zone, preview, crop
- 2FA toggle с QR-кодом modal + backup codes list
- Activity timeline с иконками действий (login, logout, edit, create, delete)
- Session browser/device иконки (Chrome, Firefox, Safari, Mobile)
- Tri-state checkboxes для индивидуальных прав (inherit/allow/deny)
- Confirmation modal для завершения сессий

UX-аспекты:
- Unsaved changes warning при попытке уйти со страницы
- Inline validation для email, телефона
- Завершение сессии — мгновенное с confirmation
- Activity log с infinite scroll или пагинацией
- При смене роли — preview изменений прав

Брендинг:
- Аватар с fallback initials в цвете роли
- Консистентные badges на всех tabs

Доступность:
- Форма с proper labels и error messages
- Tabs с keyboard navigation (Arrow keys)
- Tri-state checkbox accessible с aria-checked="mixed"
- Activity log с semantic time elements

Тренды:
- Smooth tab transitions с slide animation
- Avatar upload с drag overlay animation
- Session terminate с fade-out row animation
- Subtle card hover effects
```

---

## 7.4 Список ролей

```
Разработайте современный, профессионально выглядящий интерфейс списка ролей для системного администратора МИС клиники. Веб-приложение, desktop-first.

Визуальный стиль:
- Карточный layout для ролей с чёткой визуальной иерархией
- Цветовая схема: основной #1E40AF, фон #F8FAFC, system role #94A3B8, custom role #10B981
- Разделение системных (предустановленных) и пользовательских ролей
- Типографика Inter, числа tabular-nums

Макет и структура:
- Хедер страницы: заголовок "Роли и права доступа", справа — кнопка "+ Создать роль" (primary)
- Секция "Системные роли" (label + divider): карточки в grid (3 в ряд) — Владелец, Главврач, Врач, Медсестра, Рецепшен, Бухгалтер, Сисадмин. Каждая карточка: иконка lock (locked), название bold, количество пользователей (число + иконка users), описание 1-2 строки gray, дата последнего изменения small, кнопка "Просмотр прав" (outlined). Lock badge "Системная" в углу карточки
- Секция "Пользовательские роли" (label + divider): аналогичные карточки но без lock. Кнопки: "Настроить права", "Редактировать", "Дублировать", "Удалить" (red, disabled если есть назначенные пользователи)
- Create/Edit modal: Название роли (input), Описание (textarea), Базировать на (dropdown с существующими ролями для копирования прав), кнопка "Создать и настроить права"
- Кнопка "Дублировать" — создаёт копию роли с суффиксом "(копия)" и открывает редактирование

Элементы UI:
- Role карточки: белый фон, border-radius 12px, shadow, hover — приподнимается (translateY -2px + shadow increase)
- Lock badge для системных ролей (серый, иконка замка)
- Users count badge с иконкой группы
- Confirmation dialog при удалении custom роли
- Empty state для пользовательских ролей: "Создайте первую пользовательскую роль"

UX-аспекты:
- Системные роли — только просмотр, нельзя удалить/переименовать
- Custom роли — полное CRUD
- Дублирование роли — быстрый способ создать вариацию
- Удаление доступно только если нет назначенных пользователей, иначе tooltip с объяснением
- Click "Просмотр прав" / "Настроить права" → переход к матрице 7.5

Брендинг:
- Цвет карточек соответствует цвету роли из badges
- Единый стиль карточек во всей системе

Доступность:
- Карточки кликабельные с focus outline
- Lock status объявляется screen reader
- Grid карточек navigable keyboard
- Disabled кнопки с aria-disabled и tooltip причины

Тренды:
- Card hover lift animation (translateY + shadow)
- Smooth modal enter/exit transitions
- Subtle gradient border на hover
- Skeleton cards при загрузке
```

---

## 7.5 Матрица прав роли

```
Разработайте современный, профессионально выглядящий интерфейс матрицы прав доступа роли для системного администратора МИС клиники. Веб-приложение, desktop-first.

Визуальный стиль:
- Matrix/grid дизайн, чёткая табличная структура
- Цветовая схема: основной #1E40AF, granted #10B981, denied #EF4444, фон #F8FAFC
- Компактный layout для максимального количества данных на экране
- Типографика Inter compact (13-14px), чёткие заголовки строк и колонок

Макет и структура:
- Хедер: breadcrumb "Роли → [Название роли]", название роли (h1) + badge "Системная"/"Пользовательская", количество пользователей, кнопки справа — "Сохранить" (primary), "Сбросить изменения" (outlined), "Отмена" (ghost)
- Unsaved changes indicator (orange dot рядом с "Сохранить")
- Матрица прав — large table с sticky header и sticky first column:
  - Колонки: Модуль/Раздел (sticky left), Просмотр, Создание, Редактирование, Удаление, Экспорт — заголовки с "Выбрать всё" checkbox в каждой колонке
  - Строки — модули (collapsible groups с chevron):
    - Пациенты (→ Список, Карточка, Редактирование, Документы)
    - Расписание (→ Просмотр, Управление слотами, Запись пациентов)
    - Приёмы (→ Список, Протоколы, Назначения)
    - Финансы (→ Касса, Отчёты, ДМС, Зарплаты)
    - Склад (→ Остатки, Приход, Расход, Инвентаризация)
    - Персонал (→ Список, Графики, Документы)
    - Отчёты (→ Медицинские, Финансовые, Аналитика)
    - Настройки (→ Клиника, Справочники, Шаблоны)
    - Администрирование (→ Пользователи, Роли, Логи, Бэкапы)
  - Checkbox на пересечении строки и колонки
  - "Выбрать всё" в строке (иконка checkbox в конце строки модуля)
- Sidebar preview (optional): при hover на строке — текстовое описание "Что даёт это право"

Элементы UI:
- Custom checkboxes: checked — green с white check, unchecked — gray border, indeterminate — dash (для group когда часть подпунктов выбрана)
- Collapsible groups с chevron + animated expand/collapse
- "Select all" per row — checkbox в заголовке группы, при клике выбирает все sub-items × все permissions
- "Select all" per column — checkbox в заголовке колонки, при клике выбирает все modules × this permission
- Sticky header с тенью при скролле
- Sticky first column с тенью при горизонтальном скролле
- Changed cells highlight (subtle yellow background до сохранения)

UX-аспекты:
- Group expand/collapse с анимацией
- Quick toggle: клик на checkbox группы — toggles all children
- Quick toggle column: клик на header checkbox — toggles all rows
- Changed permissions подсвечены yellow до сохранения
- Сохранение — confirmation modal с summary изменений (добавлено N прав, убрано M прав)
- Сбросить — возвращает к сохранённому состоянию
- Для системных ролей — readonly mode, все checkboxes disabled

Брендинг:
- Цвет заголовка роли соответствует role badge color
- Единый стиль checkboxes во всей системе

Доступность:
- Каждый checkbox имеет aria-label "[Модуль] — [Действие]"
- Groups navigable с keyboard (Enter expand/collapse)
- Indeterminate state объявляется screen reader
- Tab navigation по всем checkboxes
- Высокий контраст для checked/unchecked состояний

Тренды:
- Custom checkbox styling (green check animation on toggle)
- Smooth group expand/collapse с height transition
- Sticky header/column с box-shadow при скролле
- Subtle cell highlight animation при изменении
```

---

## 7.6 Интеграции

```
Разработайте современный, профессионально выглядящий интерфейс управления интеграциями для системного администратора МИС клиники. Веб-приложение, desktop-first.

Визуальный стиль:
- Integration marketplace дизайн с карточками сервисов
- Цветовая схема: основной #1E40AF, фон #F8FAFC, connected #10B981, disconnected #94A3B8, error #EF4444
- Карточки с логотипами/иконками внешних сервисов
- Типографика Inter, subtle brand colors каждого сервиса

Макет и структура:
- Хедер страницы: заголовок "Интеграции", badge с количеством активных, справа — фильтры status pills (Все / Подключены / Не настроены / Ошибка)
- Grid карточек интеграций (3 в ряд), каждая карточка содержит:
  - SMS-шлюз (Playmobile/SMS.uz): логотип 40px, название, статус badge (Подключён green / Не настроен gray / Ошибка red), баланс (если подключён), последняя отправка relative time
  - Платёжная система (Payme/Click/Uzum): логотип, статус, Merchant ID masked, последняя транзакция
  - Лабораторная ИС (ЛИС): иконка microscope, статус, URL API truncated, последняя синхронизация + количество
  - ЕГИСЗ: иконка government, статус, сертификат (срок + warning если <30 дней), последняя отправка
  - Email SMTP: иконка mail, статус, сервер:порт, последнее письмо
  - Telegram Bot: иконка telegram, статус, bot username, подписчиков число
- Каждая карточка: логотип/иконка, название bold, описание 1 строка gray, статус badge, key metric, кнопка "Настроить" (outlined) → переход к 7.7
- Подключённые карточки — subtle green left border, ошибка — red left border

Элементы UI:
- Service карточки: белый фон, border-radius 12px, shadow, left border 3px colored by status
- Status badges: Подключён (green dot + text), Не настроен (gray dot + text), Ошибка (red dot + text, pulsing)
- Last sync timestamp с relative time + tooltip exact
- Masked sensitive data (API keys, tokens) с •••• и кнопками show/copy
- Hover на карточке — slight elevation + shadow increase

UX-аспекты:
- Click карточка → страница настройки интеграции (7.7)
- Быстрый тест прямо из карточки — кнопка "Тест" с inline result (check green / x red)
- Error карточки — expandable error message при hover
- Certificate expiry — yellow warning badge если <30 дней, red если <7 дней
- Empty state: "Настройте первую интеграцию для расширения возможностей МИС"

Брендинг:
- Логотипы внешних сервисов в оригинальных цветах
- Subtle brand color accent на карточке каждого сервиса

Доступность:
- Статусы дублируются текстом помимо цвета
- Карточки кликабельные с focus outline
- Masked data accessible через toggle show
- Screen reader объявляет статус при фокусе на карточке

Тренды:
- Card hover lift animation
- Status badge pulse для error
- Integration cards с subtle service brand color tint
- Glassmorphism на status overlay
```

---

## 7.7 Настройка интеграции

```
Разработайте современный, профессионально выглядящий интерфейс настройки конкретной интеграции для системного администратора МИС клиники. Веб-приложение, desktop-first.

Визуальный стиль:
- Detail/config page с формами и мониторингом
- Цветовая схема: основной #1E40AF, фон #F8FAFC, success #10B981, error #EF4444, warning #F59E0B
- Разделение на секции: настройки, тестирование, мониторинг
- Типографика Inter, API URLs и ключи моноширинным шрифтом

Макет и структура:
- Breadcrumb: Интеграции → [Название сервиса]
- Шапка: логотип сервиса (48px) + название (h1) + статус badge, справа — toggle "Включена/Выключена" (крупный switch), кнопка "Сохранить" (primary)
- Секция "Подключение" (card): форма — API URL (input mono), API Key (input masked + show/copy), Secret Key (input masked), дополнительные поля зависят от типа интеграции (Merchant ID, Webhook URL auto-generated readonly + copy, сертификат upload для ЕГИСЗ)
- Секция "Тестирование" (card): кнопка "Тест подключения" (outlined) → inline результат: loading spinner → success (green check + "Подключение успешно, latency 45ms") или error (red x + error message expandable + suggestion). Для SMS — поле "Тестовый номер" + "Отправить тест". Для Email — поле "Тестовый адрес" + "Отправить тест"
- Секция "Последние вызовы API" (card): DataTable — Дата/время mono, Метод (GET/POST badge), Endpoint truncated, Статус HTTP (200 green, 4xx yellow, 5xx red badge), Время ответа ms, expandable → request/response body
- Секция "Статистика ошибок" (card): line chart — error rate за 7 дней (red line), success rate (green line). Ниже — краткая сводка: всего запросов, успешных %, среднее время ответа
- Секция "Webhooks" (card, если применимо): список зарегистрированных webhooks — URL, события, статус, последний вызов, кнопки edit/delete. Кнопка "+ Добавить webhook"

Элементы UI:
- Enable/disable — крупный toggle switch с цветовым feedback (green/gray)
- Masked fields с eye toggle + copy button
- Test button с state machine: idle → loading (spinner) → success (check) → idle / error (x + message)
- HTTP status badges: 2xx green, 4xx yellow, 5xx red
- API call log expandable rows с formatted JSON (syntax highlighted)
- Error rate chart с красной зоной threshold line
- Webhook URL input с auto-generate button

UX-аспекты:
- Test connection перед сохранением — рекомендация "Протестируйте перед сохранением"
- Unsaved changes warning при уходе со страницы
- API log real-time обновление (toggle auto-refresh)
- Error details с actionable suggestions ("Проверьте API ключ", "Сервер недоступен")
- Webhook secret auto-generated с copy

Брендинг:
- Логотип сервиса в шапке в оригинальных цветах
- Единый стиль форм и таблиц из дизайн-системы

Доступность:
- Форма с proper labels и aria-describedby для hints
- Test result announced via aria-live region
- Masked fields accessible с toggle
- JSON в log readable через structured view alternative

Тренды:
- Test button state animation (spinner → check/x morph)
- JSON syntax highlighting в expandable rows
- Glassmorphism для test result card
- Smooth chart animations при загрузке данных
```

---

## 7.8 Бэкапы

```
Разработайте современный, профессионально выглядящий интерфейс управления резервным копированием для системного администратора МИС клиники. Веб-приложение, desktop-first.

Визуальный стиль:
- Серьёзный, safety-oriented дизайн с акцентом на критичность данных
- Цветовая схема: основной #1E40AF, фон #F8FAFC, success #10B981, danger #EF4444, warning #F59E0B
- Чёткие visual warnings для деструктивных операций
- Типографика Inter, даты и размеры файлов моноширинным

Макет и структура:
- Хедер страницы: заголовок "Резервное копирование", справа — кнопка "Создать бэкап" (primary, иконка download-cloud)
- Карточка "Хранилище" (top): segmented progress bar (Использовано / Свободно), числа: "45.2 GB из 100 GB", warning если >80%, critical если >90%. Тип хранилища: Local/S3/MinIO badge
- Карточка "Расписание" (top, рядом): текущее расписание — тип (Ежедневно/Еженедельно/Ежемесячно), время, хранить последних N копий, следующий запуск datetime, toggle Активно. Кнопка "Изменить расписание" → modal с cron-like builder (select: период, день недели, время, retention count)
- DataTable "История бэкапов": Дата/время (mono, sortable), Размер файла (mono), Тип badge (Авто — blue, Ручной — purple), Статус badge (Успешно green, В процессе blue spinner, Ошибка red, Удалён gray), Примечание (auto: "Плановый", manual: user comment), Действия dropdown — Скачать, Восстановить (danger), Удалить (danger)
- Кнопка "Создать бэкап" → modal: тип (Полный / Только БД / Только файлы radio), Примечание (textarea optional), кнопка "Начать" → progress bar inline в таблице
- "Восстановить" → danger modal: красная border, warning иконка triangle, текст "ВНИМАНИЕ: Все текущие данные будут заменены данными из бэкапа от [дата]!", input "Введите RESTORE для подтверждения", кнопка "Восстановить" (red, disabled пока не введено RESTORE)
- "Удалить" → confirmation modal: "Удалить бэкап от [дата]? Это действие необратимо."

Элементы UI:
- Storage progress bar: segmented (green <60%, yellow 60-80%, red >80%)
- Schedule cron builder с human-readable preview ("Каждый день в 03:00, хранить 30 копий")
- Type badges: Авто (blue outlined), Ручной (purple outlined)
- Status badges: Успешно (green solid), В процессе (blue + spinner), Ошибка (red solid + expandable message)
- Progress bar inline для текущего бэкапа (striped animated)
- Danger modal с red border, warning icon, confirmation text input
- File size formatting (KB/MB/GB auto)

UX-аспекты:
- Создание бэкапа показывает real-time progress в таблице
- Восстановление требует явного ввода RESTORE — защита от случайного клика
- Удаление требует confirmation modal
- Ошибки — expandable с полным error message и suggestion
- Schedule toggle — instant enable/disable с confirmation
- Auto-scroll к новому бэкапу в процессе создания

Брендинг:
- Warning стиль единый во всей системе (red border + triangle icon)
- Badge стиль консистентный с другими модулями

Доступность:
- Danger warnings с role="alert"
- Confirmation input с clear instructions и aria-describedby
- Progress bar с aria-valuenow/valuemin/valuemax
- Status badges с sr-only text дополнительно к цвету

Тренды:
- Animated striped progress bar при создании бэкапа
- Red glow/pulse на danger modal border
- Smooth table row insertion при появлении нового бэкапа
- Storage bar gradient transition
```

---

## 7.9 Системные логи

```
Разработайте современный, профессионально выглядящий интерфейс системных логов для системного администратора МИС клиники. Веб-приложение, desktop-first.

Визуальный стиль:
- Terminal-inspired лог-просмотрщик, профессиональный и технический
- Цветовая схема: основной #1E40AF, фон #F8FAFC (light mode) / #0F172A (dark/terminal mode), severity colors — DEBUG #94A3B8, INFO #3B82F6, WARN #F59E0B, ERROR #EF4444, CRITICAL #EF4444 с pulse
- Моноширинный шрифт JetBrains Mono для лог-записей, Inter для UI-контролов
- Компактные строки (28-32px height) для максимальной плотности

Макет и структура:
- Хедер страницы: заголовок "Системные логи", справа — toggle "Real-time" (с recording dot pulse красный когда активен), кнопки "Пауза/Продолжить" (outlined), "Экспорт" (ghost, dropdown: JSON/CSV/TXT)
- Панель фильтров (collapsible): Период (date-range picker), Уровень (multi-select pills: DEBUG/INFO/WARN/ERROR/CRITICAL — каждый в своём цвете), Модуль (multi-select dropdown: Auth, API, Database, Storage, SMS, Email, Scheduler, Backup...), Текстовый поиск (input с regex toggle), кнопка "Применить" + "Сбросить фильтры"
- Toggle вид: Structured | Raw terminal
- Structured view: DataTable с sticky header — Timestamp (mono, gray, sortable), Уровень (colored badge compact), Модуль (gray badge), Сообщение (truncated, expandable), Пользователь (если есть). Expandable row → полный текст + stack trace (mono, indented, syntax highlighted) + request context (URL, method, params)
- Raw terminal view: тёмный фон (#0F172A), моноширинный текст, каждая строка окрашена по severity, auto-scroll to bottom, scrollbar custom styled. Формат: [2024-01-15 14:32:01.234] [ERROR] [Auth] Failed login attempt for user admin@clinic.uz
- Real-time stream: новые записи появляются снизу с fade-in, auto-scroll (отключается при ручном скролле вверх, кнопка "↓ Новые записи" для возврата)
- Счётчик записей в footer: "Показано 1,234 из 56,789 записей"

Элементы UI:
- Severity badges compact: DEBUG (gray, smallest), INFO (blue), WARN (yellow), ERROR (red), CRITICAL (red + pulse glow)
- Module badges (gray outlined, compact)
- Recording indicator: красная точка с pulse animation когда real-time включён
- Pause/Resume кнопка с иконкой (pause bars / play triangle)
- Stack trace expandable: mono font, indented, линии ошибки подсвечены red background
- Search highlight: найденные символы подсвечены жёлтым фоном
- "New entries" floating button при скролле вверх

UX-аспекты:
- Real-time streaming через WebSocket с toggle on/off
- Pause замораживает поток, Resume продолжает с пропущенных
- Auto-scroll отключается при ручном скролле вверх, "↓ N новых записей" badge для возврата
- Search с regex поддержкой, instant highlight
- Click на ERROR/CRITICAL → auto-expand stack trace
- Фильтры сохраняются в URL query params для sharing
- Export экспортирует отфильтрованные результаты

Брендинг:
- Terminal view стилизован под профессиональную консоль
- Severity цвета единые во всей МИС

Доступность:
- Severity levels с text label помимо цвета
- Stack trace structured для screen reader
- Real-time updates объявляются через aria-live polite (не каждое, батчами)
- Pause/Resume с aria-pressed state
- Keyboard: Enter для expand/collapse строки

Тренды:
- Terminal aesthetic (monospace, dark bg, colored text)
- Recording dot pulse animation (CSS keyframes)
- Smooth log entry appear animation (fade-in slide-up)
- Custom scrollbar styling в terminal view
- Search highlight animation
```

---

## 7.10 Настройки системы

```
Разработайте современный, профессионально выглядящий интерфейс системных настроек для системного администратора МИС клиники. Веб-приложение, desktop-first.

Визуальный стиль:
- Structured settings дизайн с tab-секциями
- Цветовая схема: основной #1E40AF, фон #F8FAFC, success #10B981, danger #EF4444, warning #F59E0B
- Формы с чёткими секциями и labels
- Типографика Inter, моноширинный для технических полей (IP, порты, пути)

Макет и структура:
- Хедер страницы: заголовок "Настройки системы", справа — кнопка "Сохранить" (primary, sticky при скролле), индикатор unsaved changes (orange dot)
- Tab-навигация (vertical tabs слева или horizontal top): Общие | Безопасность | Хранилище | Email | Региональные
- Tab "Общие" (card sections):
  - Информация о клинике: Название (input), Юридическое название (input), ИНН (input), Адрес (textarea), Телефон (input), Website (input), Логотип (upload + preview)
  - Системные: Часовой пояс (select: Asia/Tashkent default), Валюта (select: UZS/USD), Формат даты (select: DD.MM.YYYY), Рабочие часы (time range picker)
- Tab "Безопасность" (card sections):
  - Политика паролей: Минимальная длина (number input, min 8), Требования (checkboxes: заглавные буквы, цифры, спецсимволы), Срок действия (days, 0 = бессрочно), История паролей (число — нельзя повторять последних N)
  - Сессии: Время жизни сессии (minutes select), Максимум одновременных сессий (number), Auto-logout при неактивности (minutes)
  - Блокировка: Максимум попыток входа (number), Время блокировки (minutes), Уведомить админа (toggle)
  - IP Whitelist: tag input — добавление IP/CIDR, список с кнопками удаления, toggle "Только с разрешённых IP"
  - 2FA: Обязательная для ролей (checkboxes per role), Методы (checkboxes: TOTP, SMS)
- Tab "Хранилище" (card sections):
  - Провайдер: radio (Local / MinIO / S3), connection fields per type
  - Лимиты: Макс. размер файла (MB input), Макс. размер аватара (MB input)
  - Допустимые типы: tag input (.pdf, .jpg, .png, .dcm...)
  - Использование: progress bar с breakdown (Документы / Снимки / Бэкапы / Прочее), числа GB
- Tab "Email" (card):
  - SMTP настройки: Сервер (input mono), Порт (input number), Шифрование (select: None/TLS/SSL), Логин (input), Пароль (input masked), От кого — имя (input), От кого — email (input)
  - Кнопка "Тест отправки" → input email + send → inline result (success green / error red с деталями)
- Tab "Региональные" (card sections):
  - Язык по умолчанию: select (Русский / Ўзбекча)
  - Доступные языки: checkboxes
  - Форматы: Дата, Время (12/24h), Числа (разделители), Валюта (формат отображения)
  - Часовой пояс отображения (linked с Общие)

Элементы UI:
- Vertical/horizontal tabs с active indicator
- Form fields с clear labels, hint text, validation messages
- Tag input для IP whitelist и file types (chips с x кнопкой)
- Storage progress bar segmented с color legend
- Password policy preview: "Пример: Abc123!@" — динамически обновляется при изменении правил
- SMTP test button с inline result (spinner → check/x)
- Logo upload с preview и crop
- Number inputs с +/- steppers

UX-аспекты:
- Unsaved changes tracking — warning при попытке уйти, orange indicator
- Inline validation для всех полей (email format, IP format, port range)
- Test SMTP перед сохранением — рекомендация
- Password policy preview обновляется в реальном времени
- Storage warning при приближении к лимиту
- Tab switching сохраняет unsaved данные в памяти

Брендинг:
- Логотип клиники preview при upload
- Единый стиль форм и карточек

Доступность:
- Все fields с <label> и aria-describedby для hints
- Tag inputs accessible с keyboard (Backspace удаляет последний)
- Validation errors связаны с полями через aria-errormessage
- Tabs с keyboard navigation (Arrow keys)
- Progress bar с числовыми значениями для screen reader

Тренды:
- Soft card shadows для секций
- Smooth tab switch transition
- Inline validation animation (shake on error)
- Tag chips с smooth add/remove animation
```

---

## 7.11 Обновления системы

```
Разработайте современный, профессионально выглядящий интерфейс управления обновлениями для системного администратора МИС клиники. Веб-приложение, desktop-first.

Визуальный стиль:
- Release-notes стиль, информативный и чёткий
- Цветовая схема: основной #1E40AF, фон #F8FAFC, new version #10B981, current #3B82F6, breaking #EF4444, warning #F59E0B
- Markdown-rendered changelog, чистые карточки
- Типографика Inter, версии моноширинным шрифтом

Макет и структура:
- Хедер страницы: заголовок "Обновления системы", справа — toggle "Авто-обновление" (с tooltip: "Автоматически устанавливать minor-обновления")
- Карточка "Текущая версия" (top left): номер версии large bold mono (v2.4.1), дата установки, uptime с момента обновления, кнопка "Changelog" (outlined) → expand inline
- Карточка "Доступное обновление" (top right, выделена если есть): новая версия badge (green, bold mono), тип обновления badge (Patch green / Minor blue / Major orange), дата релиза, release notes (markdown rendered — features, fixes, improvements списками), Breaking changes warning (если есть — красный блок с иконкой warning + список изменений), кнопки: "Обновить сейчас" (primary), "Напомнить позже" (ghost). Warning banner: "Рекомендуем создать бэкап перед обновлением" + link "Создать бэкап →"
- Если нет обновлений — карточка "Система актуальна" с green checkmark и текстом "Последняя проверка: [datetime]", кнопка "Проверить обновления"
- DataTable "История обновлений": Версия (mono, bold), Дата установки, Тип badge (Patch/Minor/Major), Статус badge (Успешно green / Ошибка red / Откат yellow), Установил (user), expandable → changelog markdown
- Update process modal: steps progress (Создание бэкапа → Скачивание → Установка → Миграция БД → Проверка → Готово), progress bar, log output (terminal-like), кнопки "Отмена" (если возможно) / "Закрыть"

Элементы UI:
- Version badges: mono font, colored border (current blue, available green)
- Update type badges: Patch (green small), Minor (blue), Major (orange bold)
- Breaking changes alert: red bg card с warning triangle, bordered
- Markdown renderer: headers, lists, code blocks, bold/italic
- Progress stepper: numbered steps с active/completed/pending states
- Terminal-like log output в update modal (dark bg, mono, auto-scroll)
- Auto-update toggle с description tooltip

UX-аспекты:
- One-click update с progress tracking
- Backup reminder с прямой ссылкой на создание бэкапа
- Breaking changes — явно highlighted, требуют acknowledge checkbox перед обновлением
- Update modal нельзя закрыть во время процесса (только после завершения)
- Откат: если обновление failed — кнопка "Откатить к предыдущей версии"
- Changelog readable и structured (features, fixes, improvements)
- Auto-update — только для patch, minor требует manual confirm

Брендинг:
- Version badge стиль единый в системе
- Release notes стилизованы под docs-like reading experience

Доступность:
- Version info accessible с proper headings
- Update progress announced через aria-live
- Breaking changes с role="alert"
- Changelog structured с proper heading levels
- Modal с focus trap во время обновления

Тренды:
- Timeline с gradient connector для истории
- Step progress animation (check appear на каждом шаге)
- Glassmorphism на карточке доступного обновления
- Terminal log auto-scroll в update modal
- Markdown typography с хорошим vertical rhythm
```

---

## 7.12 Мониторинг

```
Разработайте современный, профессионально выглядящий интерфейс мониторинга системы для системного администратора МИС клиники. Веб-приложение, desktop-first.

Визуальный стиль:
- Ops/DevOps monitoring dashboard, data-intensive
- Цветовая схема: основной #1E40AF, фон #F8FAFC, healthy #10B981, warning #F59E0B, critical #EF4444, neutral #94A3B8
- Графики и метрики в реальном времени
- Типографика Inter для UI, JetBrains Mono для метрик и числовых данных
- Тёмная тема опционально для NOC/мониторинг-стенда

Макет и структура:
- Хедер страницы: заголовок "Мониторинг", справа — period selector (pills: 1ч / 6ч / 24ч / 7д / 30д), auto-refresh indicator ("Обновлено 5 сек назад"), кнопка "Настроить алерты" (outlined)
- Секция "Ресурсы сервера" (3 карточки в ряд):
  - CPU: real-time area chart (last period), текущая загрузка % (large number), min/max/avg за период, цвет зоны (green <60%, yellow 60-80%, red >80%)
  - RAM: real-time area chart, использовано/всего (GB), swap usage, breakdown (приложение / кэш / система)
  - Диск: donut chart (used/free), read/write IOPS line chart, breakdown по mount points
- Секция "Здоровье сервисов" (DataTable card): Сервис (иконка + имя), Статус (dot green/yellow/red + text), Uptime % (colored: green >99.9%, yellow >99%, red <99%), Время отклика (ms, colored thresholds), Ошибки за период (число, red if >0), Последний рестарт (datetime relative), Действия: "Рестарт" (outlined red, confirmation required)
  - Сервисы: API Backend, PostgreSQL, Redis, MinIO, Nginx, SMS Worker, Email Worker, Scheduler
- Секция "База данных" (card с sub-metrics):
  - Активные подключения: gauge (current / max pool), line chart за период
  - Запросы/сек: line chart, текущее число large
  - Медленные запросы (>1s): таблица последних — Query (mono truncated, expandable), Duration ms (red), Timestamp, кнопка "EXPLAIN"
  - Размер БД: число GB + growth trend
- Секция "WebSocket подключения" (card):
  - Текущие активные: число large + line chart за период
  - Breakdown по типу: Админы / Врачи / Рецепшен (stacked area chart)
  - Reconnects count + error rate
- Секция "Настройка алертов" (expandable card / modal):
  - Таблица правил: Метрика (CPU/RAM/Disk/Response time/Error rate), Условие (> / < / =), Порог (number input), Длительность (minutes — alert если превышено N минут), Канал (checkboxes: Email / Telegram / SMS / Dashboard), Активен toggle
  - Кнопка "+ Добавить правило"
  - История срабатываний: timeline — дата, метрика, значение, порог, статус (Сработал / Resolved)

Элементы UI:
- Real-time area charts с gradient fill (green → yellow → red зоны), tooltip при hover
- Gauge дуговые для CPU/RAM/connections с анимацией заполнения
- Service status dots: green animated pulse / yellow static / red pulse
- Uptime percentage с color coding (99.99% green bold, 99.5% yellow, <99% red bold)
- Response time sparklines в таблице сервисов
- Slow query expandable row с mono formatted SQL
- Alert rule row с inline editing (click to edit threshold)
- Auto-refresh countdown indicator (circular progress mini)

UX-аспекты:
- Real-time обновление через WebSocket, индикатор последнего обновления
- Period selection мгновенно перестраивает все графики
- Hover на chart показывает точные значения в tooltip
- Click на сервис → drill-down с детальными метриками
- Slow queries — click "EXPLAIN" → modal с query plan
- Service restart — confirmation modal с warning "Пользователи могут потерять подключение"
- Alert thresholds визуализируются как horizontal line на соответствующих charts
- Responsive: на мониторинг-стенде — full-width без sidebar

Брендинг:
- Monitoring стиль единый с дашбордом (7.1)
- Service иконки из Lucide/Phosphor consistent set

Доступность:
- Все charts дублируются числовыми значениями рядом
- Status с text + color для screen reader
- Gauges с aria-valuenow
- Alert sounds опциональны, всегда с visual indicator
- Tables с proper headers и sortable columns accessible

Тренды:
- Real-time chart animations (smooth line drawing)
- Gauge fill animation при загрузке
- Service status pulse animations
- Threshold lines на графиках с glow при приближении
- Dark mode optimized для мониторинг-стендов
- Glassmorphism overlay на alert notifications
```
