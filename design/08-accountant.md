# Бухгалтер / Финансист — Design Prompts (Stitch)

> Роль: Бухгалтер / финансист. Ведёт доходы/расходы, зарплаты, ДМС-расчёты, налоги, контрагенты, финансовые отчёты.

---

## 8.1 Дашборд бухгалтера

```
Разработайте современный, профессионально выглядящий интерфейс финансового дашборда для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- Строгий финансовый дизайн с акцентом на цифрах и метриках, чистые линии и ясная иерархия данных
- Цветовая схема: основной #1E40AF (primary blue), фон #F8FAFC (light gray), доходы #10B981 (green), расходы #EF4444 (red), предупреждения #F59E0B (amber), нейтральный #94A3B8
- Все денежные суммы крупным шрифтом bold с разделителями тысяч, выровнены по правому краю, зелёный для положительных трендов, красный для отрицательных
- Типографика Inter, tabular-nums для всех финансовых цифр, заголовки карточек 12px uppercase tracking-wider #64748B, суммы 24-28px bold #0F172A
- Иконки Lucide / Phosphor — тонкие, 20px, монохромные #64748B, цветные только для статусов и трендов
- Карточки с белым фоном, border-radius 12px, shadow-sm, subtle left border 3px цветной (по типу метрики)
- Графики с мягкими градиентными заливками под линиями (opacity 0.1-0.2), скруглённые углы столбцов, плавные hover-эффекты

Макет и структура:
- Collapsible sidebar 240px → 64px слева: иконка + текст, пункты — Дашборд (активный, bg #EFF6FF), Доходы, Расходы, Зарплаты, Настройки начислений, ДМС / Страховые, Реестры ДМС, Налоги, Налоговый календарь, Контрагенты, Отчёты, Конструктор отчётов; внизу — имя пользователя + аватар 32px + «Бухгалтер» badge
- Sticky header 56px: breadcrumbs «Главная / Дашборд», справа — period selector (Месяц / Квартал / Год выпадающий + date range picker), notification bell с badge count, user avatar dropdown
- KPI-карточки в ряд 5 штук (gap 16px, responsive grid auto-fit min 200px):
  - Выручка за месяц: сумма bold green, под ней тренд arrow + «+12% к пред. месяцу» green или red, sparkline мини-график 7 дней
  - Расходы за месяц: сумма bold #EF4444, тренд процент, sparkline
  - Чистая прибыль: сумма bold, под ней margin% в скобках (напр. «32%»), цвет зависит от значения (green > 20%, yellow 10-20%, red < 10%)
  - Дебиторская задолженность: сумма, под ней количество должников badge, warning amber если > порога
  - Кредиторская задолженность: сумма, под ней ближайший срок оплаты, red если просрочено
- Основная область — grid 2 колонки:
  - Слева сверху: Revenue vs Expenses dual line chart за 12 месяцев — две линии (#10B981 доходы, #EF4444 расходы), область под каждой линией с градиентом, ось Y с currency formatting, tooltip при hover с точными суммами обеих линий, legend сверху справа
  - Справа сверху: Cash Flow waterfall chart — столбцы зелёные (приход), красные (расход), серый connector line между ними, итоговый столбец синий; категории: Услуги, ДМС, Возвраты, Зарплаты, Аренда, Налоги, Прочее, Итого
  - Слева снизу: Revenue by payment method donut chart — сегменты: Наличные (green), Карта (blue #3B82F6), Перевод (purple #8B5CF6), ДМС (orange #F59E0B); в центре общая сумма; legend справа с процентами
  - Справа снизу: Upcoming Payments widget — компактная таблица с чередованием строк: Назначение, Контрагент, Дата (relative «через 3 дня»), Сумма; строки с просрочкой — light red bg + red badge «Просрочено»; максимум 7 строк + ссылка «Показать все»
- Quick Links row внизу: 4 кнопки-карточки (icon + text): «Сформировать зарплату», «Создать реестр ДМС», «Добавить расход», «Сгенерировать отчёт» — outlined style, hover с bg fill

Элементы UI:
- KPI cards с animated trend arrows (rotate up/down), процент тренда рядом, sparkline 60x20px с точками на концах
- Period selector — segmented control (Месяц | Квартал | Год) + custom date range picker, при переключении все данные перезагружаются с skeleton-анимацией
- Dual line chart: interactive hover crosshair, tooltip с обеими суммами и разницей, click по точке → drill-down в детальную страницу
- Waterfall chart: hover → tooltip с суммой и процентом от общего, animated bars при загрузке (grow from zero)
- Donut chart: hover segment → подсветка + tooltip, click → переход к фильтрованному списку доходов
- Upcoming payments table: status badges (Ожидает — amber, Просрочено — red pulse, Оплачено — green), sort by date, hover row → view button appears
- Quick action cards: Lucide icons 24px, subtle hover elevation (shadow-md), click → navigate to corresponding page
- Notification bell: red dot если есть непрочитанные, dropdown с последними 5 уведомлениями (задолженности, дедлайны налогов, крупные операции)

UX-аспекты:
- Click на любой KPI карточке → переход на детальную страницу (Выручка → Доходы, Расходы → Расходы и т.д.)
- Period selector сохраняет выбор в localStorage, при загрузке восстанавливает
- Все виджеты загружаются параллельно с индивидуальными skeleton loaders (пульсирующие прямоугольники)
- Chart hover sync — при наведении на точку на dual line chart, все связанные данные подсвечиваются
- Real-time обновление KPI при поступлении новых транзакций (WebSocket), мягкая count-up анимация цифр
- Responsive: на экранах < 1200px KPI карточки переносятся в 2 ряда, графики — в 1 колонку stack
- Quick links адаптивны к частоте использования — самые популярные действия первые (на основе analytics)

Брендинг:
- Логотип клиники в sidebar сверху (collapsed — только иконка), синий #1E40AF brand color в active-состояниях sidebar
- Все KPI карточки с subtle left colored border (3px) — визуальная связь с цветовой кодировкой: зелёный для доходов, красный для расходов, синий для прибыли, amber для задолженностей
- Консистентные border-radius 12px для карточек, 8px для внутренних элементов, 6px для badges
- Единый стиль теней: shadow-sm по умолчанию, shadow-md при hover, shadow-lg для модальных окон

Доступность:
- Все числа с currency label (напр. «1 234 567 сум» не просто «1 234 567»), screen reader озвучивает полное значение
- Trend arrows дублируются текстом «рост 12%» / «снижение 5%» — не только цвет и стрелка
- Charts имеют альтернативную табличную форму (toggle «Показать как таблицу» под каждым графиком)
- KPI карточки — role="region" с aria-label, tab-навигация между ними
- Color contrast ratio минимум 4.5:1 для всех текстовых элементов, 3:1 для графических
- Focus visible outline 2px #1E40AF offset 2px для всех interactive элементов
- Upcoming payments table с proper <th> scope, aria-sort для сортируемых колонок

Тренды:
- Glassmorphism для KPI карточек: backdrop-blur 12px, белый фон с opacity 0.85, subtle border 1px rgba(255,255,255,0.2)
- Gradient fills под линиями графиков (от цвета линии к transparent, opacity 0.15)
- Count-up анимация при загрузке KPI цифр (от 0 до значения за 600ms ease-out)
- Smooth skeleton → content transition (fade-in 300ms) при загрузке данных
- Waterfall chart bars с staggered animation (каждый столбец появляется с задержкой 50ms)
- Micro-interactions: KPI card slight scale(1.02) при hover, trend arrow bounce при обновлении данных
- Subtle grain texture на фоне страницы для глубины
```

---

## 8.2 Доходы / Выручка

```
Разработайте современный, профессионально выглядящий интерфейс страницы «Доходы / Выручка» для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- Бухгалтерский табличный дизайн с фокусом на строгом числовом форматировании и высокой читаемости финансовых данных
- Цветовая схема: основной #1E40AF, фон #F8FAFC, доходы #10B981, возвраты #EF4444, предупреждения #F59E0B, нейтральный #94A3B8
- Все суммы выровнены по правому краю, monospace-like tabular-nums, разделители тысяч (пробел), дробная часть 2 знака, крупные суммы bold
- Типографика Inter, tabular-nums для всех числовых колонок, заголовки таблицы 11px uppercase #64748B tracking-wide
- Иконки Lucide / Phosphor — 16-18px, монохромные, цветные только для статусных badges
- Строки таблицы с чередованием (зебра): белый / #F8FAFC, hover — #EFF6FF (light blue tint), selected — #DBEAFE
- Возвратные строки выделены light red background #FEF2F2 с пометкой badge «Возврат»

Макет и структура:
- Sticky header 56px: заголовок «Доходы / Выручка», справа — кнопка Export dropdown (Excel, CSV, 1С-формат) с иконкой Download
- Фильтр-бар (sticky, под header, bg white, shadow-sm при scroll):
  - Период: date range picker с пресетами (Сегодня, Вчера, Неделя, Месяц, Квартал, Произвольный)
  - Филиал: dropdown multi-select с чекбоксами
  - Отделение: dropdown multi-select (зависит от выбранного филиала)
  - Способ оплаты: pills-toggle (Все | Наличные | Карта | Перевод | ДМС), каждый pill с цветной точкой
  - Врач: autocomplete search input с аватарками в dropdown
  - Кнопка «Сбросить фильтры» (ghost) + индикатор количества активных фильтров badge
- KPI-карточки (5 в ряд, gap 12px):
  - Общая выручка: крупная сумма green bold, под ней кол-во транзакций gray
  - Наличные: сумма + доля % (progress bar зелёный)
  - Карта: сумма + доля % (progress bar синий #3B82F6)
  - Переводы: сумма + доля % (progress bar фиолетовый #8B5CF6)
  - ДМС: сумма + доля % (progress bar оранжевый #F59E0B)
- Area chart «Выручка по дням»: одна область с градиентом #10B981 → transparent, ось X — даты, ось Y — суммы с currency formatting; toggle переключатель группировки: День | Неделя | Месяц (segmented control справа над графиком)
- DataTable (основная):
  - Колонки: Дата/время (format dd.MM.yyyy HH:mm), Номер чека/счёта (mono font, clickable link), Пациент (ФИО, clickable), Услуга(и) (если несколько — expandable «+3 услуги»), Врач (имя + аватар 24px), Сумма (right-align bold), Скидка (если есть, red text), Итого (right-align bold green), Способ оплаты (colored badge), Статус (badge: Проведено green / Возврат red / Ожидает amber)
  - Footer: sticky bottom row с column totals — жирные суммы по колонкам Сумма, Скидка, Итого
  - Pagination: показ «1-50 из 1 247» + page size selector (25/50/100)
  - Sort по любой колонке (click header, arrow indicator)

Элементы UI:
- Date range picker с preset chips (Сегодня, Эта неделя, Этот месяц, Этот квартал, Произвольный) — при выборе пресета подсвечивается синим
- Payment method pills: Все (gray), Наличные (green dot #10B981), Карта (blue dot #3B82F6), Перевод (purple dot #8B5CF6), ДМС (orange dot #F59E0B) — single select, click toggles
- KPI карточки: белый фон, shadow-sm, внутри mini progress bar показывающий долю от общей выручки
- Area chart: hover → vertical crosshair line + tooltip с суммой и датой, brush selection для zoom в период
- Способ оплаты badges: скруглённые pill-shaped, цветной фон low opacity + цветной текст (напр. bg #DCFCE7 text #166534 для наличных)
- Status badges: Проведено — green outlined, Возврат — red filled, Ожидает — amber outlined
- Row expansion: click «+3 услуги» → плавно раскрывается список услуг с ценами (indented)
- Export dropdown: иконки форматов (Excel green, CSV gray, 1С blue), hover bg подсветка
- Column totals row: sticky bottom, белый фон с top border 2px #1E40AF, суммы bold 14px

UX-аспекты:
- Мгновенная фильтрация: при изменении любого фильтра таблица обновляется с debounce 300ms, skeleton на время загрузки
- Click по строке → slide-over panel справа (400px) с полными деталями транзакции: чек, пациент, все услуги, скидки, оплата, кассир, время
- Column sorting: click header → asc, click again → desc, click third → reset; sort indicator стрелка
- Bulk export: при активных фильтрах экспортируется только отфильтрованное, с предупреждением о количестве строк
- Group toggle (День/Неделя/Месяц) синхронизирует и график, и агрегирует данные в таблице
- URL-параметры: все фильтры сохраняются в URL для bookmarking и sharing (напр. ?period=2026-03&method=cash)
- Empty state: если по фильтрам нет данных — иллюстрация + текст «Нет данных за выбранный период» + кнопка «Сбросить фильтры»
- Keyboard navigation: Tab между фильтрами, Enter применяет, Escape сбрасывает

Брендинг:
- Зелёный #10B981 доминирует как цвет доходов — KPI суммы, area chart градиент, положительные badges
- Consistent card styling: border-radius 12px, shadow-sm, white bg; таблица внутри card-контейнера
- Sidebar active state: «Доходы» подсвечен синим #EFF6FF с left border 3px #1E40AF
- Export кнопка в корпоративном стиле — outlined primary blue, hover solid fill

Доступность:
- Таблица с proper <thead>/<tbody>, <th scope="col">, aria-sort для сортируемых колонок
- Все суммы с currency label для screen reader (aria-label="Итого: 1 234 567 сум")
- Filter controls с <label> и aria-describedby для подсказок
- Badges с aria-label (не только цвет — текст «Способ оплаты: Наличные»)
- Focus ring 2px #1E40AF offset 2px на всех interactive элементах
- Chart имеет кнопку «Показать как таблицу» для screen reader пользователей
- Contrast ratio 4.5:1 для всего текста, 3:1 для графических элементов и badges

Тренды:
- Glassmorphism KPI cards: backdrop-blur 12px, bg rgba(255,255,255,0.85), subtle border
- Area chart с gradient fill (от #10B981 opacity 0.2 к transparent), smooth curved line (tension 0.4)
- Soft shadow на table wrapper card: 0 1px 3px rgba(0,0,0,0.08)
- Smooth filter transitions: при применении фильтра данные fade-out → skeleton → fade-in (200ms)
- Hover row micro-interaction: slight left shift (translateX 2px) + shadow появление
- Payment badge pills с subtle inner shadow для depth
- Sticky elements (header, filters, footer totals) с backdrop-blur эффектом при overlap контента
```

