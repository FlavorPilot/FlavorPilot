# FlavorPilot — complete widget monorepo, r2

**Полный исходный проект, а не патч и не набор файлов для наложения.**
В архиве находятся Next.js frontend, NestJS/Fastify API, общие контракты,
Flavor Engine, схема Supabase, данные, тесты и инструкции. Другой архив не нужен.

Статус: **pre-release / техническая альфа**. Версии внутренних npm-пакетов сохранены
как `0.3.0`; `widget-monorepo-r2` — идентификатор этой пересборки, не коммерческого релиза.
UI: English и українська (`en`, `uk`).

## 1. Быстрый запуск

Распакуйте архив в **новую папку**, сохраняя вложенные каталоги. Не накладывайте его
поверх старого проекта: иначе удалённые legacy-компоненты могут остаться рядом с новыми.
Не переносите `node_modules`, `.next` или `dist` из StackBlitz.

В терминале в папке, где находится этот README и корневой `package.json`:

```bash
node --version
npm --version
npm install --include=optional
npm run setup
npm run doctor
npm run dev
```

Целевая среда — native Node.js **22.16+ в ветке 22.x**, npm 10;

Открыть:

- `http://localhost:3000/en` — английская версия;
- `http://localhost:3000/uk` — украинская версия;
- `http://localhost:3000/en/builder` — конструктор;
- `http://localhost:4000/v1/health` — состояние API;
- `http://localhost:4000/docs` — Swagger.

`npm run setup` создаёт `.env` из `.env.example` только при отсутствии целевого файла.
Он **не перезаписывает** существующие настройки и не подставляет настоящие ключи.
Для интерфейса без backend достаточно `npm run dev:web`. API отдельно: `npm run dev:api`.

### Ограничение воспроизводимости установки

В среде подготовки был недоступен npm registry: проверочный запрос вернул
`EAI_AGAIN registry.npmjs.org`. Полный `npm install` не завершился в отведённое время.
Поэтому **в архиве нет сгенерированного и проверенного `package-lock.json`**.
Прямые версии зависимостей перенесены из исходного проекта; их наличие и совместимость
в текущем registry в этой среде не подтверждены. Lockfile не был выдуман или склеен вручную.

После первого успешного `npm install` проверьте результат и закоммитьте lockfile.
Далее используйте `npm ci --include=optional` для воспроизводимых установок.
Не применяйте `--force`, `--legacy-peer-deps` и случайные SWC bindings ради обхода ошибок.
Полная установка, typecheck, сборка и запуск должны пройти **до деплоя**.

## 2. Что означает «frontend на виджетах»

```text
apps/web/src/
  app/        маршруты Next.js и корневые providers
  screens/    составление страниц и координация сценариев
  widgets/    самостоятельные блоки пользовательской задачи
  features/   действия: редактирование, поиск, сессия, сохранение
  entities/   модель блюда, адаптеры API и локального хранения
  shared/     UI-примитивы, CSS-токены, i18n, HTTP-клиент
```

`DishComposition`, `DishAnalysis`, `DishRecommendations`, `ChangePreview` и остальные
виджеты получают данные и команды через явные props. Они не сохраняют собственную копию
блюда, не импортируют соседние виджеты и не выполняют `fetch` напрямую.
Один reducer редактора — единственный источник рабочего состояния.

**Это не микрофронтенды и не панель с обязательным перетаскиванием блоков.**
Порядок виджетов определяется сценарием повара; режим «Основне / Докладно» раскрывает
профессиональные детали, не перегружая начальный экран.

Описание каждого виджета: [WIDGET_CATALOG.md](docs/WIDGET_CATALOG.md).
Правила зависимостей: [WIDGET_ARCHITECTURE.md](docs/WIDGET_ARCHITECTURE.md).
Проверка: `npm run check:widgets`.

## 3. Реализованные в исходниках сценарии

