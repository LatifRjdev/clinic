# Пациент — Design Prompts (Stitch)

> Роль: Пациент. Mobile-first интерфейс: записывается онлайн, управляет приёмами, просматривает результаты анализов, общается с врачом, оплачивает услуги.
> Платформа: веб, мобильный приоритет (телефоны), адаптив на десктоп.
> Навигация: bottom tab bar (4–5 вкладок), top app bar (назад/заголовок/действия).

---

## 6.1 Персональный дашборд пациента

```
Разработайте современный, профессионально выглядящий интерфейс персонального дашборда пациента в мобильном приложении клиники. Mobile-first дизайн с bottom tab navigation.

Визуальный стиль:
- Тёплый, приветливый, app-like дизайн, вызывающий доверие и спокойствие
- Цветовая схема: основной #1E40AF (глубокий синий), фон #F8FAFC (светло-серый), акцент #10B981 (зелёный для CTA и позитивных статусов), предупреждения #F59E0B (жёлтый), ошибки #EF4444 (красный)
- Много воздуха между блоками, мягкие тени (shadow-sm) на карточках, скругления 12–16px
- Типографика Inter: приветствие 24px semibold, заголовки секций 18px semibold, body 15px regular, caption 13px medium muted
- Иконки Lucide/Phosphor, stroke 1.5px, размер 24px в быстрых действиях

Макет и структура:
- Top app bar: слева логотип клиники (компактный, 32px), справа иконка уведомлений (bell) с красным badge счётчиком непрочитанных, аватар пациента (circle 36px, tap → профиль)
- Приветствие: "Здравствуйте, {Имя}!" (24px semibold, #1E293B), под ним текущая дата "Пятница, 28 марта" (13px, #64748B)
- Блок "Ближайший приём" — prominent карточка (белый фон, border-left 4px #1E40AF, shadow-md, padding 16px, border-radius 16px): дата и время крупно (18px bold, #1E40AF), фото врача (circle 56px) + ФИО (16px semibold) + специальность (13px muted), название услуги (14px), адрес филиала клиники с иконкой map-pin (13px muted). Внизу карточки три кнопки в ряд: "Перенести" (ghost, иконка calendar), "Отменить" (ghost red, иконка x-circle), "Маршрут" (ghost, иконка navigation, открывает карту). Если нет предстоящих — карточка-плейсхолдер "Нет предстоящих записей" с кнопкой "Записаться"
- Быстрые действия — сетка 2×2 (gap 12px, карточки 1:1 aspect ratio не обязателен, min-height 88px): каждая карточка содержит цветную иконку в circle (40px), название действия (14px semibold). Четыре карточки: "Записаться" (calendar-plus, circle bg #DBEAFE, иконка #1E40AF), "Мои результаты" (clipboard-list, circle bg #D1FAE5, иконка #10B981), "Написать врачу" (message-circle, circle bg #EDE9FE, иконка #7C3AED), "Документы" (folder, circle bg #FEF3C7, иконка #F59E0B)
- Лента последних событий — секция "Последние события" (18px semibold), вертикальный список (3–5 элементов): каждый элемент — иконка слева (16px) + текст (14px) + время/дата справа (12px muted). Примеры: зелёная точка "Результаты анализов готовы", синяя точка "Приём у терапевта 25 марта", жёлтая точка "Напоминание: приём завтра в 10:00". Tap на элемент → переход в соответствующий раздел

- Bottom tab bar (fixed, 5 вкладок): Главная (home), Записи (calendar), Результаты (clipboard), Чат (message-circle), Профиль (user). Активная вкладка — иконка #1E40AF + label bold, неактивные — #94A3B8

Элементы UI:
- Prominent appointment card с left border accent и doctor photo
- Quick action grid cards с colored icon circles (40px) и tap ripple effect
- Activity feed items с цветными dot-индикаторами и timestamps
- Notification bell badge (красный circle 18px, белый текст 11px bold)
- Bottom tab bar с 5 иконками + labels, safe area padding на iPhone
- Pull-to-refresh индикатор (circular spinner #1E40AF)

UX-аспекты:
- Дашборд загружается первым после авторизации, вся ключевая информация видна без скролла (above the fold на типичном телефоне 390×844)
- Tap на карточку приёма → переход в детали приёма (6.4)
- Tap на быстрое действие → мгновенный переход без промежуточных экранов
- Pull-to-refresh для обновления данных
- Лента событий кликабельна — каждый элемент ведёт в контекст (результаты, приём, документ)
- Если пациент новый (нет приёмов) — вместо карточки приёма показывается welcome-блок с CTA "Запишитесь на первый приём"
- Skeleton loading: при загрузке показываются серые плейсхолдеры карточек с пульсирующей анимацией

Брендинг:
- Логотип клиники в top app bar (компактная версия, monochrome или цветная)
- Фирменный синий #1E40AF как accent во всех ключевых элементах
- Единый стиль карточек (white bg, rounded-2xl, shadow-sm) по всему приложению
- Иконки Lucide consistent stroke width 1.5px

Доступность:
- Bottom tab bar с текстовыми labels под иконками (не только иконки)
- Все карточки имеют role="button" и aria-label с описанием действия
- Контраст текста на карточках минимум 4.5:1
- Notification badge дублируется screen reader: "3 непрочитанных уведомления"
- Приветствие и ближайший приём читаются screen reader последовательно и логично
- Touch targets минимум 44px

Тренды:
- Glassmorphism (backdrop-blur-sm, bg-white/80) на top app bar при скролле
- Quick action cards с subtle gradient backgrounds при наведении/тапе
- Smooth pull-to-refresh с custom branded animation
- Activity feed items появляются с staggered fade-in анимацией при первом отображении
- Skeleton loading с shimmer эффектом (linear-gradient animation)
- Micro-interactions: tap на quick action → scale(0.96) + haptic feedback
```

---

## 6.2 Онлайн-запись на приём