---

## 8.3 Расходы

```
Разработайте современный, профессионально выглядящий интерфейс страницы «Расходы» для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- Категоризированный финансовый дизайн с акцентом на структуре расходов, чёткое визуальное разделение по категориям
- Цветовая схема: основной #1E40AF, фон #F8FAFC, категории имеют уникальные цвета — Зарплаты #3B82F6, Аренда #8B5CF6, Коммунальные #6366F1, Расходники #F59E0B, Медикаменты #10B981, Оборудование #0EA5E9, Маркетинг #EC4899, Налоги #EF4444, Прочее #94A3B8
- Суммы right-align, bold, tabular-nums, разделители тысяч; отрицательные значения красные, нулевые — серые
- Типографика Inter, tabular-nums для всех цифр, категории — medium weight с цветной точкой-индикатором слева
- Иконки Lucide / Phosphor — 18px, каждая категория со своей иконкой (Wallet, Building, Zap, Package, Pill, Monitor, Megaphone, Receipt, MoreHorizontal)
- Карточки и таблица в white containers с shadow-sm, border-radius 12px

Макет и структура:
- Sticky header 56px: заголовок «Расходы», справа — кнопка «+ Добавить расход» (primary filled blue #1E40AF, иконка Plus, bold text white)
- Фильтр-бар (sticky):
  - Период: date range picker с пресетами (Месяц, Квартал, Год, Произвольный)
  - Категория: multi-select dropdown с цветными точками
  - Филиал: dropdown
  - Контрагент: autocomplete search
- Category pills row — горизонтальная полоса с прокруткой: каждая категория как pill-chip с цветной точкой + название + сумма за период жирно; клик по pill → фильтрует таблицу и графики; «Все» pill первый, активный — filled background соответствующего цвета; неактивные — outlined; суммы обновляются при смене периода
- Основная область — layout 70/30 (таблица / charts sidebar):
  - DataTable (70%): колонки — Дата (dd.MM.yyyy), Категория (colored badge с иконкой), Описание (text, truncated 40 chars + tooltip), Контрагент (link), Сумма (right-align bold #EF4444), Способ оплаты (badge), Документ (иконка FileText, клик → preview), Кто внёс (имя), Повторяющийся (иконка Repeat если да)
  - Pagination: 25/50/100 + total count
  - Charts sidebar (30%):
    - Monthly bars comparison: vertical bars по месяцам (текущий vs предыдущий год), два цвета, hover tooltip
    - Pie chart by category: сегменты по цветам категорий, hover → процент + сумма, legend снизу вертикальный список
- Recurring expenses section: отдельный card внизу — «Регулярные расходы» — compact table: Описание, Категория badge, Сумма, Периодичность (Ежемесячно/Еженедельно badge), Следующая дата, Контрагент, Toggle вкл/выкл; кнопка «+ Добавить регулярный»
- Add expense modal (550px width): поля — Категория (select с цветными точками), Описание (textarea), Сумма (number input с currency suffix «сум»), Дата (datepicker, default сегодня), Контрагент (autocomplete, кнопка «+ Новый» рядом), Способ оплаты (radio: Нал/Карта/Перевод), Документ (drag-and-drop upload zone), Регулярный (toggle → показ периодичности select); кнопки: Отмена (ghost), Сохранить (primary)

Элементы UI:
- Category pills: horizontal scrollable row, каждый pill — border-radius 20px, цветная точка 8px + text + sum bold; active — bg цвета категории opacity 0.15 + border 1.5px цвет; inactive — bg white border gray-200
- Category badges в таблице: rounded pill, bg цвета opacity 0.1, text цвета категории, иконка 14px слева
- Document icon: FileText Lucide 16px gray, hover → blue; click opens document preview modal (image/PDF viewer)
- Recurring indicator: Repeat icon 14px #8B5CF6 на строках с регулярными расходами
- Monthly comparison bars: два столбца рядом (этот год blue, прошлый год gray-300), hover показ обоих значений
- Pie chart: smooth hover segment expansion (slight scale), center — total sum, animated при загрузке (sweep from 0 to 360)
- Add modal: drag-and-drop zone с dashed border #CBD5E1, при hover → blue border, при drop → file preview thumbnail + progress bar
- Recurring section: toggle switch per item (green on / gray off), disabled items — opacity 0.5

UX-аспекты:
- Category pill click мгновенно фильтрует таблицу и обновляет pie chart (animated transition)
- При добавлении расхода: после сохранения — toast notification «Расход добавлен», строка появляется вверху таблицы с highlight animation (green glow fade)
- Drag-and-drop document upload с preview перед сохранением, поддержка JPG/PNG/PDF до 10MB
- Inline edit: double-click по ячейке суммы или описания → inline edit mode, Enter сохраняет, Escape отменяет
- Регулярные расходы автоматически создают записи по расписанию, уведомление за 3 дня до следующего
- Все фильтры в URL params для bookmarking; кнопка «Сбросить» возвращает к defaults
- Empty state по категории: «Нет расходов в категории за выбранный период» + suggestion добавить
- Confirmation dialog при удалении расхода: «Удалить расход "Аренда офиса" на 5 000 000 сум?»

Брендинг:
- Красный #EF4444 как доминирующий цвет расходов — суммы в таблице, total в pie chart, кнопка добавления имеет красный accent
- Category colors consistent по всей системе — те же цвета в pie chart, pills, badges, sidebar navigation
- Card containers: white bg, shadow-sm, border-radius 12px; recurring section card — dashed top border для визуального отделения
- Sidebar active: «Расходы» подсвечен, left border 3px #1E40AF

Доступность:
- Category pills — role="radiogroup" с radio для каждого, aria-checked, keyboard navigable (Arrow Left/Right)
- Таблица с <th scope="col">, aria-sort для сортируемых колонок, aria-label для icon-only кнопок
- Document links с описательным aria-label (напр. «Открыть документ: Счёт-фактура №123»)
- Drag-and-drop zone дублируется кнопкой «Выбрать файл» для keyboard/screen reader пользователей
- Все цветовые индикаторы категорий дублируются текстом — не только цвет точки
- Modal: focus trap, Escape закрывает, aria-modal="true", initial focus на первом поле
- Contrast 4.5:1 для text, 3:1 для badges и графических элементов

Тренды:
- Category pills с subtle colored left border и smooth hover background transition (150ms ease)
- Smooth chart animations: pie segments sweep in, bars grow up (staggered 30ms)
- File upload drop zone: при drag-over — border animates (dashed → pulse), bg light blue
- Glassmorphism add modal: backdrop-blur behind overlay, modal shadow-xl
- Table row hover: translateX(2px) + shadow-sm appear, subtle and fast (100ms)
- Recurring section card: subtle gradient left border (purple → blue) для visual interest
- Skeleton loaders: pulsing rectangles matching exact layout при загрузке данных
```

---

## 8.4 Зарплаты и расчёты с персоналом

