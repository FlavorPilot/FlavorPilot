Я изучил текущее состояние `main` в `FlavorPilot/FlavorPilot`, включая последний коммит, frontend-слои, Nest API, Supabase-схему, тесты, документацию и GitHub Actions.

Текущая стадия проекта — **technical alpha**. Архитектурно проект уже выглядит как настоящий продукт, а не прототип, но ближайшая цель сейчас должна быть не «добавлять новые функции», а довести существующий контур до **стабильной staging alpha**.

### Самое важное открытие

Последний `main` — коммит `ad95487b…` от 13 сентября 2026. На нём CI **красный**.

Причём хорошая новость: установка зависимостей уже работает. GitHub Actions успешно выполнил:

```text
npm ci
added 477 packages in 17s
```

А падение произошло позже:

```text
npm run validate:structure
```

из-за:

```text
Unresolved local import ./.next/dev/types/routes.d.ts
in apps/web/next-env.d.ts
```

То есть текущий blocker — не npm, не Next, не Nest и не зависимости. Это собственный `scripts/check-project.mjs`, который воспринимает автоматически сгенерированные Next.js type-imports как обычные исходные relative imports.

[Последний неуспешный CI run](https://github.com/FlavorPilot/FlavorPilot/actions/runs/34754973718)

При этом в репозитории уже есть настоящий `package-lock.json`, а TypeScript зафиксирован как `5.9.2`. Поэтому `README.md`, `PROJECT_STATUS.md` и `validation-report.json` частично устарели: там всё ещё написано, что registry был недоступен и verified lockfile отсутствует.

Это я бы исправил **до любой новой продуктовой работы**.

---

# Что уже сделано хорошо

| Область                      | Текущее состояние                                                |
| ---------------------------- | ---------------------------------------------------------------- |
| Monorepo                     | Хорошо: `web`, `api`, `contracts`, `flavor-engine`               |
| Frontend architecture        | Хорошо: `app → screens → widgets → features → entities → shared` |
| Widgets                      | 11 функциональных widget-slices                                  |
| Builder                      | Уже довольно зрелый                                              |
| Undo/Redo                    | Есть                                                             |
| Autosave draft               | Есть                                                             |
| Recommendation preview       | Есть                                                             |
| EN / UK                      | Есть                                                             |
| Local recipes                | Есть                                                             |
| Cloud adapters               | Есть                                                             |
| Supabase Auth UI             | Есть                                                             |
| Password reset / callback    | Есть                                                             |
| NestJS API                   | Есть                                                             |
| Fastify                      | Есть                                                             |
| PostgreSQL / Drizzle         | Есть                                                             |
| public/private/unlisted      | Есть                                                             |
| Remix lineage                | Есть                                                             |
| Dish versions                | Есть                                                             |
| Free private limit           | Есть                                                             |
| AI architecture              | Правильная                                                       |
| AI production gate           | Есть                                                             |
| Supabase hardening migration | Есть                                                             |
| Unit/kernel tests            | Есть                                                             |
| Static responsive validation | Есть                                                             |
| Browser E2E                  | Нет                                                              |
| Billing                      | Нет                                                              |
| Moderation                   | Нет                                                              |
| Analytics                    | Нет                                                              |
| Production observability     | Нет                                                              |

Frontend после последней перестройки мне нравится значительно больше. `BuilderScreen` действительно выступает orchestrator'ом, а `DishComposition`, `DishAnalysis`, `DishRecommendations`, `ChangePreview`, `SensoryProfile` и другие блоки не начинают жить каждый своей жизнью.

Особенно правильна логика:

```text
Recommendation
↓
Preview
↓
Before / After
↓
Explicit Apply
```

а не «нажал рекомендацию → блюдо неожиданно изменилось».

---

# Roadmap, который я бы использовал сейчас

Я бы **не следовал старому roadmap буквально**. Файл `FLAVORPILOT_COMMERCIAL_RELEASE_ROADMAP.md` хороший по охвату, но состояние репозитория с августа уже существенно изменилось.

Теперь последовательность должна быть такой.

| Этап                         | Цель                                            | Результат                        |
| ---------------------------- | ----------------------------------------------- | -------------------------------- |
| **0. Repository green**      | Убрать технические блокеры                      | CI полностью зелёный             |
| **1. Staging**               | Запустить настоящий продуктовый контур          | Web + API + Supabase staging     |
| **2. Core user lifecycle**   | Доказать полный пользовательский сценарий       | register → build → save → reopen |
| **3. Automated E2E**         | Перестать проверять критические вещи вручную    | Playwright + DB tests            |
| **4. Flavor Engine v1 data** | Сделать кулинарную основу заслуживающей доверия | provenance + expert review       |
| **5. Product alpha**         | Дать продукт 10–30 поварам                      | измеряемый feedback              |
| **6. Community MVP**         | Добавить социальную ценность                    | profiles, favorites, remix UX    |
| **7. Monetization**          | Реально ограничивать и продавать Pro            | billing + entitlements           |
| **8. Production hardening**  | Сделать сервис безопасным и наблюдаемым         | monitoring, limits, backups      |
| **9. Paid beta**             | Проверить willingness-to-pay                    | реальные платежи                 |
| **10. GA 1.0**               | Полноценный коммерческий релиз                  | production readiness             |

---

# Этап 0 — привести репозиторий в зелёное состояние

**Приоритет: P0. Делать сейчас.**

Первое изменение я бы сделал в:

```text
scripts/check-project.mjs
```

Он не должен проверять `.next/...` imports внутри автоматически генерируемого:

```text
apps/web/next-env.d.ts
```

как обычные исходные файлы проекта.

Лучше исключить `next-env.d.ts` из такого relative-import анализа или явно разрешить Next-generated `.next` type imports.

После этого:

```bash
npm ci
npm run validate
npm run build
```

И чинить реальные следующие ошибки, если появятся.

Definition of Done:

```text
GitHub Actions
├── npm ci            ✅
├── validate          ✅
├── typecheck         ✅
├── vitest            ✅
└── build             ✅
```

После этого включить правило:

> `main` нельзя считать стабильным, если CI красный.

Я бы также перестал пушить большие изменения прямо в `main`.

Сейчас в репозитории:

```text
Issues: 0
PRs:    0
```

Для одного человека это кажется удобным, но когда GPT начинает менять десятки файлов, review через PR становится очень полезным.

Рабочая схема:

```text
main
 ↑
PR
 ↑
feat/*
fix/*
```

---

# Этап 1 — настоящий staging

После green CI я бы **сразу прекратил развивать продукт только локально**.

Нужны:

```text
staging.flavorpilot...
api-staging.flavorpilot...
Supabase staging
```

Web:

```text
Next.js
→ Vercel
```

API:

```text
NestJS container
→ Railway / другой container host
```

Database/Auth:

```text
Supabase staging
```

И заполнить реальные:

```text
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

DATABASE_URL
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
CORS_ORIGINS
```

`AI_ENABLED=false` пока оставить.

Очень хороший момент: API уже специально блокирует production AI, если нет usage controls:

```ts
NODE_ENV === "production" && AI_ENABLED
→ configuration error
```

Это правильное решение. Его сохраняем.

---

# Этап 2 — доказать основной пользовательский цикл

Это будет первый настоящий milestone.

Должен работать сценарий:

```text
Register
↓
Confirm email
↓
Sign in
↓
Create dish
↓
Add ingredients
↓
Analyze
↓
Save private
↓
Close browser
↓
Sign in again
↓
Recipe is still there
↓
Edit
↓
Save
↓
Publish
↓
Second user opens it
↓
Remix
```

Код для большей части этого уже есть.

Например frontend уже имеет:

```text
sign-in
sign-up
reset-password
auth/callback
```

и `dishRepository` умеет:

```text
mine
publicList
publicOne
ownOne
shared
create
update
remove
```

То есть эта фаза преимущественно **интеграционная**, а не разработка всего с нуля.

Особое внимание:

```text
User A private dish
```

не должен видеть:

```text
anonymous
User B
```

ни через UI, ни API, ни Supabase Data API.

---

# Этап 3 — E2E и integration testing

Сейчас `tests/e2e` содержит фактически только README с описанием будущих проверок.

Это один из крупнейших технических пробелов.

Я бы поставил:

```text
Playwright
```

и автоматизировал минимум критический набор:

```text
signup/login
builder
save
reload
edit
private permissions
public dish
unlisted link
remix
delete
language switch
mobile builder
API failure
```

Отдельно API + DB integration tests:

```text
Nest
↓
real PostgreSQL test DB
```

Проверять:

```text
two users
ownership
visibility
private limit
versions
concurrent writes
remix parent
share token
```

После этого CI:

```text
unit
integration
build
E2E
```

---

# Этап 4 — Flavor Engine должен стать главным R&D-направлением

После технической стабилизации **вот сюда я бы направил больше всего усилий**.

Сейчас в базе:

```text
38 ingredients
12 preparations
64 explicit pair adjustments
```

Но сами документы проекта правильно признают:

> данные являются гипотезами, а не подтверждёнными измерениями.

И есть уже конкретный известный дефект:

```text
CUL-001
```

Слишком большое количество розмарина ухудшает quantity score, но система не всегда выдаёт ожидаемый `dominantIngredient`, потому что dominance определяется через наиболее impactful ingredient.

Сначала исправить **семантику warning system**, а не искусственно подкручивать коэффициенты.

Затем изменить модель данных knowledge base.

Для каждого ингредиента я хочу видеть примерно:

```text
ingredient
├── sensory profile
├── preparation effects
├── recommended range
├── pairing evidence
├── source
├── source license
├── reviewer
├── review status
├── confidence
├── model version
└── last reviewed at
```

### Цель для закрытой альфы

Не нужно сразу 500 ингредиентов.

Я бы сделал:

```text
80–120 качественно проверенных
```

основных продуктов.

Это лучше, чем:

```text
500 сгенерированных GPT чисел
```

### Для коммерческого 1.0

Ориентир:

```text
300–500 reviewed ingredients
```

но важнее качество покрытия, чем число.

---

# Этап 5 — закрытая alpha с настоящими поварами

До billing я бы нашёл:

```text
10–30 пользователей
```

желательно:

```text
профессиональные повара
food enthusiasts
culinary students
recipe developers
```

И дал им FlavorPilot бесплатно.

Но собирать не:

> нравится ли дизайн?

а конкретные метрики.

Например:

```text
dish created
ingredient added
recommendation previewed
recommendation applied
dish saved
return after 7 days
number of edits
number of finished dishes
```

Главная продуктовая гипотеза:

> Помогает ли FlavorPilot человеку принять лучшее решение при создании блюда?

Не:

> Нравятся ли пользователю красивые score rings?

---

# Этап 6 — community MVP

Сейчас социальная база частично заложена, но полноценного community нет.

БД даже имеет:

```text
favorites
```

но в Nest `AppModule` сейчас есть только:

```text
Database
Auth
Flavor
AI
Dishes
Health
```

То есть favorites пока не являются полноценным backend-модулем.

После alpha я бы добавил:

```text
profiles
favorites
remixes
discover filters
public chef page
```

Но **не comments и followers сразу**.

Для начала достаточно:

```text
Dish
Author
Save/Favorite
Remix
Original attribution
```

Это соответствует самой сильной идее социальной части FlavorPilot:

> не просто смотреть рецепт, а использовать его как отправную точку.

---

# Этап 7 — billing и настоящие тарифы

Только после того, как видно, что люди возвращаются.

Сейчас Pricing screen честно показывает `noCheckout`. Это хорошо — UI не притворяется платежной системой.

Нужно будет добавить отдельный:

```text
BillingModule
```

и серверную систему entitlements.

Никогда:

```text
if (user.plan === "pro") // browser
```

как единственный источник прав.

Правильная цепочка:

```text
Payment provider
      ↓ webhook
Nest BillingModule
      ↓
subscriptions
      ↓
EntitlementService
      ↓
features
```

Сценарии:

```text
checkout
trial
renewal
past_due
cancel
upgrade
downgrade
webhook retry
duplicate webhook
refund
```

---

# Этап 8 — production hardening

До первых платящих пользователей обязательны:

```text
rate limiting
AI quotas
request IDs
structured logs
error tracking
health/readiness
backup
restore test
security headers
CSP
abuse protection
moderation/report
data export
account deletion
```

AI я бы включал только после:

```text
per-user quota
daily/monthly budget
timeout
provider error handling
cost telemetry
```

Сейчас production AI правильно запрещён — так и оставить до этой фазы.

---

# Этап 9 — paid beta

Не запускать сразу «официальный FlavorPilot 1.0».

Сначала:

```text
Paid Beta
```

например ограниченному числу пользователей.

Нужно проверить:

```text
payment succeeds
renewal succeeds
cancel succeeds
entitlements update
users actually keep paying
```

И продуктовые показатели:

```text
D1 / D7 / D30 retention
dishes created per active user
recommendation apply rate
save rate
return rate
paid conversion
churn
```

---

# Этап 10 — GA 1.0

Только когда одновременно выполнены четыре вещи:

```text
Technology
✅ stable

Product
✅ useful

Knowledge
✅ reviewed

Business
✅ people pay
```

Тогда уже:

```text
FlavorPilot 1.0
```

а не `0.3.0`.

---

## Что я бы делал буквально следующим

Порядок ближайших задач я бы зафиксировал так:

```text
P0
1. Починить CI check-project.mjs
2. Получить полностью green npm run validate
3. Получить green npm run build
4. Обновить README / PROJECT_STATUS / validation-report
5. Сделать PR workflow вместо прямых изменений main

P0
6. Поднять Supabase staging
7. Применить schema/migration
8. Поднять Nest staging
9. Поднять Next staging
10. Проверить auth callback

P0
11. Прогнать двух пользователей A/B
12. Проверить private/public/unlisted
13. Проверить cloud CRUD
14. Проверить remix
15. Проверить версии

P1
16. Добавить Playwright
17. Добавить API+DB integration tests
18. Сделать CI обязательным для merge

P1
19. Исправить CUL-001
20. Ввести provenance/review workflow
21. Начать экспертную проверку каталога

P1
22. Подключить product analytics
23. Запустить closed alpha

P2
24. Profiles / favorites / better Discover
25. Moderation/reporting
26. Billing
27. AI quotas

P2
28. Paid beta
29. Security/load/backup audit
30. GA 1.0
```

### По срокам

**2–3 недели** до нормального staging alpha, если инфраструктура не создаст неожиданных проблем.

**6–10 недель** до закрытой продуктовой alpha с E2E и нормальным cloud lifecycle.

**3–5 месяцев** до качественной paid beta.

**5–8 месяцев** до коммерческого `1.0`, причём главный источник неопределённости — не код, а **валидация Flavor Engine и knowledge base**.

Именно данные, а не Nest или Next, скорее всего окажутся самым дорогим активом FlavorPilot.

Ещё один важный вывод после просмотра репозитория: **архитектуру сейчас больше перестраивать не надо**. Next + Nest + contracts + отдельный Flavor Engine + widget frontend уже дают достаточно хорошую основу. Следующий этап — доказать, что эта архитектура реально собирается, работает end-to-end и полезна людям.