```
Разработайте современный, профессионально выглядящий интерфейс пошагового мастера онлайн-записи на приём для пациента. Mobile-first дизайн, 5 шагов с прогресс-индикатором.

Визуальный стиль:
- Чистый, минималистичный wizard-интерфейс, фокус на текущем шаге, минимум отвлекающих элементов
- Цветовая схема: основной #1E40AF (активные элементы, прогресс), фон #F8FAFC, карточки на белом, доступные слоты #1E40AF, выбранный слот white на #1E40AF, недоступный #E2E8F0 (серый), CTA #10B981 (зелёный), цена #1E293B bold
- Мягкие тени на карточках, скругления 12px, padding 16px
- Типографика Inter: заголовок шага 20px semibold, body 15px, цена 16px bold, caption 13px muted
- Иконки Lucide для категорий специальностей (stethoscope, heart, eye, bone, baby и т.д.)

Макет и структура:
- Top app bar: кнопка "Назад" (chevron-left) слева, название шага по центру, номер шага справа "Шаг 2 из 5" (13px muted)
- Progress dots: 5 точек (8px circles) под app bar — заполненные #1E40AF (пройденные и текущий), пустые #E2E8F0 (будущие), с connecting line между ними

- Шаг 1 — Специальность/Услуга: заголовок "Выберите специальность" (20px semibold). Grid карточек категорий (2 колонки, gap 12px): каждая карточка — иконка в цветном circle (48px, light bg + dark icon), название специальности (14px semibold), количество врачей (12px muted, например "12 врачей"). Поиск сверху — search input с иконкой (placeholder "Поиск специальности или услуги..."). Популярные категории: Терапевт, Стоматолог, Гинеколог, Кардиолог, ЛОР, Офтальмолог, Невролог, Педиатр
- Шаг 2 — Выбор врача: заголовок "Выберите врача" (20px). Вертикальный список карточек врачей (full width, gap 12px): фото врача (circle 64px), ФИО (16px semibold), специальность + стаж (13px muted, "Терапевт · стаж 12 лет"), рейтинг (звёзды жёлтые #F59E0B + число "4.8", 13px), ближайшая дата (зелёный текст #10B981, "Ближайшая запись: 29 марта"), стоимость приёма (16px bold, "от 150 000 сум"). Фильтр сверху: pills "Все" / "Мужчины" / "Женщины" / "Высший рейтинг". Карточка целиком кликабельна → Шаг 3
- Шаг 3 — Дата и время: заголовок "Выберите дату и время" (20px). Горизонтальный скролл дней (7 дней вперёд видны, каждый день — вертикальная pill: день недели 12px muted + число 18px bold + месяц 12px, доступные дни #1E40AF border, недоступные серые disabled, выбранный — filled #1E40AF white text). Под календарём — секция "Доступное время" с pill-кнопками (горизонтальные ряды по 3-4, height 44px, border #1E40AF, tap → fill #1E40AF white text). Утро/День/Вечер группировка (subheadings 13px muted). Если нет слотов → "Нет свободного времени на эту дату" + suggestion следующей доступной даты
- Шаг 4 — Жалобы и заметки: заголовок "Опишите жалобы" (20px), подзаголовок "Необязательно, но поможет врачу подготовиться" (13px muted). Textarea (border #E2E8F0, focus border #1E40AF, placeholder "Опишите симптомы или причину обращения...", min-height 120px, max 500 символов с counter). Кнопка "Далее" (primary, full width, 48px height) и "Пропустить" (ghost text link под кнопкой)
- Шаг 5 — Подтверждение: заголовок "Подтвердите запись" (20px). Summary card (белый, shadow-md, rounded-2xl, padding 20px): фото врача (48px circle) + ФИО + специальность, разделитель. Строки: Услуга (label muted + value), Дата (label + value bold), Время (label + value bold), Адрес клиники (label + value + map-pin icon), Стоимость (label + value 18px bold #1E293B). Toggle "Оплатить онлайн" / "Оплатить в клинике" (segmented control, default "В клинике"). Если онлайн — показывается привязанная карта или кнопка "Добавить карту". Итого (20px bold). Кнопка "Подтвердить запись" (#10B981, white text, full width, 52px height, bold). Текст 11px muted "Нажимая, вы соглашаетесь с условиями"

- Success экран: зелёная галочка анимация (Lottie circle + check), "Вы записаны!" (24px bold), детали приёма (compact), кнопки: "Добавить в календарь" (secondary outline), "На главную" (ghost)

Элементы UI:
- Progress dots с connecting lines (filled/unfilled states)
- Specialty cards grid 2 колонки с icon circles и tap ripple
- Doctor cards с фото, рейтингом stars, ценой и ближайшей датой
- Horizontal date scroller с pill-shaped day selectors
- Time slot pill buttons сгруппированные по времени суток (утро/день/вечер)
- Textarea с character counter (динамический "124/500")
- Summary card с dividers и structured info layout
- Payment toggle (segmented control)
- Success animation (Lottie/SVG animated checkmark)

UX-аспекты:
- Back button на каждом шаге возвращает к предыдущему с сохранением выбора
- Progress dots кликабельны для возврата к пройденным шагам (но не вперёд)
- Календарь автоматически скроллится к ближайшей доступной дате
- Time slots обновляются при выборе даты без перезагрузки страницы
- Шаг 4 можно пропустить (необязательный)
- На Шаге 5 — все данные отредактированы, tap на строку → возврат к соответствующему шагу
- Success screen → автоматическая отправка SMS/push подтверждения
- Если пользователь уходит на середине wizard — данные сохраняются, при возврате продолжается с того же шага

Брендинг:
- Фирменный синий #1E40AF на progress indicators, выбранных элементах, акцентах
- Зелёный #10B981 на финальной CTA кнопке подтверждения и success экране
- Карточки врачей с реальными фото (circle crop, object-fit cover)
- Единый border-radius 12px на всех карточках и 24px на pill buttons

Доступность:
- Progress dots имеют aria-label "Шаг X из 5, текущий шаг: Выбор врача"
- Все карточки и слоты доступны с клавиатуры (focus ring #1E40AF)
- Touch targets минимум 44px на всех интерактивных элементах
- Disabled слоты имеют aria-disabled="true" и visual distinction (серый + перечёркнутый)
- Calendar навигация стрелками (left/right для дней)
- Textarea с aria-describedby для counter
- Stars рейтинга дублируются текстом "4.8 из 5"

Тренды:
- Slide-left/slide-right transitions между шагами (300ms ease-out)
- Pill selection с scale animation (press → 0.95, release → 1.0)
- Lottie animated checkmark на success screen (green circle draw + check draw)
- Glassmorphism (backdrop-blur) на summary card шага 5
- Horizontal date scroller с snap-to-center behaviour
- Micro-haptic feedback при выборе слота (на поддерживающих устройствах)
```

---

## 6.3 Мои записи