```
Разработайте современный, профессионально выглядящий интерфейс управления зарплатами и расчётами с персоналом для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- Расчётно-ведомостной стиль с акцентом на таблицах начислений, строгий и точный, напоминающий профессиональные бухгалтерские ведомости
- Цветовая схема: основной #1E40AF, фон #F8FAFC, рассчитано #F59E0B (amber), утверждено #3B82F6 (blue), выплачено #10B981 (green), частично #8B5CF6 (purple), ошибка #EF4444 (red)
- Все суммы строго right-aligned, tabular-nums, разделители тысяч, 2 знака после запятой; итоговые суммы bold 14px, промежуточные regular 13px
- Типографика Inter, tabular-nums для всех финансовых колонок, заголовки таблицы 11px uppercase tracking-wider #64748B
- Иконки Lucide / Phosphor — 18px: Calculator, FileSpreadsheet, CheckCircle, CreditCard, Users, Percent
- Таблица в white card container, border-radius 12px, shadow-sm; строки с чередованием white/#F8FAFC

Макет и структура:
- Sticky header 56px: заголовок «Зарплаты», справа — Period selector: месяц/год (chevron left/right для навигации + dropdown month picker, формат «Март 2026»)
- Summary cards (4 в ряд, gap 16px):
  - Фонд оплаты труда: общая сумма bold, под ней «из них оклады: X, от услуг: Y»
  - К выплате: сумма green bold, кол-во сотрудников badge
  - Уже выплачено: сумма, процент от total (progress bar)
  - Удержания/Налоги: сумма red, детализация при hover tooltip (НДФЛ, соцвзносы)
- Payroll DataTable (основная, full width):
  - Колонки: № п/п, Сотрудник (фото 32px круглое + ФИО, при hover — tooltip с отделением), Должность (badge colored by role — Врач blue, Медсестра green, Рецепшен purple, Администратор gray), Оклад (right-align), Кол-во услуг (center, link → детализация), Выручка от услуг (right-align), % ставка, Сумма от % (right-align, auto-calculated, bg #F0FDF4 light green), Бонусы (right-align, editable inline, amber text если > 0), Удержания (right-align, editable inline, red text), Итого к выплате (right-align, bold, large font, bg #EFF6FF light blue), Статус (badge)
  - Footer sticky row: Итого по всем колонкам bold, bg #F1F5F9
  - Row highlight: строки со статусом «Выплачено» — subtle green left border 3px
- Action bar (sticky bottom, bg white, shadow-top):
  - Кнопка «Рассчитать за месяц» (primary blue, иконка Calculator) — пересчитывает все от услуг автоматически
  - Кнопка «Сформировать ведомость» (outlined blue, иконка FileSpreadsheet)
  - Кнопка «Утвердить» (outlined green, иконка CheckCircle) — активна только если всё рассчитано
  - Кнопка «Выплатить» (filled green, иконка CreditCard) — активна только если утверждено
  - Кнопка «Экспорт» (ghost, dropdown: Excel, PDF, Печать) справа

Элементы UI:
- Employee cell: фото 32px circle + ФИО в 2 строки (имя bold, фамилия regular), при отсутствии фото — initials avatar с bg цвета роли
- Role badges: pill-shaped, каждая роль свой цвет (consistent с остальной системой), 11px text
- Auto-calculated cells: bg #F0FDF4 (light green tint), readonly, пересчитываются при нажатии «Рассчитать»; при пересчёте — кратковременная highlight animation (yellow flash → normal)
- Editable cells (Бонусы, Удержания): при hover — subtle pencil icon appears; click → inline number input с currency formatting; Enter сохраняет, Escape отменяет
- Status badges flow: Черновик (gray outlined) → Рассчитано (amber filled) → Утверждено (blue filled) → Выплачено (green filled) → Частично (purple outlined)
- Services count link: underline dotted, click → slide-over с таблицей услуг сотрудника за период (дата, пациент, услуга, сумма)
- Calculate button: при нажатии → loading spinner, затем progress bar (0-100%), затем success toast + animated update цифр в таблице
- Period navigator: < Февраль 2026 | Март 2026 > — arrow buttons + click на месяц → month picker dropdown

UX-аспекты:
- One-click calculate: кнопка «Рассчитать» автоматически собирает данные из модуля услуг, вычисляет % от выручки для каждого сотрудника, обновляет таблицу
- Inline edit бонусов/удержаний: click → edit → auto-recalculate итого; изменения отмечаются dot indicator рядом с ячейкой (unsaved)
- Workflow enforcement: кнопки действий активируются последовательно (Рассчитать → Сформировать → Утвердить → Выплатить); не утверждённую ведомость нельзя выплатить
- Print-ready ведомость: при нажатии «Печать» открывается print preview — форматированная ведомость с шапкой организации, подписями, печатью placeholder
- Confirmation dialogs: «Утвердить ведомость за март 2026? После утверждения изменения невозможны.» с деталями (сумма, кол-во сотрудников)
- Payroll history: sidebar или tab «Ведомости» — список прошлых ведомостей (месяц, статус, сумма, PDF link)
- Undo для inline edits: Ctrl+Z возвращает предыдущее значение бонуса/удержания

Брендинг:
- Blue #1E40AF для основных action кнопок, green #10B981 для финальных действий (выплата), amber для промежуточных статусов
- Consistent role badge colors: Врач #3B82F6, Медсестра #10B981, Рецепшен #8B5CF6, Бухгалтер #F59E0B, Админ #64748B
- Card containers: white bg, border-radius 12px, shadow-sm; action bar — white bg, shadow-top (0 -2px 8px rgba)
- Ведомость print template: шапка с логотипом клиники, name, ИНН, адрес; таблица со всеми колонками; строка подписей внизу

Доступность:
- Таблица с <th scope="col">, aria-sort, role="grid" для editable cells
- Inline edit: aria-label «Редактировать бонус для [ФИО]», при входе в edit mode — screen reader объявляет «Режим редактирования»
- Status badges с текстовым содержимым (не только цвет), aria-label описывает статус
- Action buttons: disabled state с aria-disabled="true" и tooltip объясняющий почему кнопка недоступна
- Photo alt text: «Фото [ФИО]», initials avatar — aria-hidden, имя в тексте рядом
- Focus management: Tab навигация по editable cells, Enter → edit mode, Escape → выход
- Все суммы с aria-label включающим currency

Тренды:
- Glassmorphism summary cards: backdrop-blur, bg white 85% opacity, subtle gradient border
- Smooth calculate animation: progress bar с percentage, при завершении — cells update с count-up анимацией (500ms)
- Status badge transition: при смене статуса — color morph animation (amber → green fill за 300ms)
- Inline edit: cell expand slightly при focus (scale 1.02), subtle blue border glow
- Print preview: slide-up modal с paper-like styling (bg white, shadow-2xl, page margins visible)
- Staggered row appearance при загрузке (каждая строка с задержкой 20ms fade-in from left)
- Action bar кнопки: subtle pulse animation на следующем доступном действии (привлечение внимания)
```

---

## 8.5 Настройки начислений

```
Разработайте современный, профессионально выглядящий интерфейс настроек начислений персонала для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- Конфигурационный интерфейс с формами и таблицами, чистый и организованный, секционный layout
- Цветовая схема: основной #1E40AF, фон #F8FAFC, положительные изменения #10B981, предупреждения #F59E0B, ошибки #EF4444
- Числовые поля с tabular-nums, процентные значения выделены blue bold, суммы оклада — regular
- Типографика Inter, секции разделены заголовками 14px semibold #0F172A, описания 13px #64748B
- Иконки Lucide / Phosphor — 18px: Settings, Percent, DollarSign, Users, Award, MinusCircle, Calculator
- Секции в white cards с shadow-sm, border-radius 12px, gap 20px между карточками

Макет и структура:
- Sticky header 56px: заголовок «Настройки начислений», справа — кнопка «Сохранить изменения» (primary blue, disabled до первого изменения) + индикатор unsaved changes (amber dot)
- Tabs navigation: Сотрудники | Глобальные по ролям | Пороги бонусов | Типы удержаний | Налоговые ставки
- Tab «Сотрудники» (основной):
  - Фильтр: поиск по ФИО, фильтр по роли dropdown, фильтр по филиалу
  - Staff list DataTable: Сотрудник (фото 28px + ФИО), Должность badge, Филиал, Оклад (editable number input с currency «сум», right-align), % от услуг (editable number input с suffix «%», center), Применимые услуги (multi-select chips — какие услуги учитываются для %), Действия (reset to default icon button)
  - Каждая изменённая ячейка подсвечивается amber left border до сохранения
  - Batch actions: «Установить % для всех врачей» — opens inline form
- Tab «Глобальные по ролям»:
  - Cards по ролям (Врач, Медсестра, Рецепшен и т.д.): card с заголовком роли + badge, внутри — Базовый оклад (number input), Стандартный % от услуг (number input), Описание (text); при изменении — все сотрудники этой роли без индивидуальных настроек обновляются
  - Warning banner: «Изменения применятся ко всем сотрудникам без индивидуальных настроек»
- Tab «Пороги бонусов»:
  - Threshold table: Условие (текст), Порог (число), Бонус (число или %), Описание; пример строк: «Выручка > 50M» → «3% бонус», «Пациентов > 200» → «500 000 сум»
  - Кнопка «+ Добавить порог» → inline new row с формой
  - Toggle enable/disable для каждого порога
- Tab «Типы удержаний»:
  - CRUD table: Название (text input), Тип (fixed сум / percent %), Значение (number input), Обязательное (toggle), Описание
  - Предустановленные: НДФЛ, Социальные взносы, ИНПС — не удаляемые (delete disabled), editable значения
  - Кнопка «+ Добавить тип» → new row; Delete кнопка с confirmation
- Tab «Налоговые ставки»:
  - Simple form cards: НДФЛ (% input), Социальные взносы (% input), ИНПС (% input), НДС (% input); каждый с описанием когда применяется и ссылкой на законодательный акт
  - Effective date: начало действия ставки (datepicker), история изменений ставок (expandable timeline)

Элементы UI:
- Editable cells: default — styled as text (не input), при hover — pencil icon appears, при click — transforms to input с focus; blue border во время редактирования
- Percentage inputs: number input max 100, step 0.5, suffix «%» inside input (right-aligned adornment)
- Currency inputs: number input, thousands separator автоматический, suffix «сум» adornment
- Service chips (multi-select): компактные pill chips с x-button для удаления, «+ Добавить» chip для добавления, dropdown с чекбоксами
- Unsaved indicator: amber dot рядом с «Сохранить», изменённые строки — amber left border 3px, при hover — tooltip «Есть несохранённые изменения»
- Role cards (глобальные): icon роли + title + employee count badge, expandable sections
- Threshold rows: drag handle для reorder (GripVertical icon), toggle switch, conditional highlight (active row bg white, disabled row bg gray-50 opacity 0.6)
- Save button: disabled → amber (has changes) → click → loading spinner → green checkmark (success) → back to disabled

UX-аспекты:
- Inline editing с auto-save draft: изменения сохраняются в draft (localStorage), финальное сохранение — по кнопке «Сохранить»
- Unsaved changes warning: при попытке уйти со страницы — browser confirm dialog «У вас есть несохранённые изменения»
- Batch operations: «Установить для всех [роль]» — dialog с полями, preview affected employees count, confirm
- Reset to default: per-employee кнопка сбрасывает к глобальным настройкам роли, с confirmation
- Validation: % не может быть > 100 или < 0, оклад не может быть отрицательным; inline error messages red
- CRUD для удержаний: добавление → строка появляется с зелёной подсветкой, удаление → confirmation modal, fade-out animation
- History timeline для налоговых ставок: при hover — tooltip с датой и предыдущим значением
- Tab state сохраняется в URL hash для bookmarking

Брендинг:
- Blue #1E40AF для primary actions и active tab indicator (bottom border 2px)
- Role badges consistent: те же цвета что в зарплатной таблице (Врач blue, Медсестра green и т.д.)
- Section cards: white bg, shadow-sm, border-radius 12px; tabs — underline style, clean
- Warning banners: amber bg #FEF3C7, amber border-left 4px #F59E0B, amber icon AlertTriangle

Доступность:
- Все input fields с <label>, aria-describedby для дополнительных пояснений (напр. «Процент от стоимости оказанных услуг»)
- Editable table cells: role="gridcell", aria-label, keyboard Enter для edit mode, Escape для cancel
- Tabs: role="tablist", role="tab", aria-selected, aria-controls, keyboard Arrow Left/Right navigation
- Toggle switches: role="switch", aria-checked, aria-label описывающий что toggle контролирует
- Disabled delete buttons (предустановленные): aria-disabled="true", tooltip «Системный тип, нельзя удалить»
- Focus management: после сохранения — focus возвращается к первому изменённому элементу или к Save button

Тренды:
- Tab underline indicator: animated slide (translateX transition 200ms) при переключении tabs
- Inline edit transition: text → input morphing animation (border appears, padding adjusts smoothly)
- Save button state machine: disabled (gray) → changes detected (amber pulse once) → saving (spinner) → saved (green check) → disabled (gray) — smooth color transitions
- Card sections: subtle hover elevation (shadow-sm → shadow-md) при наведении
- Threshold rows: drag-and-drop с smooth reorder animation (other rows slide to make room)
- Toast notifications при сохранении: slide-in from top-right, green bg, checkmark icon, auto-dismiss 3s
- Responsive: на < 1200px таблица сотрудников горизонтально скроллится, карточки ролей — stack в 1 колонку
```