- Пустая композиция и явная загрузка примера, до 24 пар «ингредиент + обработка».
- Поиск, граммы с точкой или запятой, смена обработки, удаление.
- Мгновенный расчёт исходной детерминированной моделью.
- Предпросмотр добавления: отдельное состояние «до / после», явное применение.
- Undo/Redo, до 50 шагов; подтверждение перед началом нового блюда.
- Автосохранение рабочего черновика в браузере, экспорт и импорт JSON.
- Локальная библиотека и отдельная библиотека аккаунта, API-адаптеры CRUD.
- Формы входа, регистрации, восстановления пароля и PKCE callback Supabase.
- Публичный просмотр и ссылки; отдельное согласие на публикацию точных граммовок.
- Примеры отделены от реального сообщества, нет выдуманных счётчиков популярности.
- Реальные ошибки API отображаются явно и не подменяются «успешными» демо-данными.
- Адаптивные EN/UK виджеты, native dialog, клавиатурные состояния и error boundaries.

Наличие исходников сценария **не означает пройденный сквозной тест** с Supabase.
Фактический объём проверки указан в [VALIDATION.md](docs/VALIDATION.md).

## 4. Подключение API и Supabase

Для server-check и облачных рецептов в `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/v1
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

В `apps/api/.env` — серверные параметры из примера:

```dotenv
DATABASE_URL=<server-only-postgresql-connection>
SUPABASE_URL=<project-url>
SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
CORS_ORIGINS=http://localhost:3000
AI_ENABLED=false
```

Новый Supabase-проект: сначала `supabase/schema.sql`, затем `supabase/seed.sql`.
Уже существующая база v0.3.0: **не запускайте свежую схему повторно**; используйте
инструкцию миграции в [DATABASE.md](docs/DATABASE.md).
Добавьте redirect URLs `/en/auth/callback` и `/uk/auth/callback` на вашем домене
в настройках Auth. Для восстановления — также варианты с `?mode=recovery`.

CRUD идёт через Nest с Bearer token. Прямой доступ anon/authenticated к продуктовым
таблицам через Supabase Data API намеренно закрыт в новой схеме/миграции; Nest использует
отдельное доверенное серверное подключение. Это описанное изменение относительно исходника.
Никогда не помещайте `DATABASE_URL` или service-role/OpenAI ключ в `NEXT_PUBLIC_*`.

Без базы API может запуститься, но persistence возвращает `503`.
**`/health` со статусом процесса `ok` не означает исправную/подключённую базу**:
проверяйте поле `database` и реальные операции перед выкладкой.

## 5. Проверки

```bash
npm run validate:structure
npm run check:syntax
npm run check:widgets
npm run test:widgets
npm run test:core
npm run typecheck
npm test
npm run build
```

`test:core` компилирует настоящие `domain.ts`, `engine.ts`, `ingredients.ts` с `strict`
и выполняет их через Node test runner. Он не эмулирует Next или Nest.
Есть один явно отмеченный TODO — унаследованная проблема предупреждения о дозировке
ароматического ингредиента. Подробности: [KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

`npm run validate` объединяет основные проверки, но **не заменяет** `npm run build`,
тесты настоящей БД, браузерные E2E и проверку деплоя.

Статические иллюстрации из реальных исходников виджетов и данных модели:
[desktop EN](docs/previews/studio-en-1440.png), [mobile UK](docs/previews/studio-uk-390.png).
Это CSS-превью без React lifecycle и сети, **не скриншоты запущенного Next.js приложения**.

## 6. Что сознательно не заявляется готовым

Платёжный провайдер, реальные Pro-подписки, лимиты AI, модерация, аналитика,
нагрузочные испытания, backup/restore и коммерческая валидация гастрономической базы.
AI по умолчанию выключен; production-включение заблокировано до реализации квот.
Нынешние 38 профилей и коэффициенты — исходные гипотезы, не измеренная совместимость,
не рекомендации по безопасности приготовления и не проценты успеха блюда.

## 7. Файлы для продолжения работы

- [SOURCE_AUDIT.md](docs/SOURCE_AUDIT.md): источники и осознанные изменения.
- [MIGRATION.md](docs/MIGRATION.md): переход со старого проекта без смешивания папок.
- [DEVELOPMENT.md](docs/DEVELOPMENT.md): команды, тесты, дисциплина lockfile.
- [DEPLOYMENT.md](docs/DEPLOYMENT.md): Vercel / Nest-контейнер / Supabase.
- [ACCEPTANCE.md](docs/ACCEPTANCE.md): реальные сценарии приёмки.
- [AGENT.md](AGENT.md): правила для дальнейшей разработки с агентом.

Архив ничего не пушит в GitHub, не меняет remote и не переносит private `.env` автоматически.