```
Разработайте современный, профессионально выглядящий интерфейс экрана "Мои записи" для пациента. Mobile-first с tab-переключением между предстоящими и прошедшими записями.

Визуальный стиль:
- Чистый card-based дизайн, визуальное разделение по статусам через цвет и badges
- Цветовая схема: основной #1E40AF (подтверждённый приём), фон #F8FAFC, зелёный #10B981 (подтверждён), жёлтый #F59E0B (ожидает подтверждения), красный #EF4444 (отменён), серый #94A3B8 (завершён)
- Карточки записей — белый фон, shadow-sm, border-radius 16px, left border 4px цвет по статусу
- Типографика Inter: заголовок экрана 20px semibold, дата в карточке 16px bold, body 14px, status badge 12px medium

Макет и структура:
- Top app bar: заголовок "Мои записи" по центру
- Tabs (segmented control, full width, под app bar): "Предстоящие" | "Прошедшие" — active tab #1E40AF bg + white text, inactive light gray bg + dark text, border-radius 10px, height 40px

- Tab "Предстоящие": вертикальный список карточек (gap 12px, padding horizontal 16px). Каждая карточка: left border 4px (цвет по статусу). Внутри: дата и время (16px bold, "Пн, 31 марта · 10:00"), строка с фото врача (circle 44px) + ФИО (15px semibold) + специальность (13px muted), название услуги (14px), адрес филиала с map-pin icon (13px muted), status badge справа вверху (pill shape: "Подтверждён" зелёный bg + white text / "Ожидает" жёлтый bg + dark text). Внизу карточки — два action buttons: "Перенести" (ghost blue, calendar icon) и "Отменить" (ghost red, x-circle icon). Tap на карточку → экран деталей (6.4)
- При нажатии "Отменить" — bottom sheet с причиной отмены: radio buttons (Изменились планы / Запишусь на другое время / Другое + textarea) + кнопка "Подтвердить отмену" (red) + "Назад"

- Tab "Прошедшие": вертикальный список карточек. Каждая карточка: дата (16px semibold), фото врача (circle 40px) + ФИО + специальность, название услуги, status badge ("Завершён" серый / "Неявка" красный). Кнопка "Оценить врача" (ghost, star icon, жёлтый) — если ещё не оценён. Кнопка "Записаться повторно" (ghost blue). Если оценка оставлена — показываются звёзды (compact, жёлтые, read-only)

- Empty state (когда нет записей): иллюстрация (line-art calendar с clock, нейтральные тона), текст "У вас пока нет записей" (16px semibold), подтекст "Запишитесь на приём к специалисту" (14px muted), кнопка "Записаться на приём" (#1E40AF, white text, full width, 48px)

Элементы UI:
- Segmented control tabs с animated indicator slide
- Appointment cards с left color border и doctor photo
- Status badges (pill shape, цвет по статусу: green/yellow/gray/red)
- Action buttons (ghost style, compact, с иконками)
- Cancel reason bottom sheet с radio buttons
- Empty state illustration + CTA button
- Star rating display (compact, inline, жёлтые stars)

UX-аспекты:
- Swipe left на карточке → показывает кнопку "Отменить" (destructive red), swipe right → "Перенести" (blue)
- "Записаться повторно" из прошедших → предзаполняет wizard (6.2) с тем же врачом и услугой
- Smooth animated tab switch (content slide left/right)
- Карточки предстоящих записей отсортированы по дате (ближайшая сверху)
- Прошедшие — сортировка по дате (последняя сверху), pagination infinite scroll
- Pull-to-refresh на обоих табах
- При отмене записи — карточка уходит вверх с fade-out анимацией

Брендинг:
- Status badges используют фирменную палитру (green confirmed, yellow pending)
- Единый стиль карточек с left border accent по всему приложению
- Фото врачей — circle crop, consistent size
- Иконки Lucide stroke 1.5px для action buttons

Доступность:
- Tabs доступны с клавиатуры, role="tablist", aria-selected на активном
- Карточки имеют aria-label с полным описанием записи ("Приём у терапевта Иванова 31 марта в 10:00, статус подтверждён")
- Swipe actions дублируются кнопками внутри карточки (swipe — shortcut, не единственный способ)
- Status badges содержат текст (не только цвет)
- Empty state CTA имеет focus ring
- Touch targets 44px minimum

Тренды:
- Segmented control с animated sliding indicator (pill moves between tabs)
- Card press → scale(0.98) с spring animation
- Swipe-to-action с gesture hint animation при первом визите (subtle bounce)
- Smooth tab content transition (slide + fade)
- Skeleton loading для карточек при загрузке
- Cancel bottom sheet с slide-up animation (spring dampened)
```

---

## 6.4 Детали записи

```
Разработайте современный, профессионально выглядящий интерфейс экрана детальной информации о записи на приём для пациента. Mobile-first, полноэкранный.

Визуальный стиль:
- Информативный single-screen дизайн со всеми деталями приёма, structured layout
- Цветовая схема: основной #1E40AF, фон #F8FAFC, статусы: подтверждён #10B981, ожидает #F59E0B, завершён #94A3B8, карточки на белом фоне
- Секции визуально разделены карточками с padding 16px и shadow-sm
- Типографика Inter: дата/время 22px bold, заголовки секций 16px semibold, body 14px, caption 12px muted

Макет и структура:
- Top app bar: кнопка "Назад" (chevron-left), заголовок "Детали записи", справа — more (three dots) → dropdown: "Перенести", "Отменить", "Поделиться"
- Шапка: дата крупно "31 марта 2026" (22px bold) + время "10:00 – 10:30" (18px semibold #1E40AF) + status badge ("Подтверждён" green pill)

- Карточка врача (белый, rounded-2xl, shadow-sm, padding 16px): фото (circle 72px), ФИО (18px semibold), специальность (14px muted), стаж "Опыт: 15 лет" (13px muted), рейтинг (stars жёлтые + "4.9"), кнопка "Профиль врача" (ghost, chevron-right) → открывает профиль врача

- Карточка услуги: название услуги (16px semibold), описание услуги (14px muted, 2–3 строки), строка "Длительность: 30 мин" (14px, clock icon), строка "Стоимость: 200 000 сум" (16px bold)

- Карточка адреса: название филиала (15px semibold), полный адрес (14px), мини-карта (embedded map, height 120px, rounded-xl, tap → полноэкранная карта/навигатор), кнопка "Построить маршрут" (ghost, navigation icon)

- Timeline статуса (вертикальный, left-aligned): круги (12px) соединены линией (2px). Этапы: "Запись создана" (дата, серый/зелёный если пройден), "Подтверждена клиникой" (зелёный если пройден, серый если нет), "Сегодня приём" (синий если текущий), "Приём завершён" (серый если будущий). Текущий этап — circle filled + pulse animation, пройденные — check icon, будущие — empty circle

- Блок действий (зависит от статуса):
  - Если подтверждён/ожидает: "Перенести запись" (outline blue, full width), "Отменить запись" (ghost red, full width)
  - Если онлайн-приём: "Присоединиться к видеозвонку" (filled #1E40AF, full width, 52px, video icon) — активна за 5 минут до начала
  - Если завершён: "Записаться повторно" (filled blue), "Оставить отзыв" (outline, star icon)
- Ссылка "Заполнить предварительную анкету" (если есть, inline link #1E40AF, clipboard icon) → открывает форму анкеты

Элементы UI:
- Date/time header с крупным шрифтом и status badge
- Doctor card с фото, рейтингом и навигацией в профиль
- Service info card со стоимостью и длительностью
- Embedded mini-map (static image или interactive) с кнопкой маршрута
- Vertical status timeline с circles, lines, check marks и pulse animation на текущем шаге
- Action buttons full-width, stacked vertically с gap 12px
- Video call join button (prominent, large, с countdown до начала)

UX-аспекты:
- Вся информация на одном скроллящемся экране, без вложенных экранов
- Tap на мини-карту → открывает навигатор (Google Maps / Яндекс Навигатор / Apple Maps — deeplink)
- Tap на "Профиль врача" → отдельный экран с подробной информацией о враче
- Кнопка видеозвонка неактивна (disabled gray) если до приёма более 5 минут — показывается таймер "Будет доступна через 1ч 23мин"
- Предварительная анкета — inline или bottom sheet с формой (чекбоксы симптомов, textarea)
- Action buttons контекстно зависят от статуса записи (не показываются неактуальные)
- Deep link sharing: "Поделиться" копирует детали приёма в буфер обмена (дата, время, адрес)

Брендинг:
- Фирменный синий на timeline, header accent, CTA кнопках
- Doctor photo — высококачественное, circle crop с тонким border #E2E8F0
- Map стилизована в нейтральных тонах (light mode), не перетягивает внимание
- Единый стиль карточек-секций (white, rounded-2xl, shadow-sm)

Доступность:
- Timeline читается screen reader последовательно: "Шаг 1: Запись создана, выполнено. Шаг 2: Подтверждена, текущий..."
- Мини-карта имеет aria-label с адресом
- Кнопка видеозвонка когда disabled имеет aria-disabled + tooltip с временем активации
- Все секции семантически размечены (headings h2/h3)
- Контраст status badges минимум 4.5:1

Тренды:
- Status timeline с pulse animation на текущем шаге (ring pulse #1E40AF 50% opacity)
- Glassmorphism на date/time header при скролле (sticky, blur background)
- Mini-map с smooth reveal animation при скролле в viewport
- Doctor card с subtle hover/tap elevation transition
- Join video call button с pulsing glow effect когда активна
- Smooth page transition при навигации назад (slide-right)
```