---

## 8.6 ДМС / Страховые компании

```
Разработайте современный, профессионально выглядящий интерфейс управления ДМС и страховыми компаниями для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- Корпоративный CRM-подобный дизайн с карточками контрагентов, акцент на статусах договоров и финансовых балансах
- Цветовая схема: основной #1E40AF, фон #F8FAFC, активный договор #10B981, истекающий #F59E0B, истёкший #EF4444, приостановлен #94A3B8
- Балансы и суммы — bold tabular-nums, положительный баланс green, отрицательный (задолженность) red, нулевой gray
- Типографика Inter, tabular-nums для финансовых данных, названия компаний 16px semibold, описания 13px #64748B
- Иконки Lucide / Phosphor — 20px: Shield, FileText, Calendar, Wallet, Building2, AlertTriangle, CheckCircle
- Карточки: white bg, border-radius 12px, shadow-sm, left colored border 4px по статусу

Макет и структура:
- Sticky header 56px: заголовок «ДМС / Страховые компании», справа — кнопка «+ Добавить компанию» (primary blue), кнопка «Сверка» (outlined)
- Summary row (3 карточки в ряд):
  - Активных договоров: число large bold blue, «из X компаний» subtitle
  - Ожидаемые поступления: сумма bold green, «по X реестрам» subtitle
  - Задолженность страховых: сумма bold red (если есть), «просрочено N дней» subtitle amber
- Company cards grid (2 колонки, gap 20px): каждая карточка содержит:
  - Header: логотип/иконка компании (48px, если нет — placeholder Shield icon в круге с initials), название компании bold 16px, тип badge (ДМС / ОМС / Корпоративный)
  - Основная информация: Договор № (mono font), Действует до (дата, colored — green если > 3 мес, amber < 3 мес, red если истёк), Тарифный план (text)
  - Финансовый блок: Баланс (крупно, colored), Выставлено за период / Оплачено за период / Задолженность — 3 значения в ряд
  - Статус badge: Активен (green filled), Истекает (amber outlined + «через N дней»), Истёк (red filled), Приостановлен (gray)
  - Footer actions: кнопка «Реестры» (link style, иконка FileText), кнопка «Акт сверки» (link style, иконка FileCheck), кнопка «Редактировать» (icon button, Pencil)
- Click на карточку → переход к странице реестров (8.7) с фильтром по этой компании
- Actions panel (при наведении на карточку — float кнопки):
  - «Создать реестр» → redirect к wizard (8.7)
  - «Запустить сверку» → opens reconciliation slide-over (сравнение данных: Выставлено vs Оплачено, таблица расхождений)

Элементы UI:
- Company cards: white bg, shadow-sm → shadow-md при hover, left border 4px цвета статуса; transition all 200ms
- Status badges: pill-shaped, filled для критических (Активен green, Истёк red), outlined для промежуточных (Истекает amber)
- Contract expiry: date с цветовой индикацией — green text если > 90 дней, amber если 30-90, red если < 30 или истёк; рядом иконка Calendar
- Balance display: крупный шрифт 20px bold, green если положительный (нам должны), red если отрицательный (мы должны), zero — gray
- Financial mini-row: 3 значения в ряд с labels сверху (10px uppercase gray) — Выставлено | Оплачено | Долг — subtle dividers между ними
- Logo placeholder: круг 48px bg #EFF6FF, initials компании bold blue; если есть лого — img cover круглый
- Action links: text-style кнопки с иконками, hover underline, blue color
- Reconciliation slide-over: 500px width, header с названием компании, таблица сверки (Реестр №, Сумма выставлена, Сумма оплачена, Разница colored), итого row, кнопка «Сформировать акт» (primary)

UX-аспекты:
- Cards sortable: по умолчанию по статусу (проблемные сверху), toggle — по имени A-Z, по балансу, по дате истечения
- Search: поиск по названию компании, instant filter cards (не показанные — animated collapse)
- Quick actions: hover card → action buttons float appear (create registry, reconciliation)
- Contract expiry alerts: карточки с истекающими договорами имеют amber pulsing border, с истёкшими — red steady border
- Click «Реестры» → navigates to 8.7 с preset filter по компании
- Click «Акт сверки» → slide-over с данными, возможность скачать PDF/Excel
- Add company modal: форма — Название, ИНН, Тип (ДМС/ОМС/Корп), Номер договора, Дата начала/окончания, Контактное лицо, Телефон, Email, Логотип upload
- Карточки responsive: на < 1200px → 1 колонка

Брендинг:
- Blue #1E40AF для корпоративного, формального стиля; green для активных, red для проблемных
- Company cards единообразны — consistent padding 20px, border-radius 12px, status-color left border
- Sidebar active: «ДМС / Страховые» highlighted
- Reconciliation акт: print template с шапкой клиники и компании, таблица, подписи сторон

Доступность:
- Cards: role="article" или role="listitem" (если в list), aria-label «Страховая компания [название], статус: [статус]»
- Balance: aria-label с полным описанием «Баланс: плюс 5 000 000 сум — компания должна клинике»
- Status badges: текст внутри badge достаточен, не только цвет; дополнительно aria-label если badge содержит только icon
- Contract expiry: aria-label «Договор действует до [дата], осталось [N] дней»
- Action buttons: aria-label описательные «Открыть реестры компании [название]»
- Focus ring 2px #1E40AF offset 2px на cards и кнопках; Tab навигация между карточками

Тренды:
- Card hover: elevation transition shadow-sm → shadow-lg, slight translateY(-2px), 200ms ease
- Status border pulse: amber border для истекающих — subtle pulse animation (opacity 0.5 → 1.0 loop)
- Glassmorphism summary cards: backdrop-blur, bg white 85%, subtle gradient border
- Staggered card appearance: при загрузке карточки появляются с задержкой 50ms каждая (fade-in + translateY)
- Reconciliation slide-over: slide-in from right, 300ms ease-out, backdrop dim
- Logo circle: subtle gradient border (blue to purple) вокруг placeholder initials
- Balance count-up animation при загрузке (от 0 к значению за 400ms)
```

---

## 8.7 Реестры ДМС

```
Разработайте современный, профессионально выглядящий интерфейс управления реестрами ДМС для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- Документо-ориентированный финансовый дизайн, акцент на табличных данных и workflow статусов
- Цветовая схема: основной #1E40AF, фон #F8FAFC, статусы — Формируется #94A3B8 (gray), Проверяется #F59E0B (amber), Отправлен #3B82F6 (blue), Принят #10B981 (green), Оплачен #059669 (dark green), Отклонён #EF4444 (red)
- Суммы bold tabular-nums, номера реестров mono font, даты в формате dd.MM.yyyy
- Типографика Inter, tabular-nums для числовых данных, mono для номеров реестров и документов
- Иконки Lucide / Phosphor — 18px: FileSpreadsheet, Send, Check, XCircle, Eye, Printer, Download, Plus
- Таблицы в white cards, shadow-sm, border-radius 12px; rows с left border цвета статуса

Макет и структура:
- Sticky header 56px: заголовок «Реестры ДМС», справа — кнопка «+ Создать реестр» (primary blue filled, иконка Plus)
- Фильтр-бар (sticky):
  - Страховая компания: dropdown с поиском (все компании из 8.6)
  - Период: date range picker с month presets
  - Статус: pills toggle (Все | Формируется | Отправлен | Принят | Оплачен | Отклонён) — каждый pill с цветной точкой и count badge
- Summary cards (4 в ряд):
  - Всего реестров: число + «за период» subtitle
  - На сумму: total bold blue
  - Оплачено: сумма green + процент
  - Ожидает оплаты: сумма amber
- Registry DataTable (основная):
  - Колонки: Номер реестра (mono, clickable link → detail view), Период (месяц/год), Страховая компания (name + small logo), Кол-во услуг (center), Кол-во пациентов (center), Сумма (right-align bold), Статус (colored badge с icon), Дата отправки (если отправлен), Дата оплаты (если оплачен), Действия (icon buttons)
  - Actions per row зависят от статуса: Формируется → [Редактировать, Удалить], Проверяется → [Просмотр], Отправлен → [Просмотр, Отозвать], Принят → [Просмотр, Печать], Оплачен → [Просмотр, Печать], Отклонён → [Просмотр, Исправить, Переотправить]
  - Row left border 3px цвета статуса
  - Pagination: 25/50/100 + total
- Create Registry Wizard (multi-step, full page or large modal 800px):
  - Step 1 «Компания»: выбор страховой из dropdown с карточками (logo + name + договор №), single select
  - Step 2 «Период»: month picker (один месяц или custom range), показ количества услуг за период preview
  - Step 3 «Сбор данных»: автоматический сбор — progress bar + лог (Найдено X пациентов, Y услуг, сумма Z); кнопка «Собрать» → loading → результат
  - Step 4 «Проверка»: таблица собранных позиций (Пациент, Полис №, Дата услуги, Услуга, Врач, Сумма, Покрытие checkbox, Замечание если не покрывается); возможность удалить строки, исправить суммы; итого внизу; warnings если услуга не входит в покрытие (amber row highlight)
  - Step 5 «Отправка»: summary card (компания, период, позиций, сумма), кнопка «Сформировать и отправить» (primary) или «Сохранить как черновик» (ghost)
  - Stepper navigation: numbered circles 1-5 с линией между ними, completed — green check, current — blue filled, upcoming — gray outlined
- Detail view (click на реестр):
  - Header: Реестр № X, компания, период, статус large badge, дата создания, дата отправки
  - Status timeline: горизонтальная линия с точками (Создан → Отправлен → Принят → Оплачен), текущий статус highlighted, даты под точками
  - Items table: полная таблица позиций (Пациент, Полис, Дата, Услуга, Сумма, Статус позиции)
  - Actions: Печать (opens print preview), Экспорт Excel, Скачать PDF
  - Print layout: официальная форма реестра с шапкой клиники, таблицей, итого, подписью, печатью placeholder

Элементы UI:
- Status badges: pill-shaped, filled — Формируется gray bg + gray text, Отправлен blue bg + white text, Принят green bg + white text, Оплачен dark-green bg + white text, Отклонён red bg + white text; каждый с маленькой иконкой (Clock, Send, Check, CreditCard, XCircle)
- Status pills в фильтре: каждый с count badge (количество реестров в этом статусе), active — filled, inactive — outlined
- Wizard stepper: circles 32px, number inside, connected line; completed step — bg green + white checkmark; current — bg blue + white number; upcoming — bg white + gray border + gray number; line between — green if passed, gray if not
- Coverage warnings: в step 4 wizard — строки с непокрытыми услугами имеют amber bg #FEF3C7, иконка AlertTriangle, tooltip с объяснением
- Auto-collect progress: animated progress bar с текстовым логом под ним (fade-in lines: «Сбор данных по полисам... Найдено 47 пациентов... 123 услуги... Сумма: 45 600 000 сум»)
- Print preview: paper-like modal (white bg, slight shadow simulating paper edge, margins visible), zoom controls, print button
- Timeline в detail view: horizontal, dots connected by line, completed dots green + check, current pulsing, future gray

UX-аспекты:
- Wizard сохраняет progress: при закрытии на Step 3+ → данные сохранены как draft, можно продолжить позже
- Auto-collect использует данные из модуля расписания/приёмов — автоматически находит ДМС-пациентов за период
- Coverage check: автоматическая проверка что услуга входит в покрытие полиса, несоответствия highlight amber
- Editable items в Step 4: можно удалить строку (checkbox + batch delete), изменить сумму (inline edit), добавить замечание
- Отклонённый реестр: при нажатии «Исправить» — открывается wizard с Step 4, позиции с проблемами highlighted red
- Status tracking: после отправки — статус обновляется (manual или через интеграцию), notification при изменении
- Bulk actions: выбрать несколько реестров → batch export, batch print

Брендинг:
- Blue #1E40AF для primary workflow, green для завершённых этапов, amber для предупреждений
- Registry numbers mono font — визуально отличимы от обычного текста
- Insurance company logos отображаются где возможно (таблица, detail view, wizard step 1)
- Print template: official styling с логотипом клиники, рамкой, нумерацией страниц

Доступность:
- Wizard: role="tablist" для stepper, aria-current="step" для текущего шага, описание каждого шага
- Table: <th scope="col">, aria-sort, row selection checkbox с aria-label
- Status badges: text content sufficient, не только цвет; screen reader объявляет «Статус: Отправлен»
- Coverage warnings: aria-label «Внимание: услуга не покрывается полисом» на amber строках
- Print preview: accessible, zoom buttons с aria-label, close button visible
- Focus management в wizard: auto-focus на primary element каждого шага

Тренды:
- Wizard step transitions: slide-left animation при переходе forward, slide-right при back (200ms ease)
- Progress bar во время сбора данных: gradient animated stripes (barber pole), log entries fade-in
- Status timeline: animated line drawing (stroke-dasharray animation) при загрузке detail view
- Card hover в wizard step 1 (выбор компании): elevation lift + blue border appear
- Table row left border: smooth color transition при смене статуса
- Glassmorphism на summary cards и wizard container
- Staggered row animation в таблице позиций wizard step 4 (fade-in 20ms delay each)
```

---

## 8.8 Налоговая отчётность

```
Разработайте современный, профессионально выглядящий интерфейс налоговой отчётности для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- Серьёзный, deadline-ориентированный дизайн с акцентом на сроках и статусах, строгая цветовая семантика
- Цветовая схема: основной #1E40AF, фон #F8FAFC, подано вовремя #10B981 (green), не подано #F59E0B (amber), просрочено #EF4444 (red), предстоит #3B82F6 (blue)
- Суммы налогов bold tabular-nums right-aligned, даты крупные readable, deadline countdown prominent
- Типографика Inter, tabular-nums для сумм, даты bold 14px, countdown numbers 20px bold colored
- Иконки Lucide / Phosphor — 18px: Calendar, FileText, Calculator, Clock, AlertTriangle, CheckCircle, Send, Receipt
- Cards с status-dependent left border 4px, white bg, shadow-sm, border-radius 12px

Макет и структура:
- Sticky header 56px: заголовок «Налоговая отчётность», справа — year selector (dropdown «2026»), кнопка «Сформировать отчёт» (primary blue)
- Monthly tax calendar (верхняя секция):
  - 12 колонок (Январь—Декабрь), компактный grid, текущий месяц highlighted blue border
  - В каждой ячейке месяца: цветные точки-индикаторы по видам налогов (hover → tooltip с деталями), summary — «3 из 5 подано» или «Всё подано» green check
  - Прошедшие месяцы: green bg если всё подано, red bg если есть просроченные, amber если частично
  - Click на месяц → скролл к детальной секции месяца ниже
- Tax types list (основная секция, cards или expandable rows):
  - Card per tax type: НДС, Налог на прибыль, НДФЛ, Социальные взносы, ИНПС, Земельный налог, Другие
  - Каждая карточка: название налога + иконка, ставка (%), расчётная сумма к уплате bold colored, deadline дата (с countdown «через 12 дней» или «просрочено 5 дней» red), статус badge (Не рассчитано gray, Рассчитано amber, Подано blue, Оплачено green, Просрочено red), actions (Рассчитать, Сформировать отчёт, Отметить как поданный)
  - Expandable: click → раскрывается с details: база расчёта, формула, промежуточные значения, ссылка на закон
- Tax calculator section:
  - Input card: поля — Выручка за период (auto-filled from доходов), Расходы за период (auto-filled), ФОТ (auto-filled), Авансовые платежи уже уплаченные
  - Output card: рассчитанные суммы по каждому налогу — НДС, Налог на прибыль, НДФЛ, Соцвзносы, ИНПС — с формулами visible (expandable), Итого к уплате large bold
  - Кнопка «Пересчитать» (primary), «Применить к отчёту» (outlined)
- Report generation section:
  - Cards: доступные формы отчётов (Расчёт НДС, Декларация по прибыли, Справка 2-НДФЛ и т.д.)
  - Для каждого: иконка, название, период, кнопка «Сформировать» → generates document (preview + download)
  - Generated reports appear в list ниже
- Filed history table:
  - DataTable: Тип отчёта, Период, Дата подачи, Способ (Электронно/Бумажно badge), Статус (Принято green / На проверке blue / Отклонено red), Документ (PDF link), Примечание
  - Sort by date descending, filter by type and period

Элементы UI:
- Monthly calendar grid: compact 12-column, colored status indicators (dots/cells), current month blue glow border
- Tax type cards: expandable accordion, left border 4px colored by status, header row with summary info, expand → detailed calculation
- Deadline countdown: prominent display — green text if > 14 days, amber if 7-14, red if < 7 or overdue; рядом — animated clock icon for urgent
- Calculator: input fields с auto-populated values (gray bg, editable), output fields readonly (blue bg, bold values), formulas в expandable sections
- Status badges consistent: gray (не рассчитано), amber (рассчитано), blue (подано), green (оплачено), red (просрочено)
- Report cards: document icon 32px, title, description, action button; generated — green checkmark overlay
- History table: row styling — green left border для принятых, red для отклонённых
- Document PDF links: FileText icon + «Скачать», hover underline

UX-аспекты:
- Auto-populate calculator: данные из модулей доходов, расходов, зарплат подтягиваются автоматически, бухгалтер может скорректировать
- Tax calendar click → jump to detailed section with smooth scroll animation
- Report generation: click «Сформировать» → progress indicator → preview modal (paper-like) → кнопки Download PDF / Print
- Mark as filed: кнопка «Отметить как поданный» → modal с полями: Дата подачи, Способ (Электронно/Бумажно), Примечание; после — статус обновляется
- Reminder system: настройка напоминаний за N дней до deadline (7, 3, 1 день) — toggle per tax type
- Calculator formulas: expand для прозрачности — бухгалтер видит как рассчитана каждая сумма (база * ставка - авансы = итого)
- Filed history searchable и filterable, export в Excel

Брендинг:
- Deadline-urgency цветовая система: green → всё хорошо, amber → скоро, red → просрочено; consistent по всей странице
- Calendar визуально напоминает fiscal year overview — профессиональный бухгалтерский инструмент
- Generated reports: print template с шапкой организации (название, ИНН, адрес), официальный формат

Доступность:
- Calendar: role="grid", каждая ячейка role="gridcell", aria-label «Январь 2026, подано 3 из 5 отчётов»
- Deadline countdown: aria-label «Срок подачи НДС: 25 апреля 2026, осталось 12 дней»
- Tax cards: expandable — aria-expanded, aria-controls, Enter/Space toggle
- Calculator inputs: <label> с описательным текстом, связанные hints через aria-describedby
- Status badges: text content, aria-label с полным описанием
- Filed history table: <th scope>, sortable columns с aria-sort

Тренды:
- Calendar cells: hover elevation + tooltip fade-in, current month subtle blue glow pulse
- Tax card expand: smooth height animation (max-height transition 300ms ease), content fade-in
- Calculator auto-compute: при изменении input → output values animate (count-up/down effect)
- Deadline countdown: numbers с subtle scale pulse при < 3 дней (attention-grabbing)
- Report generation progress: animated gradient progress bar, completion checkmark animation (SVG draw)
- Glassmorphism on calculator card: backdrop-blur, semi-transparent bg
- History table rows: staggered fade-in при загрузке (20ms delay each)
```

---

## 8.9 Налоговый календарь