---

## 6.5 Результаты анализов

```
Разработайте современный, профессионально выглядящий интерфейс экрана результатов анализов и обследований для пациента. Mobile-first, понятный для непрофессионала.

Визуальный стиль:
- Медицинские данные представлены просто и наглядно, с акцентом на цветовую индикацию отклонений
- Цветовая схема: норма #10B981 (зелёный), выше нормы #EF4444 (красный), ниже нормы #1E40AF (синий), ожидает #F59E0B (жёлтый), фон #F8FAFC, карточки белые
- Крупные значения результатов для удобного чтения на телефоне
- Типографика Inter: название анализа 16px semibold, значение результата 18px bold (цветное), норма 13px muted, body 14px

Макет и структура:
- Top app bar: "Назад" (chevron-left), заголовок "Мои результаты"
- Список результатов (вертикальные карточки, gap 12px): каждая карточка — белый фон, rounded-2xl, shadow-sm, padding 16px. Содержимое: название анализа (16px semibold, "Общий анализ крови"), дата сдачи (13px muted, "25 марта 2026"), название лаборатории (13px muted, "Лаборатория Invitro"), status badge справа: "Готов" (green pill, check icon) или "В обработке" (yellow pill, clock icon). Если есть критические отклонения — красный badge "Внимание" (red pill, alert-triangle icon) на карточке. Tap → детальный экран

- Детальный экран результата (full screen):
  - Header: название анализа (20px bold), дата + лаборатория (14px muted)
  - Таблица параметров (card-based rows, каждый параметр — отдельная строка):
    - Название параметра (14px), значение (18px bold, цвет по статусу: зелёный норма / красный высокий / синий низкий), диапазон нормы (13px muted, "3.5 – 5.0"), индикатор статуса справа: ✓ зелёный (норма), ↑ красный (выше), ↓ синий (ниже). Строки с отклонениями выделены light background (red-50 или blue-50)
  - Секция "Заключение врача" (если есть) — card с текстом и фото/именем врача
  - Toggle "Показать динамику" — раскрывает mini line chart: ось X даты, ось Y значения, зелёная зона (диапазон нормы), точки значений. Показывается для параметров с историей (2+ результата)
  - Кнопки внизу (sticky bottom bar): "Скачать PDF" (outline, download icon), "Отправить врачу" (outline, share icon). Tap "Отправить врачу" → bottom sheet: выбор врача из списка посещённых → отправляет в чат

Элементы UI:
- Result list cards с status badges (green ready / yellow pending / red critical)
- Parameter rows с цветовой индикацией (green/red/blue values + status icons)
- Color-coded background rows для отклонений (subtle tint)
- Mini line charts с green zone (normal range band)
- Sticky bottom action bar с двумя кнопками
- Share bottom sheet с выбором врача
- Critical alert badge (red pill, shake animation при появлении)

UX-аспекты:
- Список отсортирован по дате (новые сверху), параметры с отклонениями показаны первыми в таблице
- Критические значения визуально выделены и привлекают внимание (red background row + badge)
- Toggle динамики загружает chart асинхронно (skeleton → chart)
- "Скачать PDF" → генерирует и скачивает файл, показывает progress indicator
- "Отправить врачу" → отправляет PDF в чат с выбранным врачом
- При tap на параметр с историей → раскрывается inline mini-chart для этого конкретного параметра
- Pull-to-refresh на списке для проверки новых результатов
- Push-уведомление когда результат готов → deep link на детальный экран

Брендинг:
- Зелёный #10B981 — норма, позитив. Красный #EF4444 — внимание, отклонение вверх. Синий #1E40AF — отклонение вниз. Жёлтый #F59E0B — ожидание
- Единый стиль карточек и badges
- Charts в фирменных цветах с green zone для нормы
- Лаборатории показаны нейтрально (не акцентированы)

Доступность:
- Status icons дублируются текстом (не только цвет): "В норме", "Выше нормы", "Ниже нормы"
- Charts имеют alternative text и data table fallback
- Крупный шрифт значений (18px bold) для читабельности
- Красный badge "Внимание" имеет aria-live="assertive" для screen reader
- Строки таблицы читаются: "Гемоглобин: 145, норма 130-160, в норме"
- Touch targets 44px minimum

Тренды:
- Parameter rows с subtle expand animation при tap (показывает chart)
- Line chart с animated draw-in при первом отображении
- Critical badge с subtle shake animation (attention-grabbing но не раздражающий)
- Glassmorphism на sticky bottom bar (backdrop-blur)
- Skeleton shimmer при загрузке данных
- Smooth scroll-to-top при переключении между результатами
```

---

## 6.6 Мои документы

```
Разработайте современный, профессионально выглядящий интерфейс экрана "Мои документы" для пациента. Mobile-first, файловый менеджер с категориями.

Визуальный стиль:
- Структурированный файловый менеджер, интуитивная навигация по категориям
- Цветовая схема: медицинские записи #1E40AF (синий), рецепты #10B981 (зелёный), справки #7C3AED (фиолетовый), результаты анализов #F59E0B (оранжевый), счета/чеки #64748B (серый), фон #F8FAFC
- Карточки категорий и документов — белый фон, rounded-xl, shadow-sm
- Типографика Inter: заголовок 20px semibold, название категории 16px semibold, название документа 15px medium, мета-данные 13px muted

Макет и структура:
- Top app bar: "Мои документы" заголовок, справа — search icon (tap → search bar с фильтром по названию/дате)

- Экран категорий (главный): вертикальный список категорий-карточек (full width, gap 12px, padding 16px):
  - Каждая категория: цветная иконка слева (circle 44px, light bg + dark icon), название категории (16px semibold), количество документов справа (badge circle, 13px), chevron-right
  - Категории: "Медицинские записи" (file-medical, синий, стетоскоп icon), "Рецепты" (pill, зелёный), "Справки и сертификаты" (award, фиолетовый), "Результаты анализов" (clipboard, оранжевый), "Счета и чеки" (receipt, серый)
  - Tap на категорию → экран с документами этой категории

- Экран документов категории: top app bar с "Назад" + название категории. Вертикальный список документов (cards):
  - Каждый документ: иконка типа файла (PDF/image, 36px), название документа (15px medium, "Заключение терапевта"), дата документа (13px muted, "25 марта 2026"), имя врача (13px muted, "Иванов И.И."). Справа: кнопка "Просмотр" (eye icon, ghost) и кнопка "Скачать" (download icon, ghost). Tap на карточку → inline просмотр
  - Сортировка: по дате (новые сверху), можно переключить "По дате" / "По имени" (compact sort pills)

- Просмотр документа (full screen): top app bar "Назад" + название файла. PDF viewer inline (full width, pinch-to-zoom). Sticky bottom bar: "Скачать" (outline, download icon), "Поделиться" (outline, share icon), "Распечатать" (outline, printer icon). Если изображение — просмотр с pinch-to-zoom и double-tap zoom

Элементы UI:
- Category cards с цветными иконками и document count badges
- Document list items с file type icon, meta info, и action buttons
- Inline PDF viewer (full screen, pinch-to-zoom support)
- Image viewer с zoom controls
- Sticky bottom action bar (скачать/поделиться/печать)
- Search bar с real-time фильтрацией
- Sort pills (По дате / По имени)
- Empty category state: "Нет документов в этой категории" + illustration

UX-аспекты:
- Быстрая навигация: 2 тапа до документа (категория → документ)
- Preview без скачивания — PDF рендерится inline, изображения показываются сразу
- "Поделиться" — системный share sheet (мессенджеры, email, копировать ссылку)
- "Распечатать" — системный диалог печати
- Search фильтрует по названию документа и имени врача
- Бесконечный скролл в категориях с большим количеством документов
- File size показан в мета-данных для документов (PDF 1.2 MB)
- Документы кэшируются для оффлайн-просмотра ранее открытых

Брендинг:
- Каждая категория имеет свой узнаваемый цвет (consistent с остальным приложением)
- Иконки Lucide/Phosphor для типов документов и действий
- Единый стиль карточек (white, rounded-xl, shadow-sm)
- PDF viewer frame нейтральный, фокус на содержимом документа

Доступность:
- Категории и документы имеют descriptive aria-labels
- Count badges читаются: "Медицинские записи, 5 документов"
- PDF viewer имеет zoom controls доступные с клавиатуры
- Action buttons имеют text labels (не только иконки)
- Search input с aria-label "Поиск документов"
- File type объявляется: "PDF документ" / "Изображение"

Тренды:
- Category cards с subtle left color border (4px, цвет категории)
- Smooth navigation transitions (slide-left при входе в категорию, slide-right при возврате)
- PDF viewer с glass-style toolbar overlay
- Document cards с tap elevation effect
- Search bar с animated expand from icon
- Pinch-to-zoom с smooth spring physics на изображениях
```

---

## 6.7 Чат с врачом

```
Разработайте современный, профессионально выглядящий интерфейс чата пациента с врачом. Mobile-first, мессенджер-стиль, знакомый пользователям WhatsApp/Telegram.

Визуальный стиль:
- Знакомый мессенджер-дизайн, простой и не перегруженный
- Цветовая схема: сообщения пациента #E2E8F0 (светло-серый) с тёмным текстом, сообщения врача #1E40AF с белым текстом, фон чата #F8FAFC, input area белый, online status #10B981
- Bubbles со скруглёнными углами (18px), хвостик на последнем сообщении в группе
- Типографика Inter: сообщения 15px regular, timestamps 11px muted, имя врача 16px semibold, специальность 13px muted

Макет и структура:
- Header (sticky top): фото врача (circle 40px), ФИО (16px semibold), специальность (13px muted), статус online/offline (зелёная/серая точка 8px + текст "Онлайн" / "Был(а) 2 часа назад" 12px). Tap на header → профиль врача. Кнопка "Назад" (chevron-left) слева

- Область сообщений (scrollable, flex-grow): bubbles с текстом, timestamps (11px muted, под bubble, right-aligned для пациента, left для врача). Группировка: сообщения подряд от одного автора без повторения аватара — аватар только у первого. Дата-разделители по центру ("Сегодня", "Вчера", "25 марта" — pill shape, light gray bg, 12px)
  - Текстовые сообщения: bubble с текстом + timestamp
  - Файлы/изображения в сообщениях: preview image (rounded-xl, max-width 240px, tap → fullscreen), файл — иконка + название + размер + download кнопка
  - Typing indicator: три анимированных точки в bubble врача "Врач печатает..."
  - Системные сообщения (по центру, muted): "Врач просмотрел сообщение", "Чат доступен до 5 апреля"

- Quick replies (горизонтальный scroll, над input bar): pill buttons с предустановленными ответами: "Спасибо", "Понял(а)", "Перезвоните", "Когда будут результаты?". Tap → отправляет сразу

- Input bar (sticky bottom, safe area padding): text input field (rounded-full, border #E2E8F0, focus #1E40AF, placeholder "Сообщение..."), кнопка attachment (paperclip icon, 44px, слева или справа от input), кнопка send (circle 40px, #1E40AF, arrow-up white icon, появляется только когда текст введён, иначе скрыта). Attachment tap → bottom sheet: "Фото" (camera icon), "Файл" (file icon), "Из галереи" (image icon)

Элементы UI:
- Chat bubbles с tail (пациент right-aligned серый, врач left-aligned синий)
- Doctor avatar (circle 32px) рядом с bubbles врача
- Online/offline status indicator (dot + text)
- Typing indicator (3 bouncing dots в bubble shape)
- Quick reply pills (horizontal scroll)
- Attachment bottom sheet (camera/file/gallery options)
- Image preview в сообщениях (rounded, tap to fullscreen)
- File attachment card (icon + name + size + download)
- Date separator pills
- System messages (centered, muted)
- Send button (animated appear/disappear)

UX-аспекты:
- Auto-scroll к последнему сообщению при открытии и при получении нового
- Кнопка "↓ Новые сообщения" появляется если пользователь проскроллил вверх и пришло новое сообщение
- Фото preview перед отправкой — показ с кнопками "Отправить" / "Отмена"
- Real-time обновления через WebSocket (typing indicator, новые сообщения)
- Quick replies отправляются сразу при tap (без промежуточного шага)
- Input field auto-grows по высоте (до 4 строк, потом скролл)
- Keyboard push-up layout (input bar поднимается с клавиатурой)
- Если нет активных приёмов — информационный баннер "Запишитесь на приём для консультации" с кнопкой

Брендинг:
- Врач bubbles в фирменном синем #1E40AF — визуально выделены как авторитетный источник
- Пациент bubbles нейтральные серые — не конкурируют с сообщениями врача
- Online dot зелёный #10B981 — consistent с остальным приложением
- Единый стиль аватаров (circle, consistent size)

Доступность:
- Сообщения имеют aria-label "Сообщение от {автор}, {время}: {текст}"
- Typing indicator озвучивается: "Врач печатает"
- Send button имеет aria-label "Отправить сообщение"
- Images в сообщениях имеют alt text (если задан) или "Изображение от {автор}"
- Input field с aria-label "Написать сообщение"
- Quick replies доступны с клавиатуры

Тренды:
- Typing indicator с bouncing dots animation (каскадный bounce, 0.6s cycle)
- Send button появляется с scale animation (0 → 1, spring easing)
- New message appear animation (slide-up + fade-in, 200ms)
- Glassmorphism на header при скролле (backdrop-blur, semi-transparent)
- Image messages с progressive loading (blur → sharp)
- Quick replies pills с tap ripple effect
- Smooth keyboard push-up transition (matching iOS/Android native feel)
```

---

## 6.8 Телемедицина