```
Разработайте современный, профессионально выглядящий интерфейс налогового календаря для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- Календарный deadline-tracker дизайн, полноэкранный календарь с цветовой кодировкой событий
- Цветовая схема: основной #1E40AF, фон #F8FAFC, выполнено #10B981 (green), предстоит #3B82F6 (blue), скоро (< 7 дней) #F59E0B (amber), просрочено #EF4444 (red), сегодня highlight #EFF6FF bg
- Дни с событиями имеют цветные dots внизу ячейки, при множестве — stacked dots (max 4 visible + «+N»)
- Типографика Inter, числа дат 14px medium, события 12px regular, суммы 12px bold tabular-nums
- Иконки Lucide / Phosphor — 16px в событиях: Receipt (НДС), Calculator (прибыль), Users (НДФЛ), Shield (соцвзносы), Landmark (земельный)
- Ячейки календаря: white bg, hover #F8FAFC, border 1px #E2E8F0; ячейки с просроченными — subtle red bg #FEF2F2

Макет и структура:
- Sticky header 56px: заголовок «Налоговый календарь», controls — Месяц/Год navigation (< Март 2026 >), toggle Месяц | Квартал | Год views, кнопка «Настроить напоминания» (ghost, иконка Bell)
- Full calendar grid (основная, ~70% высоты):
  - Month view: 7 колонок (Пн-Вс), 5-6 строк, каждая ячейка — число дня, цветные event dots/chips внизу
  - Event chips в ячейке: compact pill (colored bg opacity 0.15 + colored text), max 3 visible + «ещё N» link
  - Сегодня: ячейка с blue circle вокруг числа + light blue bg #EFF6FF
  - Days с overdue events: red dot indicator в углу ячейки, subtle red bg tint
  - Quarter view: 3 месяца рядом, mini-calendar style, click → month zoom
  - Year view: 12 mini-months grid 4x3, color-coded cells (green/amber/red intensity), click → month
- Click на день → detail panel (right sidebar 360px slide-in):
  - Date header: «25 марта 2026, среда»
  - Events list: карточки событий вертикально stacked:
    - Каждое: иконка + Название налога, Сумма к уплате bold, Статус badge (Просрочено red / Предстоит amber / Выполнено green), Countdown «через 3 дня» или «просрочено 5 дней»
    - Actions per event: «Рассчитать» → переход к калькулятору, «Отметить выполненным» → status change, «Подробнее» → переход к 8.8
  - Empty state: «Нет налоговых событий на эту дату»
- Deadlines list (нижняя секция, collapsible):
  - DataTable: Дата, Налог (с иконкой), Сумма, Статус badge, Осталось дней (colored countdown), Действия
  - Sort by date, filter by status
  - Группировка: по неделям или месяцам с section headers
- Reminders config (modal при click «Настроить»):
  - Per tax type: toggle вкл/выкл + напоминания за N дней (multi-select: 30, 14, 7, 3, 1 день)
  - Способ: checkboxes — В системе (bell notification), Email, Telegram
  - Time: в какое время отправлять (time picker)

Элементы UI:
- Calendar cell event dots: цветные круги 6px внизу ячейки, max 4 в ряд, tooltip при hover «НДС — 25 000 000 сум — Предстоит»
- Event chips (if space allows): compact pill 20px height, icon 12px + truncated name, colored by status
- Today indicator: blue circle around date number (border 2px #1E40AF), bg #EFF6FF
- Overdue indicator: red dot 8px top-right corner of cell, pulsing animation
- Detail panel events: card per event, left border 3px colored by status, padding 12px, shadow-xs
- Countdown display: large number + «дней» text, colored (green > 14, amber 7-14, red < 7), red bold if overdue
- Quarter/Year mini-calendars: day cells tiny (16x16px), colored by intensity (white=no events, green=done, amber=pending, red=overdue)
- Reminder toggles: switch components per tax type per reminder interval, compact grid layout

UX-аспекты:
- Click on calendar day → smooth slide-in panel from right (300ms), shows all events for that day
- Click event in panel → navigate to corresponding page (налоговая отчётность, калькулятор)
- «Отметить выполненным» → confirmation modal, status updates immediately, calendar dot changes to green
- View switching (Month/Quarter/Year) — smooth animated transition, data preserved
- Drag navigation: swipe/drag на calendar для перехода между месяцами (touch support)
- Keyboard: Arrow keys между днями, Enter открывает detail panel, Escape закрывает
- Upcoming deadlines auto-sort: ближайшие deadline видны в deadlines list без необходимости навигации по календарю
- Reminder preferences saved per user, push notifications через browser notification API

Брендинг:
- Calendar styling: clean, professional, не перегруженный — фокус на readability и quick scanning
- Color system consistent: green=done, amber=pending/soon, red=overdue — используется повсеместно
- Today highlighted prominently — пользователь всегда видит текущую дату
- Event icons consistent с типами налогов из 8.8

Доступность:
- Calendar: role="grid", ячейки role="gridcell", aria-label «25 марта 2026, 2 налоговых события: НДС — предстоит, НДФЛ — выполнено»
- Navigation: aria-label на кнопках < > «Предыдущий месяц» / «Следующий месяц»
- Today: aria-current="date"
- Event dots: не только цвет — в ячейке также текстовое описание при screen reader (скрытое визуально)
- Detail panel: role="complementary", focus trap когда открыт, Escape closes
- Reminder toggles: role="switch", aria-checked, aria-label «Напоминание о НДС за 7 дней: включено»
- Countdown: aria-label «До срока подачи НДС осталось 3 дня» (не только число)
- Высокий контраст: calendar grid lines visible, text contrast 4.5:1

Тренды:
- Calendar cell hover: subtle bg transition + elevation (shadow-xs appear), event dots scale up slightly
- Detail panel slide-in: 300ms ease-out from right, backdrop dim за основным контентом
- View transitions: month → quarter → year — morphing animation (cells resize smoothly)
- Overdue red dot: pulse animation (scale 1.0 → 1.3 → 1.0, opacity 0.7 → 1.0, loop 2s)
- Status change animation: dot color morph (amber → green smooth transition 400ms) при отметке выполненным
- Mini-calendars (Quarter/Year): subtle parallax effect при hover (slight perspective tilt)
- Reminder modal: glassmorphism, smooth expand from bell icon position (origin animation)
```

---

## 8.10 Контрагенты

```
Разработайте современный, профессионально выглядящий интерфейс управления контрагентами для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- CRM-подобный справочник контрагентов, clean data table с фильтрами, акцент на балансах и типах
- Цветовая схема: основной #1E40AF, фон #F8FAFC, положительный баланс (нам должны) #10B981, отрицательный баланс (мы должны) #EF4444, нулевой #94A3B8, типы — Поставщик #3B82F6, Страховая #F59E0B, Арендодатель #8B5CF6, Подрядчик #0EA5E9, Прочее #94A3B8
- Суммы bold tabular-nums right-aligned, ИНН mono font, названия 14px medium
- Типографика Inter, tabular-nums для всех числовых данных, ИНН — mono (JetBrains Mono или Inter с tabular features)
- Иконки Lucide / Phosphor — 18px: Building2, Truck, Shield, Home, User, Phone, Mail, Plus, Search, Filter
- Таблица в white card, shadow-sm, border-radius 12px, строки с чередованием

Макет и структура:
- Sticky header 56px: заголовок «Контрагенты», справа — кнопка «+ Добавить» (primary blue filled, иконка Plus)
- Toolbar row (sticky):
  - Search input: placeholder «Поиск по названию или ИНН...», иконка Search слева, clear X справа, instant search с debounce 300ms
  - Filters: Тип (pills toggle: Все | Поставщик | Страховая | Арендодатель | Подрядчик | Прочее — каждый с цветной точкой), Баланс (dropdown: Все / Нам должны / Мы должны / Нулевой), Статус (Активный / Архив toggle)
  - View toggle: Table | Cards (icon buttons), sort dropdown (По имени A-Z, По балансу, По последней операции)
- DataTable (основной view):
  - Колонки: Название (bold 14px, clickable → карточка 8.11), ИНН (mono font 12px, copy button при hover), Тип (colored badge — Поставщик blue, Страховая amber, Арендодатель purple, Подрядчик cyan, Прочее gray), Контактное лицо (имя 13px), Телефон (mono, clickable tel: link), Email (clickable mailto: link), Баланс (right-align, bold, colored — green с «+» prefix если нам должны, red с «-» если мы должны, gray «0» если нулевой), Действия (icon buttons: Eye → карточка, Pencil → редактирование, FileCheck → акт сверки)
  - Sort: click на header колонки, arrow indicator
  - Row hover: bg #EFF6FF, row click → navigate to 8.11 (карточка контрагента)
  - Pagination: 25/50/100, total count, page navigation
  - Empty state: illustration + «Контрагенты не найдены» + кнопка «Добавить первого»
- Cards view (альтернативный): grid 3 колонки, каждая card — название bold, тип badge, ИНН, контакт, телефон, баланс colored large; click → 8.11
- Add/Edit modal (500px width):
  - Секция «Основное»: Название (text input required), ИНН (number input с validation, 9 или 12 цифр), Тип (select с цветными dots), Юридический адрес (textarea)
  - Секция «Контакты»: Контактное лицо (text input), Должность (text input), Телефон (tel input с маской), Email (email input), Веб-сайт (url input)
  - Секция «Банковские реквизиты»: Банк (text input), Расчётный счёт (number input mono), МФО (number input)
  - Секция «Дополнительно»: Договор № (text input), Дата договора (datepicker), Примечания (textarea)
  - Кнопки: Отмена (ghost), Сохранить (primary blue)

Элементы UI:
- Type badges: pill-shaped, colored bg opacity 0.12 + colored text bold 11px, иконка 12px перед текстом (Truck для поставщика, Shield для страховой, Home для арендодателя, Wrench для подрядчика)
- Balance display: monospace-like font, + prefix для положительного (green bold), - prefix для отрицательного (red bold), 0 для нулевого (gray); hover → tooltip «Контрагент должен клинике X сум» или «Клиника должна контрагенту X сум»
- ИНН copy: при hover — маленькая иконка Copy appears, click → copied + toast «ИНН скопирован»
- Search input: large, prominent, с instant results highlighting matching text в таблице (yellow highlight)
- Filter pills: horizontal row, each с цветной точкой 6px + name + count badge (количество контрагентов этого типа)
- Modal sections: collapsible accordion-style (chevron toggle), обязательные поля с red asterisk
- Phone link: click → tel: protocol, hover → tooltip «Позвонить»
- Email link: click → mailto: protocol, hover → tooltip «Написать письмо»

UX-аспекты:
- Instant search: по мере ввода таблица фильтруется с debounce 300ms, matching text highlighted yellow
- Type pills мгновенно фильтруют (no page reload), active pill — filled bg, count обновляется
- Row click → navigate to карточка контрагента (8.11) с smooth transition
- ИНН validation: при вводе — проверка формата (9 или 12 цифр), inline error если неверно
- Add modal: form validation — required fields, ИНН uniqueness check (async, shows warning if exists)
- Duplicate detection: при вводе названия — suggest existing контрагентов с похожим именем (фоновый поиск)
- Batch actions: checkbox selection → кнопки «Экспорт выбранных», «Удалить выбранных» (с confirmation)
- URL state: filter и search params в URL для bookmarking

Брендинг:
- Type colors consistent: те же что в расходах (8.3) и ДМС (8.6) для соответствующих типов контрагентов
- Balance coloring universal: green = нам должны (positive), red = мы должны (negative) — consistent со всей системой
- Card container: white bg, shadow-sm, border-radius 12px; modal — shadow-xl, border-radius 16px
- Sidebar active: «Контрагенты» highlighted с blue left border

Доступность:
- Search input: role="searchbox", aria-label «Поиск контрагента по названию или ИНН»
- DataTable: <th scope="col">, aria-sort, row clickable с aria-label «Открыть карточку [название]»
- Type badges: текст внутри badge sufficient, не только цвет
- Balance: aria-label с полным описанием «Баланс: плюс 5 000 000 сум, контрагент должен клинике»
- Phone/Email links: aria-label «Позвонить [номер]» / «Написать на [email]»
- Modal: focus trap, aria-modal="true", Escape closes, initial focus на первое поле
- Filter pills: role="radiogroup", keyboard Arrow navigation
- ИНН copy button: aria-label «Копировать ИНН», screen reader announce «ИНН скопирован» после click

Тренды:
- Search input: expanding animation on focus (width grows), subtle shadow appears
- Table row hover: smooth bg transition + slight translateX(2px) + shadow-xs
- Type filter pills: active pill — smooth bg fill animation (200ms), inactive — smooth unfill
- Cards view: staggered appear animation (fade-in + translateY), hover → elevation lift shadow-lg
- Modal appearance: scale(0.95) → scale(1) + fade-in, backdrop blur
- ИНН copy: clipboard icon → checkmark animation (SVG morph 300ms)
- Balance numbers: count-up animation при загрузке страницы (0 → value, 400ms ease-out)
- View toggle (Table/Cards): smooth crossfade transition between views (300ms)
```

---

## 8.11 Карточка контрагента