```
Разработайте современный, профессионально выглядящий интерфейс телемедицинского приёма для пациента. Mobile-first, три фазы: до приёма, во время видеозвонка, после приёма.

Визуальный стиль:
- До/после приёма — стандартный app стиль (#F8FAFC фон, белые карточки). Во время звонка — immersive тёмный UI (#0F172A background), минимум элементов, фокус на видео
- Цветовая схема: primary #1E40AF, video controls белые на полупрозрачном тёмном фоне, end call #EF4444, mic/cam active белый, mic/cam muted #EF4444, timer #FFFFFF
- Крупные элементы управления (пальцем удобно нажимать во время разговора)
- Типографика Inter: заголовки 20px semibold, body 15px, timer 14px medium, controls labels 11px

Макет и структура:
- Фаза 1 — До приёма (экран подготовки):
  - Карточка приёма: фото врача (circle 64px) + ФИО + специальность, дата + время (16px bold), услуга, таймер обратного отсчёта "Начнётся через 00:04:32" (18px semibold #1E40AF)
  - Блок проверки оборудования: "Проверьте камеру и микрофон" (16px semibold). Camera preview (rounded-xl, 200px height, показывает видео пациента в реальном времени). Mic level bar (горизонтальная полоска, заполняется зелёным при звуке). Статусы: "Камера ✓" (green), "Микрофон ✓" (green) или "Нет доступа к камере ✗" (red) с кнопкой "Разрешить"
  - Предварительная анкета (если есть): "Заполните перед приёмом" — ссылка → bottom sheet с формой (чекбоксы, textarea)
  - Кнопка "Присоединиться" (filled #10B981, white text, full width, 52px, disabled если до начала > 5 мин — серый с текстом "Доступна в 09:55")

- Фаза 2 — Видеозвонок (immersive):
  - Видео врача — full screen background (object-fit cover, тёмный fallback с аватаром если камера выключена)
  - Видео пациента — PIP (picture-in-picture) окно: rounded-2xl, 120×160px, position top-right с отступом 16px, draggable (можно перетащить в любой угол). Tap → swap (пациент full, врач PIP)
  - Таймер приёма: top center, "12:34" (14px medium white на semi-transparent pill #000/40%)
  - Имя врача: под таймером (13px white semi-transparent)
  - Control bar (bottom, horizontal, centered, padding-bottom safe area): 5 круглых кнопок (56px circle):
    - Микрофон (mic / mic-off, white bg / red bg when muted)
    - Камера (video / video-off, white bg / red bg when off)
    - Чат (message-circle, white bg, blue dot badge если новые сообщения)
    - Переключить камеру (refresh-cw, white bg, front/back toggle)
    - Завершить (phone-off, red bg #EF4444, white icon)
  - Chat overlay: slide-up panel (50% screen height), semi-transparent dark bg, chat messages + input, close button (x). Накладывается поверх видео

- Фаза 3 — После приёма:
  - "Приём завершён" header (20px semibold), длительность "15 минут" (14px muted)
  - Оценка: "Оцените приём" — 5 крупных звёзд (48px, tap to rate, golden #F59E0B fill animation)
  - Feedback textarea (optional): "Оставьте комментарий..." (placeholder, 13px muted, border #E2E8F0)
  - Карточка "Следующие шаги" (от врача, если заполнено): рекомендации, назначения, следующий приём — structured list с иконками. Кнопка "Записаться на повторный приём" (если рекомендовано)
  - Кнопки: "Отправить оценку" (primary, full width), "На главную" (ghost)

Элементы UI:
- Camera preview с live video feed и rounded corners
- Mic level indicator (animated bar, green gradient)
- Countdown timer (MM:SS format, pulse animation в последнюю минуту)
- Full-screen video с dark fallback (avatar + "Камера выключена")
- PIP window (draggable, rounded-2xl, shadow-xl)
- Circular control buttons (56px, with labels underneath 11px)
- Chat overlay panel (slide-up, semi-transparent)
- Star rating (48px, golden fill animation)
- "Next steps" card от врача

UX-аспекты:
- Equipment check автоматический при входе на экран — запрашивает permissions, показывает preview
- Кнопка "Присоединиться" активируется за 5 минут, с обратным отсчётом
- Во время звонка — minimal UI, controls auto-hide через 5 секунд неактивности (tap anywhere → показать), не скрываются при активном нажатии
- PIP draggable в любой из 4 углов экрана (snap-to-corner)
- Tap на PIP → swap main/pip видео
- Chat доступен во время звонка, не прерывая видео
- При завершении вызова → автоматический переход на экран оценки
- Если соединение потеряно → экран "Переподключение..." с spinner + retry button
- Screen stays awake во время вызова (wake lock API)

Брендинг:
- Control bar minimal, не отвлекает от разговора с врачом
- End call красный #EF4444 — universal визуальный сигнал
- Rating stars золотые #F59E0B — consistent с оценками в других экранах
- До/после фазы — стандартный светлый стиль приложения

Доступность:
- Control buttons имеют aria-labels: "Выключить микрофон", "Включить камеру" и т.д.
- Muted/unmuted состояние объявляется screen reader
- Touch targets 56px (больше стандартных 44px для удобства во время звонка)
- Timer readable screen reader: "Длительность приёма 12 минут 34 секунды"
- Chat overlay полностью accessible (focus trap когда открыт)
- Star rating с aria-label "X из 5 звёзд"

Тренды:
- Glassmorphism control bar (backdrop-blur-lg, bg-black/30)
- PIP drag с spring physics (snap to corner with bounce)
- Star rating fill animation (golden wave from left to right)
- Slide-up chat overlay с spring-dampened animation
- Connection quality indicator (3 bars, green/yellow/red)
- Subtle vignette overlay на видео (darken edges для лучшего контраста UI элементов)
- Smooth transition между фазами (fade + slide)
```

---

## 6.9 Отзывы

```
Разработайте современный, профессионально выглядящий интерфейс экрана отзывов пациента. Mobile-first, включает просмотр своих отзывов и написание нового.

Визуальный стиль:
- Мотивирующий, простой дизайн, побуждающий оставить отзыв
- Цветовая схема: звёзды #F59E0B (золотой), основной #1E40AF, positive #10B981, фон #F8FAFC, карточки белые, ответ клиники — light blue bg #EFF6FF
- Крупные интерактивные звёзды для рейтинга
- Типографика Inter: заголовки 20px semibold, текст отзыва 14px, рейтинг число 24px bold, caption 12px muted

Макет и структура:
- Top app bar: "Отзывы" заголовок, справа кнопка "Написать отзыв" (+ icon, ghost blue)

- Общий рейтинг клиники (card top, full width): крупное число рейтинга "4.7" (32px bold), 5 звёзд рядом (заполненные gold), "на основе 1 248 отзывов" (13px muted). Breakdown bars: 5 строк (5★ — progress bar 80%, 4★ — 12%, 3★ — 5%, 2★ — 2%, 1★ — 1%), bars цвет gold #F59E0B на #E2E8F0 background

- Мои отзывы (список карточек, секция "Мои отзывы" 18px semibold):
  - Каждый отзыв — card: имя врача + специальность (15px semibold), звёзды (small, gold, read-only) + дата (12px muted), текст отзыва (14px, max 4 строки с "Показать полностью" expand), фото клиники/врача (если прикреплены, thumbnail).
  - Ответ клиники (если есть): вложенный блок с light blue bg #EFF6FF, "Ответ клиники" label (12px semibold muted), текст ответа (14px), дата (12px muted)
  - Если нет отзывов — "Вы пока не оставляли отзывов" + CTA "Оценить последний визит"

- Экран написания отзыва (full screen / bottom sheet large):
  - Заголовок "Оставить отзыв" (20px semibold)
  - Выбор врача: dropdown/bottom sheet со списком посещённых врачей (фото circle + ФИО + специальность + дата последнего визита). Только врачи, которых пациент посещал
  - Рейтинг: "Оцените приём" — 5 крупных звёзд (48px, tap to fill, golden animation). Под звёздами label: 1="Ужасно", 2="Плохо", 3="Нормально", 4="Хорошо", 5="Отлично" (14px, меняется динамически)
  - Textarea: "Расскажите о вашем опыте..." (placeholder, min-height 100px, max 1000 символов с counter "0/1000")
  - Toggle "Анонимный отзыв" (switch + пояснение "Ваше имя не будет отображаться" 12px muted)
  - Кнопка "Опубликовать" (filled #1E40AF, white text, full width, 48px, disabled пока рейтинг не выбран)
  - Success: "Спасибо за отзыв!" анимация (check + confetti)

Элементы UI:
- Clinic rating card с крупным числом, звёздами и breakdown bars
- Review cards с врачом, звёздами, текстом и ответом клиники
- Large interactive stars (48px, tap to fill, golden animation)
- Dynamic rating label (изменяется при выборе звёзд)
- Doctor selector (dropdown/bottom sheet с фото и info)
- Textarea с character counter
- Anonymous toggle switch
- Clinic response block (indented, light blue background)
- Success animation (check + subtle confetti)

UX-аспекты:
- Звёзды: tap на звезду заполняет до неё включительно (с fill wave animation)
- Текст опционален — можно отправить только рейтинг (но поощряется текст: "Расскажите подробнее — это поможет другим пациентам")
- Анонимный toggle — имя пациента заменяется на "Пациент" в публичном отзыве
- "Опубликовать" disabled до выбора рейтинга (визуально серый), enabled → зелёный pulse
- Мои отзывы редактируемы в течение 48 часов после публикации (edit icon на card)
- После publish — показывает модерационный notice "Отзыв будет опубликован после проверки" (yellow info banner)
- Doctor selector показывает только тех врачей, у которых были завершённые визиты

Брендинг:
- Золотые звёзды #F59E0B — universal rating color, consistent
- Clinic response в фирменном light blue — выделяет официальный ответ
- Единый стиль карточек
- Confetti анимация в фирменных цветах (#1E40AF, #10B981, #F59E0B)

Доступность:
- Stars имеют aria-label "Оценка X из 5 звёзд", role="radiogroup"
- Каждая звезда — radio button с aria-label "1 звезда", "2 звезды" и т.д.
- Breakdown bars имеют aria-label "5 звёзд: 80 процентов отзывов"
- Textarea с visible label и character counter linked через aria-describedby
- Anonymous toggle с aria-label "Анонимный отзыв, включено/выключено"
- Review text expandable с keyboard accessible "Показать полностью"

Тренды:
- Star fill animation (golden sparkle/wave при выборе)
- Breakdown bars с animated fill при первом отображении (staggered, 0 → value)
- Success confetti animation (subtle, 2 seconds, auto-dismiss)
- Rating label smooth text transition (fade out old → fade in new)
- Review cards с subtle appear animation (staggered list)
- Pull-to-refresh на списке отзывов
```

---

## 6.10 Профиль пациента

```
Разработайте современный, профессионально выглядящий интерфейс профиля пациента в личном кабинете. Mobile-first, settings-style layout с секциями.

Визуальный стиль:
- Чистый settings/profile дизайн в стиле нативных мобильных приложений (iOS Settings-like)
- Цветовая схема: основной #1E40AF, фон #F8FAFC, секции на белом фоне, accent #10B981 для toggles active state, danger #EF4444 для деструктивных действий
- Grouped sections с grey background между ними
- Типографика Inter: имя 22px semibold, section headers 14px semibold uppercase #64748B, field labels 15px, field values 15px medium

Макет и структура:
- Top app bar: "Профиль" заголовок, справа "Готово" / "Редактировать" (text button #1E40AF)

- Header card (белый, rounded-2xl, shadow-sm, center-aligned): аватар (circle 80px, tap → bottom sheet: "Сделать фото", "Выбрать из галереи", "Удалить"), overlay camera icon на аватаре (semi-transparent circle, camera icon white). ФИО (22px semibold), email (14px muted), телефон (14px muted)

- Секция "Личные данные" (grouped card):
  - Строки: ФИО → tap → edit screen (text inputs Фамилия, Имя, Отчество)
  - Дата рождения → tap → date picker (native или custom wheel picker)
  - Пол → tap → radio: Мужской / Женский
  - Каждая строка: label left (15px), value right (15px medium #1E293B), chevron-right

- Секция "Контакты" (grouped card):
  - Телефон → tap → edit (phone input с маской +998, SMS verification при изменении)
  - Email → tap → edit (email input)
  - Адрес → tap → edit (city, street, house textarea)

- Секция "Медицинская информация" (grouped card):
  - Группа крови → dropdown (I, II, III, IV, +/-)
  - Аллергии → tag editor (chips: добавить tag input + existing tags с x remove). Пример chips: "Пенициллин", "Латекс"
  - Хронические заболевания → tag editor (chips: "Диабет 2 типа", "Гипертония")
  - Каждое поле — tap → edit с удобным UI

- Секция "Страховка / ДМС" (grouped card):
  - Страховая компания → text input
  - Номер полиса → text input
  - Действителен до → date picker
  - Скан полиса → upload button (camera/gallery) + preview thumbnail если загружен

- Секция "Настройки" (grouped card):
  - Язык: segmented control "Русский" | "Ўзбекча" (tap → switch, app re-renders)
  - Уведомления (sub-rows с toggles):
    - Push-уведомления (toggle, default on)
    - SMS-напоминания (toggle, default on)
    - Email-рассылка (toggle, default off)

- Секция "Безопасность" (grouped card):
  - Сменить пароль → tap → screen (current password, new password, confirm)
  - Двухфакторная аутентификация → toggle (вкл → setup flow SMS/TOTP)

- Кнопка "Выйти" (full width, outline red, 48px, внизу) → confirmation alert "Вы уверены?"
- Ссылка "Удалить аккаунт" (red text, 13px, самый низ) → double confirmation

Элементы UI:
- Avatar с camera overlay и upload bottom sheet
- Grouped setting rows (iOS-style: white bg, dividers, chevron-right)
- Tag editor (chips с add input и x remove)
- Toggle switches (#10B981 active, #E2E8F0 inactive)
- Segmented control для языка (2 сегмента, animated pill indicator)
- Date pickers (native wheel или calendar)
- File upload с preview thumbnail
- Logout button (outline red, prominent)
- Delete account link (text red, subtle)

UX-аспекты:
- Inline editing: tap на строку → edit mode с save/cancel (или отдельный edit screen для complex fields)
- Save per section — не нужно скроллить к общей кнопке "Сохранить"
- Смена языка мгновенная — всё приложение переключается без перезагрузки
- Смена телефона требует SMS verification (6-digit code screen)
- Пароль: strength indicator (weak/medium/strong bar)
- Tag editor: input с autocomplete из стандартного списка аллергий/заболеваний
- Photo upload: crop circle перед сохранением
- Delete account: 2 подтверждения + ввод пароля + 30-дневный grace period notice
- Medical info помечена "Видно только вашему врачу" (lock icon + muted text)

Брендинг:
- Фирменный синий #1E40AF для edit CTA, focus states, segmented active
- Toggles зелёный #10B981 — позитивное включённое состояние
- Red #EF4444 для logout и delete — danger zone visual cue
- Avatar circle с thin border #E2E8F0

Доступность:
- Все строки настроек имеют accessible names (label + current value)
- Toggles с aria-checked и aria-label ("Push-уведомления, включено")
- Segmented control с role="radiogroup"
- Tag editor: chips removable с aria-label "Удалить Пенициллин"
- Delete account: предупреждение читается screen reader
- Form inputs с visible labels и error messages
- Contrast на всех текстовых элементах 4.5:1 minimum

Тренды:
- iOS-style grouped sections (rounded corners top/bottom items, flat dividers)
- Avatar upload с circular crop overlay (drag to reposition)
- Toggle switches с smooth spring animation
- Segmented control с sliding pill indicator (animated)
- Section expand/collapse smooth animation для complex sections
- Password strength bar с gradient animation (red → yellow → green)
- Neumorphism subtle на toggle switches (inner shadow when off)
```