```
Разработайте современный, профессионально выглядящий интерфейс карточки контрагента для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- Detail-page дизайн с header информацией и tabbed content, comprehensive view одного контрагента
- Цветовая схема: основной #1E40AF, фон #F8FAFC, дебет (приход) #10B981, кредит (расход) #EF4444, нейтральный #94A3B8, предупреждения #F59E0B
- Суммы bold tabular-nums, дебет зелёный, кредит красный, баланс — colored по знаку
- Типографика Inter, tabular-nums для всех финансовых данных, заголовки semibold, mono для ИНН и расчётных счетов
- Иконки Lucide / Phosphor — 18px: Building2, Phone, Mail, Globe, FileText, CreditCard, ArrowDownLeft (дебет), ArrowUpRight (кредит), TrendingUp, Printer
- Header card: white bg, shadow-sm, border-radius 12px; tabs content в white card ниже

Макет и структура:
- Back navigation: «← Контрагенты» link вверху, breadcrumbs «Контрагенты / ООО "Медсервис"»
- Header card (full width):
  - Left: большая иконка/логотип (64px circle, initials если нет лого), Название компании (20px bold), Тип badge (colored pill), ИНН (mono + copy button)
  - Center: контактный блок — Контактное лицо (имя + должность), Телефон (link), Email (link), Адрес (text)
  - Right: Баланс (крупно 28px bold colored) + подпись «нам должны» green или «мы должны» red, под ним — «Договор №X от dd.MM.yyyy», статус договора badge
  - Action buttons в header: «Редактировать» (outlined, Pencil icon), «Акт сверки» (outlined, FileCheck icon), «Удалить» (ghost red, Trash icon)
- Tabs navigation (под header): Операции | Счета/Акты | Документы | Сверка
- Tab «Операции» (default):
  - Filter row: period date range picker, тип операции (Все/Дебет/Кредит pills)
  - Transactions DataTable: Дата (dd.MM.yyyy), Описание (text, truncated), Документ (link to document), Дебет (green, right-align, показывается только если > 0), Кредит (red, right-align, показывается только если > 0), Остаток/Сальдо (running balance, bold, colored by sign)
  - Footer: Итого Дебет | Итого Кредит | Сальдо (bold, large, colored)
  - Кнопки: «+ Добавить операцию» (primary), «Экспорт» (ghost)
- Tab «Счета/Акты»:
  - DataTable: Номер документа (mono link), Тип (Счёт/Акт/Счёт-фактура badge), Дата, Сумма (right-align), Статус (Выставлен amber / Оплачен green / Просрочен red), Действия (Скачать, Печать)
  - Кнопка «+ Создать счёт» (primary)
- Tab «Документы»:
  - Grid карточек документов: thumbnail preview (если image/PDF), Название файла, Тип (Договор/Лицензия/Доп.соглашение badge), Дата загрузки, Размер, Actions (Preview, Download, Delete)
  - Drag-and-drop upload zone: dashed border, «Перетащите файлы или нажмите для загрузки»
- Tab «Сверка»:
  - Auto-generated reconciliation view: Период (date range picker), Таблица сверки — Дата | Описание | Дебет (наши данные) | Кредит (наши данные) | Дебет (контрагент) | Кредит (контрагент) | Расхождение (highlighted red если есть)
  - Summary: Сальдо по нашим данным | Сальдо по данным контрагента | Разница (bold red если ≠ 0)
  - Кнопка «Сформировать акт сверки» → generates print-ready document
  - Контрагент может подтвердить/оспорить (manual status update)
- Balance trend chart (под header или в sidebar): mini line chart showing balance over time (6-12 months), green когда нам должны, red когда мы должны; zero line dashed

Элементы UI:
- Header balance: 28px bold, animated count-up, colored green/red, с подписью 12px gray
- Transaction table columns Дебет/Кредит: empty cells для нулевых значений (clean look), non-zero — bold colored
- Running balance (Сальдо): calculated column, shows cumulative balance after each transaction, color changes dynamically
- Document thumbnails: 80x60px, rounded corners, gray bg placeholder для non-preview files (icon + extension text)
- Drag-and-drop zone: dashed border 2px #CBD5E1, text center, icon Upload; при drag-over — border blue solid + bg blue-50
- Reconciliation differences: cells с расхождением — bg red-50, red text, bold; иконка AlertTriangle рядом
- Print-ready reconciliation act: modal preview с paper styling — logo клиники сверху, logo/name контрагента, таблица, итого, подписи двух сторон, место для печатей
- Balance trend chart: mini chart 100% width x 80px, area fill (green above zero, red below), dashed zero line, last point highlighted

UX-аспекты:
- Tab state сохраняется в URL hash (#operations, #invoices, #documents, #reconciliation)
- Transactions: click row → slide-over с деталями операции (full info, related document preview)
- Add transaction: inline form или modal — Дата, Тип (Дебет/Кредит radio), Сумма, Описание, Документ (file upload optional)
- Running balance auto-calculated: сортировка по дате, каждая строка показывает баланс после этой операции
- Document upload: drag-and-drop + click, progress bar per file, thumbnail appears после upload
- Reconciliation auto-gen: при нажатии «Сформировать» — система берёт все операции за период, формирует таблицу; контрагентские данные вводятся вручную или импортируются (Excel upload)
- Print act: click → paper preview modal → Print button (browser print dialog), Export PDF button
- Back navigation: browser back works correctly (URL state), кнопка «← Контрагенты» visible всегда

Брендинг:
- Дебет/Кредит цветовая система: green = нам поступило (дебет нашего баланса), red = мы заплатили (кредит); consistent
- Company initials avatar: circle 64px, bg gradient (light blue to purple), white text bold initials
- Reconciliation act: official template — шапка с реквизитами обеих сторон, таблица с borders, итоговые строки bold, место для подписи и печати — gray dashed circles
- Tabs: underline style, active — blue bottom border 2px + blue text, inactive — gray text, hover — gray bottom border

Доступность:
- Tabs: role="tablist", aria-selected, aria-controls, keyboard Arrow Left/Right
- Transaction table: <th scope="col">, aria-sort, Дебет/Кредит columns с aria-label «Дебет: 500 000 сум»
- Running balance: aria-label «Сальдо после операции: плюс 1 200 000 сум»
- Balance trend chart: aria-label с description, кнопка «Показать как таблицу» для accessibility
- Document cards: aria-label «Документ: Договор №123.pdf, загружен 15.01.2026, 2.4 MB»
- Upload zone: keyboard accessible (Enter/Space triggers file picker), aria-label «Зона загрузки документов»
- Reconciliation differences: aria-label «Расхождение: 50 000 сум» на highlighted cells
- Print preview modal: aria-modal, focus trap, Escape closes

Тренды:
- Header card: subtle gradient bg (white to light blue #F8FAFC → #EFF6FF), shadow-sm
- Balance count-up animation: при загрузке страницы баланс анимируется от 0 к значению (500ms ease-out)
- Tab switch: underline indicator slides smoothly (translateX transition 200ms)
- Transaction row hover: slight left shift + bg change + shadow appear (100ms)
- Document card hover: elevation lift (translateY -2px), shadow-md appear, thumbnail slight zoom (scale 1.05)
- Drag-and-drop: zone border animates (dash-offset animation loop), при drop — progress bar с gradient animation
- Reconciliation print preview: modal appears with paper-flip animation (perspective rotateY), shadow-2xl
- Balance trend chart: line draws from left to right (stroke-dashoffset animation 1s ease), area fade-in after line completes
```

---

## 8.12 Финансовые отчёты

```
Разработайте современный, профессионально выглядящий интерфейс финансовых отчётов для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- Report hub дизайн — каталог типов отчётов как карточки, затем конфигурация и preview; профессиональный, document-oriented
- Цветовая схема: основной #1E40AF, фон #F8FAFC, выделение #10B981 для positive метрик, #EF4444 для negative, #F59E0B для warnings, категории отчётов — уникальные subtle цвета
- Preview отчёта — paper-like styling: white bg, subtle shadow, margins, table borders, headers bold
- Типографика Inter, tabular-nums для всех числовых данных в отчётах, заголовки отчётов 18px bold, подзаголовки 14px semibold
- Иконки Lucide / Phosphor — 24px в карточках: TrendingUp (P&L), Droplets (Cash Flow), Stethoscope (по услугам), UserCheck (по врачам), Building (по отделениям), Tags (по категориям), Settings2 (Custom), FileBarChart, Printer, Download
- Карточки отчётов: white bg, shadow-sm, border-radius 12px, hover shadow-md + translateY(-2px)

Макет и структура:
- Sticky header 56px: заголовок «Финансовые отчёты», справа — кнопка «Конструктор отчётов» (outlined blue, иконка Settings2) → навигация к 8.13
- Report type cards grid (3 колонки, gap 20px):
  - P&L (Прибыль и убытки): иконка TrendingUp в circle bg green-50, название bold, описание 2 строки gray, badge «Основной» blue
  - Cash Flow (Движение ДС): иконка Droplets circle bg blue-50, описание, badge «Основной»
  - По услугам: иконка Stethoscope circle bg amber-50, описание «Выручка и рентабельность по каждой услуге»
  - По врачам: иконка UserCheck circle bg purple-50, описание «Производительность и выручка врачей»
  - По отделениям: иконка Building circle bg cyan-50, описание «Сравнение финансовых показателей отделений»
  - По категориям расходов: иконка Tags circle bg red-50, описание «Детализация расходов по категориям»
  - Пользовательские: иконка Settings2 circle bg gray-50, описание «Сохранённые пользовательские отчёты», count badge «3 шаблона»
  - Каждая карточка: icon (48px circle colored bg), title (16px bold), description (13px gray 2-3 строки), кнопка «Сформировать» (primary small) + «Последний: dd.MM.yyyy» link (если ранее генерировался)
- Click «Сформировать» → params panel (slide-down или inline expand под карточкой):
  - Период: date range picker с пресетами (Месяц, Квартал, Полугодие, Год, Произвольный)
  - Филиал: multi-select (если applicable)
  - Дополнительные params зависят от типа отчёта:
    - P&L: группировка (месяц/квартал), include/exclude категории checkboxes
    - По врачам: выбор врачей (multi-select), сортировка (по выручке/по кол-ву)
    - По услугам: категории услуг (multi-select), top N slider
    - По отделениям: выбор отделений, показатели (выручка/расходы/прибыль checkboxes)
  - Кнопка «Сгенерировать» (primary, иконка FileBarChart) + «Отмена» (ghost)
- Report preview (full width, replaces cards grid):
  - Header bar: название отчёта + период, кнопки — «← К списку отчётов» (back), «Экспорт» dropdown (Excel, PDF, Печать), «Сохранить как шаблон» (ghost, иконка Save)
  - Charts section (зависит от типа):
    - P&L: revenue vs expenses grouped bar chart по месяцам + net profit line overlay
    - Cash Flow: waterfall chart
    - По услугам: horizontal bar chart (top 10 services by revenue), table breakdown
    - По врачам: stacked bar chart (врачи x метрики), ranking table
    - По отделениям: radar/spider chart сравнение + comparison table
    - По категориям: treemap или pie chart + detail table
  - Data table section: полная таблица данных отчёта, sortable columns, subtotals per group, grand total bold; print-optimized styling
  - Summary footer: ключевые findings — 3-4 highlighted metrics (напр. «Лучший врач по выручке: Иванов И.И. — 45M сум», «Самая прибыльная услуга: УЗИ — margin 78%»)

Элементы UI:
- Report cards: icon в colored circle (48px), title + description text block, action row с кнопкой и last-generated date; hover — card lifts (shadow-md, translateY -2px), bg slightly brighter
- Params panel: smooth expand/collapse animation, form fields standard (date pickers, selects, checkboxes), «Сгенерировать» button prominent
- Charts: responsive, hover tooltips с detailed values, legend toggleable, color-consistent с system palette
- Export dropdown: 3 options с иконками (Excel green table icon, PDF red file icon, Printer gray), each hover bg highlight
- Data tables в preview: zebra striping, sticky header, subtotal rows bg #F1F5F9 bold, grand total row bg #1E40AF text white
- Save template button: click → modal с name input + description textarea, «Сохранить» → appears в Пользовательские отчёты
- Summary footer insights: card-style highlights, иконка + text + value bold, colored accent (green for best, red for worst)

UX-аспекты:
- Card click → smooth params panel appear (slide-down 200ms), focus на первый параметр
- Generate → loading state (progress bar + «Генерация отчёта...»), затем smooth transition к preview
- Preview: scroll-heavy page с sticky navigation (back button, export), charts lazy-load
- Export Excel: includes charts as images + data tables; PDF: formatted, paginated; Print: clean print styles (no sidebar, no header)
- «Сохранить как шаблон»: сохраняет тип + все параметры, появляется в «Пользовательские» с custom name
- Пользовательские отчёты: card per saved template, кнопки «Сформировать» (uses saved params), «Редактировать» (change params), «Удалить» (confirmation)
- Back navigation: «← К списку отчётов» returns to cards grid, preview unmounts
- Responsive: cards grid 3 → 2 → 1 col при уменьшении экрана; charts resize; tables horizontal scroll

Брендинг:
- Report cards subtle color-coding: каждый тип имеет свой accent color (icon circle bg), creates visual variety while staying within palette
- Preview отчёта: paper-like feel — white bg, subtle shadow, structured layout напоминающий печатный документ
- Grand total row: #1E40AF bg + white text — brand color accent, professional feel
- Charts use system palette consistently: green для доходов, red для расходов, blue для нейтральных, amber для warnings

Доступность:
- Report cards: role="listitem" в role="list", aria-label «Отчёт: Прибыль и убытки, основной финансовый отчёт»
- Params panel: role="region", aria-label «Параметры отчёта», form fields с labels
- Charts: aria-label с описанием + кнопка «Показать как таблицу» для screen readers
- Data tables: <th scope="col/row">, subtotal rows с aria-label «Итого за январь», grand total aria-label «Общий итого»
- Export dropdown: aria-haspopup, aria-expanded, items с aria-label
- Loading state: aria-live="polite" для progress updates «Генерация отчёта: 60%»
- Summary insights: semantic HTML (heading + paragraph), не только visual styling
- Focus management: после генерации — focus на preview header

Тренды:
- Report card hover: translateY(-4px) + shadow-lg + subtle bg white glow, transition 200ms ease
- Params panel: slide-down с spring animation (slight overshoot), form elements fade-in staggered
- Chart animations: bars grow from zero (staggered), lines draw left-to-right, pie segments sweep
- Preview transition: cards grid fade-out → preview fade-in (crossfade 300ms)
- Glassmorphism on params panel: backdrop-blur, semi-transparent bg
- Data table subtotal rows: subtle gradient bg (light blue → transparent left-to-right)
- Summary insight cards: animated appear (slide-up + fade-in), count-up для чисел
- Export button: при click → subtle ripple effect, затем download starts
```