---

## 6.11 История платежей

```
Разработайте современный, профессионально выглядящий интерфейс экрана истории платежей для пациента. Mobile-first, финансовая информация с фильтрацией.

Визуальный стиль:
- Финансовый дизайн: чёткий, структурированный, с акцентом на суммы и статусы
- Цветовая схема: основной #1E40AF, оплачено #10B981 (зелёный), ожидает оплаты #F59E0B (жёлтый), возврат #EF4444 (красный), фон #F8FAFC, карточки белые
- Суммы крупным шрифтом, денежный формат с разделителями (1 200 000 сум)
- Типографика Inter: сумма 18px bold, заголовки 16px semibold, body 14px, caption 12px muted, total сумма 28px bold

Макет и структура:
- Top app bar: "Платежи" заголовок, справа фильтр icon (sliders icon) → bottom sheet фильтры

- Summary card (top, full width, gradient bg #1E40AF → #3B82F6, white text, rounded-2xl, padding 20px):
  - "Итого за период" (14px, white/70%)
  - Сумма "2 450 000 сум" (28px bold white)
  - Период "Март 2026" (13px, white/60%)
  - Количество "4 визита" (13px, white/60%)

- Фильтр периода (horizontal pills, под summary): "Неделя" | "Месяц" | "3 месяца" | "Год" | "Всё время" — active pill filled #1E40AF white text, inactive outline

- Список платежей (вертикальные карточки, gap 12px):
  - Каждый платёж — card (white, rounded-xl, shadow-sm, padding 16px):
    - Top row: дата (14px semibold, "25 марта 2026") + status badge справа (pill: "Оплачено" green / "Ожидает" yellow / "Возврат" red)
    - Middle: название услуги (15px medium, "Консультация терапевта"), имя врача (13px muted, "Иванов И.И.")
    - Bottom row: сумма (18px bold, "200 000 сум") + способ оплаты badge (compact pill: "Карта" с card icon / "Наличные" с banknote icon / "Онлайн" с globe icon, all neutral gray bg)
    - Кнопка "Чек" (ghost, download icon, 13px) — скачивает квитанцию PDF
    - Если статус "Ожидает" — дополнительная кнопка "Оплатить" (filled #10B981, white, compact) → переход к оплате

  - Date grouping: платежи группируются по месяцам с header-разделителем "Март 2026" (14px semibold muted, sticky)

- Bottom sheet фильтры (при нажатии filter icon):
  - Период: date range picker (от → до)
  - Статус: chips toggle (Все / Оплачено / Ожидает / Возврат)
  - Способ оплаты: chips toggle (Все / Карта / Наличные / Онлайн)
  - Кнопка "Применить" (primary, full width) + "Сбросить" (ghost)

- Онлайн-оплата (отдельный экран при нажатии "Оплатить"):
  - Детали счёта: услуга, врач, дата, сумма
  - Выбор способа: привязанная карта (last 4 digits + brand icon) или "Новая карта" (card form: номер, срок, CVV)
  - Кнопка "Оплатить 200 000 сум" (filled #10B981, full width, 52px)
  - Success: "Оплата прошла успешно" (green check animation)

Элементы UI:
- Summary card с gradient background и крупной суммой
- Period filter pills (horizontal scroll)
- Payment cards с status badges (green/yellow/red pills)
- Payment method badges (compact pills с icons)
- Receipt download button (ghost, compact)
- Pay now button (green, prominent, на pending items)
- Month group headers (sticky при скролле)
- Filter bottom sheet с chips и date range picker
- Card payment form (number с маской, expiry, CVV)
- Success payment animation

UX-аспекты:
- Summary card автоматически пересчитывается при смене фильтра периода
- Денежные суммы форматированы с пробелами: "1 200 000 сум" (locale-aware)
- "Чек" → скачивание PDF квитанции, показывает loading indicator
- "Оплатить" → быстрая оплата привязанной картой (1 tap если карта сохранена)
- Infinite scroll для длинной истории, загрузка по 20 элементов
- Pull-to-refresh для обновления статусов (pending → paid)
- Фильтры сохраняются при возврате на экран
- Push-уведомление при успешной оплате / появлении нового счёта
- Sticky month headers при скролле (iOS-style section headers)

Брендинг:
- Summary card в фирменном gradient (#1E40AF → #3B82F6) — premium feel
- Зелёный #10B981 для "Оплачено" и кнопки оплаты — позитивные финансовые действия
- Жёлтый #F59E0B для "Ожидает" — requires attention
- Красный #EF4444 для "Возврат" — информационный, не тревожный
- Суммы в UZS (узбекский сум), формат "XXX XXX сум"

Доступность:
- Суммы читаются screen reader: "двести тысяч сум"
- Status badges с текстом (не только цвет)
- Filter chips с aria-pressed state
- Summary card values с aria-label "Итого за март 2026: два миллиона четыреста пятьдесят тысяч сум"
- Payment form fields с proper labels и autocomplete attributes
- Receipt download с aria-label "Скачать квитанцию за 25 марта"
- Touch targets 44px minimum на всех интерактивных элементах

Тренды:
- Summary card с subtle gradient animation (shift на 2-3 градуса при скролле — parallax feel)
- Filter pills с animated sliding indicator
- Payment cards с staggered appear animation при загрузке
- Status badges с subtle pulse на "Ожидает" (attention-drawing)
- Success payment animation (Lottie check + green circle)
- Glassmorphism на filter bottom sheet header
- Skeleton shimmer при загрузке данных
- Month headers с sticky behaviour и smooth transition при смене секции
```