---

## 8.13 Конструктор отчётов

```
Разработайте современный, профессионально выглядящий интерфейс конструктора пользовательских отчётов для бухгалтера медицинской клиники в медицинской информационной системе.

Визуальный стиль:
- Builder/constructor интерфейс с drag-and-drop, панелями инструментов и live preview; профессиональный BI-tool feel
- Цветовая схема: основной #1E40AF, фон #F8FAFC, конструктор panels bg #FFFFFF, data source badges — Доходы #10B981, Расходы #EF4444, Зарплаты #F59E0B, Пациенты #3B82F6, Услуги #8B5CF6, ДМС #0EA5E9
- Preview area: paper-like white bg с subtle shadow, charts и tables rendered в реальном времени
- Типографика Inter, tabular-nums для данных в preview, labels 12px medium, section titles 14px semibold
- Иконки Lucide / Phosphor — 18px: Database, Columns, Filter, Group, Calendar, BarChart3, Table, Save, Download, Play, GripVertical (drag handle), X (remove), Eye (preview)
- Constructor panels: bg white, border 1px #E2E8F0, border-radius 8px, shadow-xs; drag items — bg #F8FAFC border dashed при drag

Макет и структура:
- Sticky header 56px: заголовок «Конструктор отчётов», справа — кнопка «Сохранить шаблон» (primary), «Экспорт» dropdown (Excel/PDF/CSV), «Загрузить шаблон» (ghost, иконка FolderOpen)
- Layout: 3-panel design:
  - Left panel (280px, collapsible): Source & Columns
  - Center panel (flexible, main): Live Preview
  - Right panel (260px, collapsible): Settings & Filters
- Left panel «Источники и колонки»:
  - Section «Источники данных» (collapsible):
    - Checkboxes: Доходы (green dot), Расходы (red dot), Зарплаты (amber dot), Пациенты (blue dot), Услуги (purple dot), ДМС (cyan dot), Контрагенты (gray dot)
    - При выборе источника — раскрывается список доступных полей (колонок) этого источника
    - Multiple sources enable JOINs (показ связей)
  - Section «Доступные колонки» (scrollable):
    - Per selected source: grouped field list — поля с иконками типа (# числовой, Aa текстовый, Calendar дата, Tag категория)
    - Drag handle (GripVertical) на каждом поле для drag-and-drop в preview
    - Click на поле → добавляется в selected columns; или drag в area «Колонки отчёта»
  - Section «Колонки отчёта» (drop zone):
    - Selected columns list — ordered, drag to reorder, X button to remove
    - Each column: name, aggregate dropdown (Сумма/Среднее/Кол-во/Мин/Макс/Нет — для числовых), rename input
- Right panel «Настройки»:
  - Section «Фильтры»:
    - List of active filters, each: поле (select from columns), оператор (= / ≠ / > / < / содержит / между), значение (input/select depending on type)
    - Кнопка «+ Добавить фильтр» → new filter row
    - Each filter — removable (X button)
  - Section «Группировка»:
    - Drag-and-drop list: группировать по полям (можно несколько уровней — nested grouping)
    - Options per group: sort direction (asc/desc), показывать subtotals (toggle)
  - Section «Период»:
    - Date range picker (обязательный), пресеты
    - Auto-detect date field from selected sources
  - Section «Визуализация»:
    - Chart type selector: иконки (Bar, Line, Pie, Area, Table only, Combo) — single select
    - Chart settings: X-axis field (dropdown), Y-axis field(s) (multi-select), color field (optional dropdown for grouping)
    - Show/hide options: toggles — Показать таблицу, Показать график, Показать итого, Показать subtotals
- Center panel «Live Preview»:
  - Top bar: «Предпросмотр» title, кнопка «Обновить» (иконка RefreshCw) если auto-update off, toggle «Авто-обновление» (auto re-render при changes)
  - Chart area (if enabled): rendered chart based on settings, responsive, interactive (hover tooltips)
  - Table area (if enabled): rendered data table с selected columns, grouping applied, subtotals, grand total; limited to first 100 rows в preview + note «Показаны первые 100 из 1 247 строк»
  - Empty state (before configuration): illustration + «Выберите источники данных и колонки для начала»
  - Loading state: skeleton chart + skeleton table при генерации

Элементы UI:
- Data source badges: pill с цветной точкой + name, selected state — filled bg opacity 0.15 + border
- Field items в left panel: compact rows 32px, drag handle left, icon type middle, name right; drag state — dashed border, opacity 0.5 at source + ghost element follows cursor
- Drop zone «Колонки отчёта»: dashed border when empty «Перетащите поля сюда», items — solid bg, reorderable
- Aggregate dropdown: compact select рядом с именем колонки (Σ Сумма, μ Среднее, # Кол-во и т.д.)
- Filter rows: inline — field select (compact) + operator select + value input; removable; AND logic between filters (показ «И» между ними)
- Grouping items: draggable chips в vertical list, sort icon toggle (↑ asc / ↓ desc), subtotals toggle small switch
- Chart type icons: 6 иконок в grid 3x2, active — blue bg + white icon, inactive — gray bg + gray icon, hover — light blue bg
- Live preview chart: standard recharts/chart.js renders, responsive, tooltips, legend
- Live preview table: compact, zebra striping, subtotal rows highlighted, sticky header
- Save template modal: name input, description textarea, category select (для организации), «Сохранить» primary
- Column rename: inline edit — click on column name → text input appears, Enter saves

UX-аспекты:
- Drag-and-drop: smooth, visual feedback (ghost element, drop zone highlights blue, snap animation)
- Live preview updates: auto or manual toggle; auto — debounce 500ms после любого изменения, re-renders preview
- Column reorder: drag in «Колонки отчёта» section, other items smoothly shift; reflected instantly in preview table column order
- Filter builder: intuitive — select field → operator auto-adjusts (text fields get contains/equals, numeric get >/</between, dates get date range)
- Grouping: drag field to grouping area → preview instantly shows grouped data with subtotals
- Save template: saves all configuration (sources, columns, filters, grouping, chart type, date range as relative «Последний месяц»); load template restores everything
- Export: generates full report (all rows, not limited to 100), format depends on selection; progress bar for large exports
- Undo/Redo: Ctrl+Z / Ctrl+Shift+Z для отмены действий в конструкторе (column add/remove, filter changes и т.д.)
- Responsive panels: на < 1400px — left и right panels become collapsible drawers (toggle buttons); на < 1200px — tabs вместо panels
- Template library: «Загрузить шаблон» → modal с grid saved templates (name, description, last used date, source badges, кнопки Load/Delete)

Брендинг:
- Constructor feel: professional BI-tool styling, clean panels, clear hierarchy — left sources/columns, center preview, right settings
- Data source colors consistent: те же цвета что используются в sidebar навигации и в карточках отчётов (8.12)
- Blue #1E40AF для active states, selections, primary actions; gray для neutral/inactive
- Preview area: paper-like styling consistent с printed reports — same fonts, spacing, colors

Доступность:
- Drag-and-drop: все draggable items имеют keyboard alternative — select item + Arrow Up/Down для reorder, Enter/Space для toggle/add; aria-roledescription="draggable item"
- Panels: role="region" с aria-label, collapsible с aria-expanded
- Data source checkboxes: <label> с описанием, role="group" для секции
- Filter builder: form fields с labels, оператор select с aria-label «Условие фильтра»
- Chart type selector: role="radiogroup", каждый тип — role="radio", aria-checked, aria-label «Тип графика: столбчатая диаграмма»
- Live preview: aria-live="polite" для объявления обновлений «Предпросмотр обновлён: 1 247 строк, 5 колонок»
- Drop zones: aria-dropeffect, aria-label «Зона для колонок отчёта, перетащите поля сюда»
- Keyboard shortcuts: documented в tooltip на ? icon (Ctrl+S сохранить, Ctrl+Z undo, Ctrl+Shift+Z redo, Ctrl+E export)

Тренды:
- Drag ghost element: semi-transparent clone с blue border, follows cursor с slight offset
- Drop zone active: border transitions от dashed gray → solid blue, bg pulse light blue при hover with dragged item
- Column reorder animation: other items slide smoothly (200ms) to make room for dropped item
- Panel collapse: smooth width transition (280px → 0), content fade-out before collapse
- Live preview update: subtle flash/pulse on changed data cells, chart smooth re-render (morphing transitions)
- Chart type switch: current chart morphs into new type (bars → line smooth interpolation, 400ms)
- Glassmorphism on template library modal: backdrop-blur, shadow-xl, scale-in animation
- Skeleton loader в preview: pulsing rectangles matching chart height + table rows
- Save confirmation: button → loading spinner → checkmark → text «Сохранено» → back to «Сохранить» (3s sequence)
```
