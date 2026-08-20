# FlavorPilot — полный roadmap от текущего MVP до коммерческого релиза

**Версия документа:** 1.0  
**Дата:** 20 августа 2026  
**Исходная точка:** FlavorPilot `v0.3.0`  
**Формат команды:** один основатель-разработчик + GPT + точечные внешние специалисты  
**Целевой горизонт:** ориентировочно 26–32 недели до полноценного коммерческого GA-релиза  
**Главная цель:** выпустить продукт, которым реальные повара регулярно пользуются, которому доверяют и за который безопасно принимать повторяющиеся платежи.

---

## Содержание

1. [Что считать коммерческим релизом](#1-что-считать-коммерческим-релизом)
2. [Текущая точка проекта](#2-текущая-точка-проекта)
3. [Критические проблемы, которые нужно закрыть первыми](#3-критические-проблемы-которые-нужно-закрыть-первыми)
4. [Границы продукта версии 1.0](#4-границы-продукта-версии-10)
5. [Архитектурные принципы](#5-архитектурные-принципы)
6. [Сводный план по фазам](#6-сводный-план-по-фазам)
7. [Фаза 0 — восстановление стабильной разработки](#7-фаза-0--восстановление-стабильной-разработки)
8. [Фаза 1 — production-ready фундамент](#8-фаза-1--production-ready-фундамент)
9. [Фаза 2 — авторизация, профиль и пользовательская сессия](#9-фаза-2--авторизация-профиль-и-пользовательская-сессия)
10. [Фаза 3 — полная серверная работа с блюдами](#10-фаза-3--полная-серверная-работа-с-блюдами)
11. [Фаза 4 — производственная база ингредиентов и Flavor Engine](#11-фаза-4--производственная-база-ингредиентов-и-flavor-engine)
12. [Фаза 5 — профессиональный конструктор блюда](#12-фаза-5--профессиональный-конструктор-блюда)
13. [Фаза 6 — публичные блюда, поиск и ремиксы](#13-фаза-6--публичные-блюда-поиск-и-ремиксы)
14. [Фаза 7 — подписка, платежи и права доступа](#14-фаза-7--подписка-платежи-и-права-доступа)
15. [Фаза 8 — модерация, юридическая готовность и доверие](#15-фаза-8--модерация-юридическая-готовность-и-доверие)
16. [Фаза 9 — безопасность, наблюдаемость и производительность](#16-фаза-9--безопасность-наблюдаемость-и-производительность)
17. [Фаза 10 — закрытая альфа](#17-фаза-10--закрытая-альфа)
18. [Фаза 11 — платная бета](#18-фаза-11--платная-бета)
19. [Фаза 12 — коммерческий GA-релиз](#19-фаза-12--коммерческий-ga-релиз)
20. [Целевая архитектура к релизу](#20-целевая-архитектура-к-релизу)
21. [Целевая структура API](#21-целевая-структура-api)
22. [Изменения модели данных](#22-изменения-модели-данных)
23. [План валидации Flavor Engine](#23-план-валидации-flavor-engine)
24. [Полная стратегия тестирования](#24-полная-стратегия-тестирования)
25. [Безопасность и модель угроз](#25-безопасность-и-модель-угроз)
26. [Аналитика и продуктовые метрики](#26-аналитика-и-продуктовые-метрики)
27. [Монетизация версии 1.0](#27-монетизация-версии-10)
28. [Go-to-market и подготовка спроса](#28-go-to-market-и-подготовка-спроса)
29. [Операционная модель для одного разработчика](#29-операционная-модель-для-одного-разработчика)
30. [Реестр основных рисков](#30-реестр-основных-рисков)
31. [Контроль расходов](#31-контроль-расходов)
32. [Приоритетный master backlog](#32-приоритетный-master-backlog)
33. [Чек-лист готовности к коммерческому релизу](#33-чек-лист-готовности-к-коммерческому-релизу)
34. [Первые 90 дней после релиза](#34-первые-90-дней-после-релиза)
35. [Что не делать до доказательства спроса](#35-что-не-делать-до-доказательства-спроса)
36. [Итоговая точка принятия решения](#36-итоговая-точка-принятия-решения)

---

# 1. Что считать коммерческим релизом

Коммерческий релиз — это не момент, когда сайт просто открывается в интернете. Для FlavorPilot версия `1.0 GA` должна означать следующее:

1. Пользователь может зарегистрироваться, создать блюдо, получить детерминированный анализ, сохранить его на сервере и вернуться к нему с другого устройства.
2. Пользователь заранее и однозначно понимает, будет блюдо публичным, доступным по ссылке или приватным.
3. Бесплатный пользователь получает реальную пользу, а платный тариф даёт понятную дополнительную ценность.
4. Система корректно принимает платежи, обрабатывает продление, отмену, просрочку и восстановление подписки.
5. У пользовательских данных есть резервное копирование, возможность удаления и понятная политика конфиденциальности.
6. Публичный контент можно пожаловаться, скрыть и модерировать.
7. Flavor Engine выдаёт не случайные числа, а проверяемый результат с версией алгоритма, уровнем уверенности и объяснением.
8. База ингредиентов имеет происхождение данных, статус проверки и лицензии на используемые источники.
9. Ошибки отслеживаются, ключевые метрики собираются, а критические инциденты обнаруживаются автоматически.
10. Проект прошёл закрытую альфу и платную бету; есть хотя бы первые повторяющиеся платежи и признаки возврата пользователей.
11. На сайте опубликованы условия использования, политика конфиденциальности, правила публичного контента, условия подписки и контакт поддержки.
12. Релиз можно откатить без потери данных.

Иными словами, **commercial-ready = продукт + данные + платежи + безопасность + поддержка + доказанная полезность**, а не только работающий интерфейс.

---

# 2. Текущая точка проекта

## 2.1. Что уже есть в `v0.3.0`

### Архитектура

- Monorepo на npm workspaces.
- `apps/web` — Next.js/React frontend.
- `apps/api` — NestJS + Fastify API.
- `packages/contracts` — общие Zod-схемы и TypeScript-типы.
- `packages/flavor-engine` — отдельный детерминированный движок.
- PostgreSQL/Supabase схема.
- Drizzle typed query layer.
- Dockerfile и заготовки под Vercel/Railway.

### Продукт

- Английский и украинский интерфейсы.
- Landing page.
- Конструктор блюда.
- Добавление ингредиентов, граммовки и способов обработки.
- Направления блюда: balanced, fresh, rich, spicy и другие.
- Live-пересчёт в браузере.
- Общая оценка, совместимость, баланс, количество, текстура и уверенность.
- Базовые рекомендации ингредиентов.
- Локальное сохранение в браузере.
- Страницы Discover, Library и Pricing.
- Публичные, unlisted и private модели блюд на уровне контрактов и backend.
- Родословная ремиксов на уровне базы и API.

### Backend

- Health endpoint.
- Детерминированный `/flavor/analyze`.
- AI endpoint для объяснения уже рассчитанного результата.
- Supabase bearer-token guard.
- CRUD блюд.
- Public feed.
- Unlisted share token.
- Версии блюд.
- Серверный лимит приватных блюд Free-плана.
- Проверка неизвестных ингредиентов, обработок и дублей.

### База Flavor Engine

- 38 ингредиентов.
- 12 способов обработки.
- 10 сенсорных измерений в текущем контракте:
  - sweetness;
  - acidity;
  - saltiness;
  - bitterness;
  - umami;
  - fat;
  - pungency;
  - freshness;
  - aromaIntensity;
  - moisture.
- Интенсивность, текстуры, роли и рекомендуемые доли ингредиентов.
- Около 64 ручных поправок парной совместимости.

## 2.2. Ориентировочная зрелость по направлениям

Это не объективная сертификация, а рабочая оценка состояния проекта.

| Направление | Зрелость | Комментарий |
|---|---:|---|
| Архитектурное разделение | 3/5 | Хорошая основа, но ещё не доказана чистой production-сборкой |
| Frontend MVP | 2/5 | Конструктор есть, но нет полноценной сессии, server save и всех состояний UX |
| Backend API | 2/5 | Основной каркас есть, но мало модулей, нет production hardening |
| Авторизация | 1/5 | Guard существует, пользовательский flow отсутствует |
| Persistence | 2/5 | Серверный CRUD существует, но frontend ещё живёт главным образом локально |
| Flavor Engine | 2/5 | Работающая гипотеза, но данные и коэффициенты не валидированы |
| Knowledge base | 1/5 | Небольшая демо-база без полноценного provenance workflow |
| Социальная часть | 1/5 | Основа заложена, но нет полного пользовательского продукта и модерации |
| Платежи | 0/5 | Только поле подписки в схеме |
| Тестирование | 1/5 | Есть unit-заготовки, нет доказанного clean install и E2E |
| Безопасность | 1/5 | Есть правильные идеи, нет завершённой threat model и защитных слоёв |
| Observability | 0/5 | Нет централизованных логов, мониторинга ошибок, метрик и алертов |
| Юридическая готовность | 0/5 | Нет production-документов и процессов прав пользователя |
| Go-to-market | 0/5 | Нет waitlist, CRM, набора тестеров и измеряемой воронки |

## 2.3. Главный вывод

Текущая версия — **хорошая архитектурная и продуктовая заготовка**, но пока не коммерческий MVP. Самая большая ценность уже создана в трёх местах:

1. правильное разделение Next.js и NestJS;
2. независимый Flavor Engine;
3. чёткая продуктовая идея «что происходит с конкретным блюдом».

Самые большие риски находятся не в интерфейсе, а в:

- достоверности кулинарных данных;
- полном пользовательском цикле;
- платежах и правах доступа;
- безопасности публичного контента;
- отсутствии доказанного clean build;
- отсутствии реального пользовательского подтверждения пользы.

---

# 3. Критические проблемы, которые нужно закрыть первыми

До разработки новых функций необходимо стабилизировать сам репозиторий.

## 3.1. Неразрешённые зависимости

Текущий `npm install` падает на точной версии `typescript@5.9.0`, которая в текущем окружении разрешается как `undefined`. Нельзя использовать `--force` или `--legacy-peer-deps` как постоянное решение.

### Обязательные действия

- [ ] Проверить каждую exact-версию через `npm view <package>@<version> version`.
- [ ] Заменить несуществующие и несовместимые версии на реально опубликованные совместимые версии.
- [ ] Проверить совместимость Next.js, React, NestJS, Fastify, TypeScript, Zod, Vitest и Supabase SDK.
- [ ] Удалить остатки неуспешной установки: `node_modules` и неполный lockfile.
- [ ] Выполнить чистый `npm install`.
- [ ] Зафиксировать `package-lock.json`.
- [ ] После этого в CI использовать только `npm ci`.
- [ ] Запретить merge, если `npm ci`, typecheck, tests или build падают.

## 3.2. Недоказанная сборка

Структурная проверка не заменяет реальную компиляцию.

До дальнейшей продуктовой разработки должны проходить:

```bash
npm ci
npm run validate:structure
npm run typecheck
npm test
npm run build
```

## 3.3. Отсутствие рабочей production-среды

Нужно как можно раньше поднять пустой staging, даже если продукт ещё неполный:

- web deployment;
- API deployment;
- staging PostgreSQL;
- healthcheck;
- CORS;
- environment variables;
- миграции;
- логирование;
- smoke test после deploy.

Иначе инфраструктурные проблемы проявятся слишком поздно.

## 3.4. Отсутствие проверенной базы знаний

Нельзя продавать точный процент совместимости на базе 38 неподтверждённых профилей как объективную истину. До валидации формулировки должны быть осторожными:

- «модельная оценка»;
- «ориентировочный баланс»;
- «экспериментальная рекомендация»;
- отображаемый confidence.

---

# 4. Границы продукта версии 1.0

## 4.1. Основной пользователь первой версии

Первичный сегмент:

- независимый повар;
- кулинарный студент;
- активный домашний энтузиаст;
- шеф, который лично разрабатывает блюда;
- автор рецептов, которому не нужна корпоративная закупочная система.

Не основной сегмент версии 1.0:

- сеть ресторанов;
- бухгалтерия ресторана;
- крупный food manufacturer;
- технолог пищевого производства;
- API-клиенты;
- marketplace авторских рецептов.

## 4.2. Обещание продукта

> FlavorPilot моделирует вкус и баланс конкретного блюда в реальном времени и показывает, что изменить, добавить, убрать или заменить.

## 4.3. Must-have возможности GA v1.0

### Конструктор

- ингредиенты;
- граммовка;
- способ обработки;
- направление блюда;
- live-анализ;
- понятное объяснение;
- рекомендации «что добавить»;
- рекомендации по диапазону граммов;
- предупреждения о доминировании и дисбалансе;
- сравнение до/после изменения.

### Аккаунт

- регистрация;
- вход;
- подтверждение email;
- восстановление доступа;
- выход со всех устройств;
- профиль;
- настройки языка;
- удаление аккаунта;
- экспорт пользовательских данных.

### Блюда

- создание;
- редактирование;
- удаление;
- автосохранение черновика;
- private/public/unlisted;
- версия блюда;
- восстановление предыдущей версии;
- share link;
- копирование и ремикс с сохранением авторства.

### Социальная часть

- публичная страница блюда;
- профиль автора;
- поиск и фильтры;
- избранное;
- ремиксы;
- жалоба на контент;
- базовая модерация.

### Подписка

- Free;
- Pro;
- checkout;
- billing portal;
- продление;
- отмена;
- grace period;
- webhook-based entitlement;
- лимит приватных блюд;
- лимит AI-объяснений;
- серверное исполнение всех ограничений.

### Техническая готовность

- staging и production;
- CI/CD;
- миграции;
- backup/restore;
- мониторинг;
- rate limiting;
- аудит зависимостей;
- E2E-тесты;
- алерты;
- runbook инцидента.

### Данные Flavor Engine

- минимум 150 проверенных ингредиентов для платной беты;
- целевой минимум 300 проверенных ингредиентов для GA;
- provenance и confidence;
- минимум 100 benchmark-сценариев;
- независимый review несколькими поварами;
- версия алгоритма и версия knowledge base.

## 4.4. Что явно не входит в GA v1.0

Следующие функции не должны задерживать первый коммерческий релиз:

- командные аккаунты ресторанов;
- Kitchen plan;
- инвентаризация;
- поставщики и закупки;
- автоматическое отслеживание цен;
- себестоимость;
- nutrition;
- аллергены как медицински значимый расчёт;
- технологические карты сложного формата;
- POS-интеграции;
- мобильные приложения;
- публичный API;
- marketplace;
- ML-модель на Python;
- микросервисы;
- Redis без измеренной необходимости;
- рекомендации, обучающиеся автоматически на пользовательских действиях.

Эти функции относятся к `v1.1–v2.x` после доказательства удержания и платежеспособности.

---

# 5. Архитектурные принципы

## 5.1. Сохраняем текущий split

- **Next.js**: UI, SSR, SEO, i18n, публичные страницы, интерактивный клиент.
- **NestJS + Fastify**: бизнес-правила, авторизация, платежи, persistence, модерация, AI, публичный API.
- **PostgreSQL/Supabase**: durable data, Auth, Storage.
- **Flavor Engine package**: все детерминированные оценки.
- **Contracts package**: единый transport contract.

## 5.2. Modular monolith, не микросервисы

До реальной нагрузки backend остаётся одним NestJS-приложением. Модули нужны для порядка, а не для сетевого разделения.

## 5.3. AI не имеет права рассчитывать score

AI может:

- объяснять результат;
- формулировать рекомендации;
- адаптировать объяснение под язык и уровень пользователя;
- резюмировать различия версий.

AI не может:

- менять `overallScore`;
- придумывать отсутствующие свойства ингредиента;
- самостоятельно записывать pairing coefficient;
- обходить confidence;
- обещать гарантированный кулинарный результат.

## 5.4. Каждая оценка воспроизводима

Для любого сохранённого анализа должны фиксироваться:

- `engine_version`;
- `knowledge_version`;
- входные ингредиенты;
- граммы;
- обработки;
- выбранная цель;
- рассчитанные компоненты;
- timestamp;
- confidence.

## 5.5. Клиент не является источником правды

Frontend может мгновенно считать для UX, но:

- entitlement проверяет API;
- сохранение проверяет API;
- публичность проверяет API;
- платный лимит проверяет API;
- финальный анализ для сохранённой версии повторяет API;
- webhook, а не browser redirect, подтверждает оплату.

## 5.6. Production schema изменяется только миграциями

Текущий единый `schema.sql` следует преобразовать в versioned migrations. Нельзя вручную менять production-схему без истории.

---

# 6. Сводный план по фазам

Работы с кулинарными данными идут параллельно почти всему roadmap.

| Фаза | Ориентир | Основной результат |
|---|---:|---|
| 0. Стабилизация | неделя 1 | clean install, lockfile, зелёный CI |
| 1. Production foundation | недели 2–3 | staging, migrations, logs, deploy pipeline |
| 2. Auth и профиль | недели 4–5 | полноценный пользовательский вход |
| 3. Server persistence | недели 6–8 | frontend полностью работает с Nest API |
| 4. Knowledge + Engine | недели 2–16 параллельно | 150 ингредиентов к beta, 300 к GA, benchmark |
| 5. Pro constructor | недели 9–11 | версии, сравнения, сценарии add/remove/replace |
| 6. Social layer | недели 10–13 | discover, favorite, remix, profile, report |
| 7. Billing | недели 12–14 | реальные подписки и entitlement |
| 8. Trust/legal/moderation | недели 13–16 | безопасный UGC и юридические страницы |
| 9. Hardening | недели 14–17 | security, observability, performance, backups |
| 10. Closed alpha | недели 18–20 | 20–30 тестеров, устранение P0/P1 |
| 11. Paid beta | недели 21–26 | первые recurring payments и retention data |
| 12. GA | недели 27–32 | полноценный коммерческий запуск |

## Реалистичная оценка срока

Для одного человека с GPT:

- **агрессивный вариант:** 24–26 недель;
- **реалистичный:** 28–32 недели;
- **если culinary validation идёт медленно:** 36+ недель.

Срок нельзя сокращать за счёт качества knowledge base, безопасности платежей или пользовательской приватности.

---

# 7. Фаза 0 — восстановление стабильной разработки

**Срок:** 3–5 рабочих дней  
**Цель:** любой новый checkout проекта устанавливается и собирается одной стандартной последовательностью команд.

## 7.1. Dependency audit

- [ ] Проверить все версии во всех пяти `package.json`.
- [ ] Исправить `typescript@5.9.0` и любые другие несуществующие pins.
- [ ] Не использовать `--force` и `--legacy-peer-deps` как часть документации.
- [ ] Проверить peer dependencies Nest/Fastify/Swagger.
- [ ] Проверить совместимость Next/React/React DOM.
- [ ] Проверить Zod v4 usage и типы.
- [ ] Проверить Supabase SSR package.
- [ ] Проверить Vitest и TypeScript node types.
- [ ] Оставить один package manager: npm.
- [ ] Не переходить одновременно на pnpm/Turborepo до стабилизации.

## 7.2. Lockfile и clean build

- [ ] Удалить `node_modules`.
- [ ] Удалить повреждённый `package-lock.json`, если он появился.
- [ ] Выполнить `npm install`.
- [ ] Выполнить `npm ci` в чистой копии.
- [ ] Зафиксировать lockfile.
- [ ] Проверить, что `npm run clean` не удаляет исходники.
- [ ] Выполнить полный build.

## 7.3. CI

GitHub Actions должен выполнять:

1. checkout;
2. setup Node из `.nvmrc` или engines;
3. `npm ci`;
4. `npm run validate:structure`;
5. `npm run typecheck`;
6. `npm test`;
7. `npm run build`;
8. dependency audit с явно определённой политикой severity.

## 7.4. Репозиторий

- [ ] Создать `.nvmrc` или `.node-version`.
- [ ] Зафиксировать supported Node LTS.
- [ ] Включить branch protection для `main`.
- [ ] Запретить direct push после стабилизации.
- [ ] Требовать зелёный CI перед merge.
- [ ] Добавить pull request template.
- [ ] Добавить issue templates: bug, feature, data correction.
- [ ] Добавить CODEOWNERS, даже если owner пока один.
- [ ] Удалить устаревшие документы и дубли.

## 7.5. Exit criteria

Фаза завершена только если:

- чистый clone успешно проходит `npm ci`;
- все workspace packages находятся корректно;
- typecheck зелёный;
- unit tests зелёные;
- Next production build зелёный;
- Nest production build зелёный;
- CI воспроизводит те же результаты;
- lockfile закоммичен;
- README содержит только проверенные команды.

---

# 8. Фаза 1 — production-ready фундамент

**Срок:** 1–2 недели  
**Цель:** создать безопасный staging-контур и нормальный процесс доставки изменений.

## 8.1. Среды

Создать четыре режима:

| Среда | Назначение | Данные |
|---|---|---|
| Local | разработка | локальные/тестовые |
| Preview | каждый PR | временные или staging read-only |
| Staging | интеграционные проверки | отдельный staging project |
| Production | реальные пользователи | отдельная production DB |

Нельзя использовать production Supabase для локальной разработки.

## 8.2. Deployment

### Web

- [ ] Подключить `apps/web` к Vercel.
- [ ] Проверить monorepo root/build settings.
- [ ] Настроить Preview Deployments.
- [ ] Добавить `NEXT_PUBLIC_APP_URL`.
- [ ] Добавить `NEXT_PUBLIC_API_URL`.
- [ ] Настроить production domain позже отдельным шагом.

### API

- [ ] Поднять Nest container на Railway/аналогичном container host.
- [ ] Настроить healthcheck `/v1/health`.
- [ ] Настроить graceful shutdown.
- [ ] Ограничить CORS конкретными доменами.
- [ ] Проверить `X-Forwarded-*` и proxy trust.
- [ ] Настроить autosuspend только если он не ломает UX beta.
- [ ] Проверить start command из собранного `dist`.

### Database

- [ ] Создать отдельные staging и production Supabase projects.
- [ ] Перевести SQL в `supabase/migrations/<timestamp>_*.sql`.
- [ ] Создать команду применения миграций.
- [ ] Добавить migration status check.
- [ ] Seed запускать только в local/staging.
- [ ] Production seed должен быть явным knowledge release, а не демо-данными.

## 8.3. Configuration

- [ ] Добавить строгую validation env при старте Nest.
- [ ] Разделить required и optional secrets.
- [ ] API должен падать при некорректном production config.
- [ ] Web не должен получать server secrets.
- [ ] Добавить `APP_ENV`, `APP_VERSION`, `GIT_SHA`.
- [ ] Health endpoint должен сообщать версию без утечки secrets.

## 8.4. Логи

- [ ] Перейти на структурированные JSON-логи в API.
- [ ] Сохранять `requestId`.
- [ ] Логировать route, status, duration, userId в безопасной форме.
- [ ] Никогда не логировать access token, password, API key или полный dish private content без необходимости.
- [ ] Отделить audit events от debug logs.

## 8.5. Exit criteria

- staging web доступен;
- staging API доступен;
- staging DB подключена;
- deploy выполняется из `main`;
- preview создаётся для PR;
- миграция применяется воспроизводимо;
- smoke test после deployment зелёный;
- rollback web/API документирован;
- production ещё может быть закрыт паролем или waitlist.

---

# 9. Фаза 2 — авторизация, профиль и пользовательская сессия

**Срок:** 1–2 недели  
**Цель:** пользовательский аккаунт работает полностью, а не только на уровне backend guard.

## 9.1. Auth flows

- [ ] Sign up по email.
- [ ] Email verification.
- [ ] Sign in.
- [ ] Sign out.
- [ ] Forgot password.
- [ ] Reset password.
- [ ] Auth callback route.
- [ ] Обработка expired/invalid link.
- [ ] Session refresh.
- [ ] Redirect обратно в builder после входа.
- [ ] Optional OAuth только после стабильного email flow.

## 9.2. Web session architecture

- [ ] Уточнить единый способ хранения Supabase session.
- [ ] Исключить дублирующую auth state между server/client.
- [ ] Проверить middleware/proxy locale routing.
- [ ] Защитить `/library`, `/settings`, `/billing`.
- [ ] На публичных страницах не делать обязательный session fetch, если он ухудшает кэширование.

## 9.3. Профиль

Добавить Nest `ProfilesModule` и UI:

- username;
- display name;
- avatar;
- bio;
- locale;
- публичный профиль;
- дата регистрации;
- counters позже.

### Username rules

- [ ] уникальность без учёта регистра;
- [ ] допустимые символы;
- [ ] зарезервированные системные имена;
- [ ] rate limit на смену;
- [ ] redirect или история username — можно после GA;
- [ ] антиспам-проверка.

## 9.4. Account settings

- [ ] Изменение языка.
- [ ] Изменение имени.
- [ ] Изменение avatar.
- [ ] Изменение email через Supabase flow.
- [ ] Выход со всех устройств.
- [ ] Экспорт данных.
- [ ] Запрос удаления аккаунта.
- [ ] Подтверждение destructive action.

## 9.5. Anonymous-to-account migration

Текущая local library полезна для первого wow-момента. После регистрации нужно предложить:

> «Перенести локальные блюда в аккаунт».

Правила:

- не переносить молча;
- показать количество;
- разрешить выбрать блюда;
- при конфликте создать новые IDs;
- не публиковать их автоматически;
- по умолчанию импортировать как private;
- не дублировать при повторном callback.

## 9.6. Exit criteria

- новый пользователь проходит signup → verification → sign in;
- session сохраняется после reload;
- protected API получает действующий bearer token;
- локальные блюда можно перенести;
- account deletion проходит end-to-end в staging;
- auth errors понятны на EN и UK;
- E2E smoke тестирует весь auth flow.

---

# 10. Фаза 3 — полная серверная работа с блюдами

**Срок:** 2–3 недели  
**Цель:** зарегистрированный пользователь работает с серверной библиотекой, а localStorage остаётся только anonymous fallback и temporary draft cache.

## 10.1. Builder integration

- [ ] Подключить create dish к `POST /v1/dishes`.
- [ ] Подключить update к `PATCH /v1/dishes/:id`.
- [ ] Подключить delete.
- [ ] Подключить `GET /dishes/me`.
- [ ] Подключить `GET /dishes/me/:id`.
- [ ] Сохранять server ID в URL.
- [ ] Обрабатывать optimistic UI безопасно.
- [ ] Показать unsaved changes.
- [ ] Добавить debounce autosave для authenticated drafts.
- [ ] Не отправлять запрос на каждое движение граммов без debounce.

## 10.2. Конфликты и версии

Нужно добавить optimistic concurrency:

- `updatedAt` или explicit revision;
- `If-Match`/version token либо поле `expectedVersion`;
- при конфликте не перетирать молча;
- показать пользователю выбор:
  - загрузить серверную версию;
  - сохранить копию;
  - вручную сравнить.

## 10.3. Version API

Добавить endpoints:

```text
GET  /v1/dishes/:id/versions
GET  /v1/dishes/:id/versions/:version
POST /v1/dishes/:id/versions/:version/restore
```

Для каждой версии хранить:

- snapshot;
- analysis snapshot;
- engine version;
- knowledge version;
- creator;
- timestamp;
- change summary, если доступен.

## 10.4. Visibility UX

Перед каждым первым сохранением явно показать:

- Public;
- Unlisted;
- Private.

Для Free:

- неограниченные public;
- разумное количество unlisted по продуктовой гипотезе;
- три private;
- никакой скрытой публикации.

## 10.5. Share links

- [ ] Показать share URL владельцу.
- [ ] Кнопка copy.
- [ ] Regenerate token.
- [ ] Revoke link.
- [ ] Unlisted не попадает в sitemap/search/feed.
- [ ] Private не открывается даже со старым share token.

## 10.6. Image handling

Вместо произвольного `imageUrl`:

- Supabase Storage bucket;
- signed upload policy;
- разрешённые MIME;
- лимит размера;
- image re-encoding;
- удаление EXIF;
- thumbnail;
- orphan cleanup;
- проверка права владельца.

## 10.7. Exit criteria

- authenticated builder полностью server-backed;
- refresh не теряет данные;
- другое устройство видит библиотеку;
- visibility работает реально;
- private limit нельзя обойти через API;
- unlisted token можно отозвать;
- versions доступны и восстанавливаются;
- конфликт редактирования не приводит к тихой потере данных;
- E2E покрывает create/edit/save/delete/share.

---

# 11. Фаза 4 — производственная база ингредиентов и Flavor Engine

**Срок:** 12–16 недель параллельно другим фазам  
**Цель:** превратить демонстрационную математику в управляемый и проверяемый продуктовый актив.

Это самый важный поток проекта. Красивый интерфейс нельзя считать moat; база знаний, методика, calibration и feedback loop могут им стать.

## 11.1. Целевой объём

### Closed alpha

- 80–100 ингредиентов;
- 60 benchmark-сценариев;
- 3–5 кулинарных reviewers.

### Paid beta

- минимум 150 проверенных ингредиентов;
- 100–150 benchmark-сценариев;
- основные категории:
  - мясо;
  - рыба и морепродукты;
  - овощи;
  - фрукты;
  - молочные продукты;
  - зерновые и крахмалы;
  - масла и жиры;
  - кислоты;
  - специи;
  - травы;
  - соусы и ферментированные продукты;
  - орехи и семена.

### GA

- целевой минимум 300 ингредиентов;
- 200+ benchmark-сценариев;
- покрытие самых частых пользовательских запросов;
- production provenance.

## 11.2. Новая модель knowledge data

Текущий `ingredients.ts` не должен навсегда оставаться ручным production-источником. Нужна версия данных.

Предлагаемые сущности:

### `knowledge_releases`

- id;
- semantic version;
- status: draft/review/approved/retired;
- created_at;
- approved_at;
- checksum;
- notes.

### `ingredient_definitions`

- stable ingredient ID;
- EN/UK names;
- category;
- aliases;
- active flag.

### `ingredient_profile_versions`

- ingredient ID;
- knowledge release;
- sensory profile;
- intensity;
- texture intensity;
- roles;
- share ranges;
- reviewer status;
- confidence.

### `preparation_effect_versions`

- ingredient;
- preparation;
- multipliers;
- textures;
- aromas;
- confidence.

### `pairing_evidence`

- ingredient A/B;
- adjustment;
- evidence type;
- source reference;
- license;
- reviewer;
- confidence;
- notes.

### `knowledge_sources`

- title;
- author/organization;
- source type;
- URL/DOI/ISBN/reference;
- license or usage basis;
- access date;
- allowed use;
- internal notes.

## 11.3. Runtime delivery

Не следует выполнять десятки DB-запросов при каждом расчёте. Предпочтительная схема:

1. Admin/editor сохраняет данные в knowledge DB.
2. Одобренный release экспортируется в versioned JSON/TypeScript artifact.
3. Artifact проходит validation и checksum.
4. Flavor Engine загружает конкретную версию.
5. API и frontend используют один и тот же release.
6. При rollback можно вернуть предыдущий artifact.

## 11.4. Internal ingredient editor

Нужна закрытая admin-панель:

- create/edit ingredient;
- aliases EN/UK;
- sensory sliders;
- roles;
- textures;
- preparations;
- recommended share ranges;
- pairing evidence;
- source links;
- review state;
- comment thread;
- diff между версиями;
- publish release;
- rollback release.

Admin authorization должен быть отдельным server-side role, а не скрытой кнопкой.

## 11.5. Нормализация алгоритма

Провести технический review текущих формул:

- вклад граммовки;
- нормализация по общей массе;
- влияние интенсивности;
- парное взвешивание;
- маленькие специи не должны исчезать из-за малой массы;
- сильные специи не должны доминировать линейно;
- обработка должна менять профиль предсказуемо;
- candidate utility должна учитывать current deficit;
- compatibility и utility не должны смешиваться;
- confidence должен зависеть от данных, а не от красивого числа.

## 11.6. Версионирование результатов

Добавить:

```text
engineVersion: "1.0.0"
knowledgeVersion: "2026.10"
analysisSchemaVersion: "1"
```

Любая смена коэффициентов должна:

- менять engine version;
- запускать benchmark regression;
- генерировать diff;
- не пересчитывать старые версии молча.

## 11.7. Confidence model

Confidence должен учитывать:

- долю ингредиентов с проверенным профилем;
- наличие explicit pair evidence;
- confidence preparation effects;
- выход за рекомендованные ranges;
- неизвестные или пользовательские ingredients;
- количество ингредиентов;
- coverage benchmark.

Пользователю показывать не псевдоточность, а уровни:

- High;
- Medium;
- Experimental.

Можно показывать число внутри, но объяснять смысл.

## 11.8. Human review process

Для каждого benchmark-сценария reviewer оценивает:

1. корректно ли найден главный дисбаланс;
2. полезна ли первая рекомендация;
3. разумен ли диапазон граммов;
4. не пропущен ли очевидный конфликт;
5. понятна ли формулировка;
6. насколько reviewer уверен;
7. есть ли несогласие между reviewers.

Несогласия не нужно скрывать: они дают информацию о субъективности кухни.

## 11.9. Exit criteria для paid beta

- минимум 150 ингредиентов со статусом approved;
- каждый имеет source/provenance;
- основные preparation effects проверены;
- 100+ benchmark-сценариев;
- no critical regression;
- reviewers считают минимум 75–80% направлений рекомендаций полезными — это продуктовая цель-гипотеза, а не научный стандарт;
- confidence коррелирует с количеством проверенных данных;
- все production analyses сохраняют engine/knowledge version.

## 11.10. Exit criteria для GA

- минимум 300 approved ingredients;
- 200+ benchmark scenarios;
- documented methodology;
- data license review завершён;
- no proprietary competitor data;
- исправления knowledge base проходят review workflow;
- пользователь может сообщить о спорном результате;
- есть процесс исправления и release notes.

---

# 12. Фаза 5 — профессиональный конструктор блюда

**Срок:** 2–3 недели после server persistence  
**Цель:** превратить «интересный калькулятор» в рабочий инструмент.

## 12.1. UX конструктора

- [ ] Desktop split view: состав слева, анализ справа.
- [ ] Mobile step flow без потери контекста.
- [ ] Keyboard-friendly ingredient search.
- [ ] Aliases и fuzzy search.
- [ ] Недавние ingredients.
- [ ] Категории.
- [ ] Pantry/favorites позже как P1.
- [ ] Clear empty state.
- [ ] Loading/error/retry states.
- [ ] Undo/redo минимум на уровне текущей сессии.

## 12.2. Scenario analysis

Добавить режимы:

### Add

> Что лучше добавить?

### Remove

> Какой ингредиент сильнее всего ухудшает текущую композицию?

### Replace

> Чем заменить ингредиент с похожей ролью и меньшим конфликтом?

### Adjust quantity

> Какие 1–3 изменения граммов дадут наибольший ожидаемый эффект?

Каждая рекомендация показывает:

- compatibility;
- utility;
- current reason;
- recommended range;
- projected delta;
- confidence;
- ограничения.

## 12.3. Before/after simulation

Пользователь должен видеть:

```text
Текущий вариант: 76
После изменения: 84

Acidity: 3.2 → 5.1
Fat: 8.0 → 7.6 perceived
Freshness: 2.8 → 5.0
```

Важно: прогноз не должен формулироваться как гарантия.

## 12.4. Version comparison

Сравнение двух versions:

- добавленные ingredients;
- удалённые;
- изменённые grams;
- изменённые preparations;
- score components;
- profile delta;
- main issue delta;
- recommendation delta;
- engine/knowledge version.

## 12.5. Explanation levels

Предусмотреть три глубины:

1. **Quick:** одна проблема + один следующий шаг.
2. **Detailed:** компоненты score, пары, quantity, texture.
3. **AI explanation:** человекочитаемое объяснение с лимитом.

Детерминированное объяснение должно оставаться доступным даже без AI.

## 12.6. Accessibility и локализация

- [ ] Полная клавиатурная навигация.
- [ ] Focus states.
- [ ] Screen reader labels.
- [ ] Не полагаться только на цвет.
- [ ] Контраст.
- [ ] `lang` корректно меняется EN/UK.
- [ ] Форматы дат/чисел локализованы.
- [ ] Все error messages переведены.
- [ ] Нет hardcoded English в API-facing UI.

## 12.7. Exit criteria

- новый пользователь без объяснений создаёт блюдо;
- видит причину score;
- может принять рекомендацию одним действием;
- видит before/after;
- сохраняет version;
- mobile flow удобен;
- accessibility audit не имеет критических ошибок;
- deterministic flow работает при отключённом AI.

---

# 13. Фаза 6 — публичные блюда, поиск и ремиксы

**Срок:** 2–3 недели  
**Цель:** создать organic content loop без ущерба приватности.

## 13.1. Public dish page

Страница должна включать:

- название;
- автор;
- изображение;
- ingredients;
- preparations;
- grams, если автор разрешает;
- score summary;
- confidence;
- engine/knowledge version;
- описание;
- parent attribution;
- remix button;
- favorite;
- report;
- share metadata.

## 13.2. Showcase mode

Платный пользователь позднее может публиковать концепт, скрывая:

- точные grams;
- technology notes;
- temperatures;
- private notes;
- costing.

Для v1.0 можно реализовать минимально:

- public full recipe;
- public showcase with hidden quantities;
- unlisted;
- private.

Если showcase сильно задерживает релиз, перенести в `v1.1`, но data model заложить заранее.

## 13.3. Discover

- cursor pagination;
- search по названию;
- ingredients filter;
- goal filter;
- language-independent ingredient IDs;
- newest;
- most remixed;
- editor picks позже;
- никакого «highest score = best dish» как единственного ranking.

## 13.4. Favorites

Добавить API:

```text
POST   /v1/dishes/:id/favorite
DELETE /v1/dishes/:id/favorite
GET    /v1/favorites
```

## 13.5. Remix lineage

- parent immutable;
- attribution visible;
- diff from parent;
- original deletion не удаляет child;
- private dish нельзя ремиксить чужому пользователю;
- unlisted remix policy явно определена;
- автор может запретить public remix только если это предусмотрено terms; решение принять до beta.

## 13.6. Profiles

Public profile:

- avatar;
- name;
- bio;
- public dishes;
- remix count;
- favorite count, если показывается;
- joined date;
- links — лучше после moderation readiness.

Не вводить сложный Chef Score до появления устойчивой системы против накрутки.

## 13.7. Reporting

Добавить причины:

- spam;
- harassment;
- copyright;
- dangerous content;
- misleading content;
- personal data;
- other.

Report должен создавать moderation case, а не немедленно удалять запись.

## 13.8. Exit criteria

- публичное блюдо индексируется и шарится;
- unlisted не индексируется;
- private не утечёт в feed/API;
- favorite работает;
- remix сохраняет attribution;
- report поступает в moderation queue;
- есть базовая защита от спама;
- удаление аккаунта корректно обрабатывает публичные блюда по выбранной policy.

---

# 14. Фаза 7 — подписка, платежи и права доступа

**Срок:** 2 недели  
**Цель:** безопасно принять первые повторяющиеся платежи.

## 14.1. Решение по payment provider

До реализации определить:

- страна юридического лица;
- доступные провайдеры;
- валюта;
- налоги;
- VAT/sales tax;
- кто является merchant of record;
- refund policy;
- invoice requirements;
- payout account;
- санкционные и географические ограничения.

Это решение нужно сверить с бухгалтером/юристом. Архитектура должна скрывать провайдера за `BillingService`.

## 14.2. Тарифы v1.0

### Free

- полный базовый конструктор;
- live score;
- public dishes;
- public discovery;
- remix;
- до 3 private dishes;
- ограниченное число глубоких AI explanations;
- ограниченная version history либо последние 3 версии.

### Pro

- unlimited private dishes;
- unlimited drafts;
- полная version history;
- add/remove/replace scenarios;
- quantity optimization;
- showcase mode, если готов;
- collections, если успевает;
- разумный месячный AI allowance;
- priority support пока без SLA.

Не запускать Studio/Kitchen как оплачиваемые планы, пока функций нет.

## 14.3. Billing flow

- [ ] Pricing page.
- [ ] Checkout session создаёт только backend.
- [ ] Success/cancel pages.
- [ ] Billing portal.
- [ ] Webhook signature verification.
- [ ] Idempotent webhook storage.
- [ ] Customer mapping.
- [ ] Subscription status mapping.
- [ ] Renewal.
- [ ] Cancellation at period end.
- [ ] Immediate cancellation policy.
- [ ] Failed payment.
- [ ] Grace period.
- [ ] Trial, только если есть гипотеза.
- [ ] Refund event.
- [ ] Chargeback handling.

## 14.4. Entitlement service

Создать единый серверный сервис:

```text
canCreatePrivateDish(user)
canUseAdvancedRecommendation(user)
canUseAiExplanation(user)
canAccessVersionHistory(user)
getMonthlyUsage(user)
```

Нельзя размазывать проверки тарифа по контроллерам.

## 14.5. Usage metering

Для AI:

- monthly quota;
- per-minute rate limit;
- request hash cache;
- token/cost accounting;
- timeout;
- retry policy;
- hard monthly budget;
- kill switch;
- fallback deterministic explanation.

## 14.6. Billing tables

Помимо `subscriptions`, потребуются:

- `billing_customers`;
- `billing_events`;
- `entitlement_overrides`;
- `usage_counters`;
- `plans` или code-defined plan matrix;
- idempotency key;
- raw webhook storage с ограниченным retention и безопасной обработкой.

## 14.7. Exit criteria

- sandbox checkout end-to-end;
- webhook обновляет entitlement;
- success redirect сам по себе не выдаёт Pro;
- duplicate webhook безопасен;
- отмена корректна;
- failed payment переводит в grace/inactive по policy;
- free limits нельзя обойти client-side;
- billing portal открывается;
- E2E/sandbox тестирует основные состояния;
- первая реальная транзакция проводится только после legal readiness.

---

# 15. Фаза 8 — модерация, юридическая готовность и доверие

**Срок:** 2–3 недели, частично параллельно  
**Цель:** безопасно работать с публичным пользовательским контентом и деньгами.

## 15.1. Обязательные документы

Перед paid beta подготовить и проверить специалистом:

- Terms of Service;
- Privacy Policy;
- Cookie Policy, если используются необязательные cookies/trackers;
- Acceptable Use Policy;
- Community Guidelines;
- Subscription, cancellation and refund terms;
- AI disclosure;
- culinary accuracy disclaimer;
- copyright/takedown process;
- contact details;
- список основных processors/subprocessors;
- data retention policy.

## 15.2. Право собственности на рецепты

Правила должны однозначно говорить:

- автор сохраняет права на свой контент;
- FlavorPilot получает ограниченную лицензию, необходимую для показа публичного контента;
- private content не используется для публичных рекомендаций без согласия;
- remix не отменяет attribution;
- пользователь отвечает за право публикации изображения и текста;
- процесс copyright complaint описан.

## 15.3. Privacy controls

- [ ] Consent для analytics, если требуется выбранной моделью.
- [ ] Data export.
- [ ] Account deletion.
- [ ] Удаление private data.
- [ ] Policy для сохранения billing/legal records.
- [ ] Policy для anonymization public content после удаления.
- [ ] Revocation unlisted links.
- [ ] No private dish in search index/log payload.
- [ ] DPA readiness позже для B2B.

## 15.4. Moderation workflow

Минимальная admin queue:

- open cases;
- content preview;
- reporter;
- reason;
- author history;
- action: no action/hide/remove/warn/suspend;
- moderator notes;
- audit trail;
- appeal contact.

## 15.5. Опасные рекомендации

FlavorPilot — кулинарный инструмент, но нужно учитывать:

- потенциально небезопасные температуры;
- несъедобные или токсичные ингредиенты;
- misuse wild mushrooms/plants;
- allergy/nutrition claims;
- raw animal products;
- user-created ingredients.

Для v1.0:

- не давать safety-critical cooking temperature instructions без отдельной проверенной системы;
- не позиционировать score как безопасность пищи;
- показывать disclaimer;
- ограничить каталог съедобными проверенными продуктами;
- user-defined ingredient не должен автоматически получать доверенный профиль.

## 15.6. Brand and business setup

- [ ] Проверка товарного знака FlavorPilot.
- [ ] Домен.
- [ ] Социальные handles.
- [ ] Юридическое лицо или подходящая форма деятельности.
- [ ] Банковский/payment account.
- [ ] Бухгалтерия.
- [ ] Support email.
- [ ] Security contact.
- [ ] Abuse contact.

## 15.7. Exit criteria

- legal pages опубликованы EN/UK;
- payment terms согласованы;
- пользователь может удалить/экспортировать данные;
- report и moderation работают;
- private/public ownership rules понятны;
- support/abuse контакты работают;
- paid beta одобрена по юридическому checklist.

---

# 16. Фаза 9 — безопасность, наблюдаемость и производительность

**Срок:** 2–3 недели  
**Цель:** продукт можно поддерживать после запуска, а не только демонстрировать.

## 16.1. Security baseline

- [ ] Threat model.
- [ ] Rate limiting по IP и user ID.
- [ ] Отдельные limits для auth, analyze, AI, search, reports.
- [ ] CORS allowlist.
- [ ] Security headers.
- [ ] CSP, совместимая с Next и analytics.
- [ ] Secure cookies/session config.
- [ ] Input validation на каждом endpoint.
- [ ] Output schema validation для AI.
- [ ] Parameterized SQL only.
- [ ] SSRF protection — не загружать произвольные remote image URLs backend-ом.
- [ ] Upload scanning/type validation.
- [ ] Secrets rotation procedure.
- [ ] Dependency vulnerability scan.
- [ ] Secret scanning в GitHub.
- [ ] Branch protection.
- [ ] Least-privilege DB credentials.
- [ ] Separate service credentials per environment.

## 16.2. Supabase auth verification

Текущий network call к authenticated-user endpoint допустим для ранней версии, но до нагрузки нужно:

- измерить latency;
- добавить timeout;
- корректно различать invalid token и provider outage;
- рассмотреть локальную JWT verification через JWKS;
- кешировать keys, а не user permissions;
- не доверять claims, которые могут менять billing entitlement без DB check.

## 16.3. Observability

### Error monitoring

- frontend exceptions;
- backend exceptions;
- source maps;
- release tag;
- environment tag;
- user ID в псевдонимизированном виде;
- alert on spike.

### Logs

- JSON logs;
- request ID;
- status;
- duration;
- route;
- deployment version;
- no secrets/private payload by default.

### Metrics

- request rate;
- error rate;
- p50/p95/p99 latency;
- DB pool saturation;
- query duration;
- AI request count/cost/failure;
- auth failure;
- webhook failure;
- background task failure;
- storage errors.

### Uptime

- web homepage;
- API health;
- analyze synthetic request;
- auth callback check;
- billing webhook health indirectly through alerts.

## 16.4. Backups

- [ ] Автоматический DB backup.
- [ ] Retention policy.
- [ ] Point-in-time recovery, если выбранный план поддерживает.
- [ ] Storage backup policy.
- [ ] Restore drill на staging.
- [ ] Документированный RPO/RTO.
- [ ] Экспорт critical billing mapping.

Начальная цель:

- RPO не хуже 24 часов для beta, лучше при доступности;
- RTO до нескольких часов;
- к GA выполнить реальный restore drill.

## 16.5. Performance budgets

Цели-гипотезы:

- deterministic browser analysis визуально мгновенный;
- server analyze p95 < 500 ms без AI;
- public read p95 < 700 ms;
- LCP главной страницы < 2.5 s на типичном mobile соединении;
- interaction latency builder < 100 ms для локального расчёта;
- public page не тянет лишнюю authenticated session зависимость;
- изображения оптимизированы;
- bundles измеряются.

## 16.6. Load test

Сценарии:

- 50–100 concurrent analyze requests;
- public feed pagination;
- burst после публикации ссылки;
- AI rate limit;
- webhook duplicates;
- DB pool behavior.

Не нужно оптимизировать до миллионов пользователей; нужно найти явные ошибки архитектуры.

## 16.7. Exit criteria

- P0 security findings отсутствуют;
- rate limits работают;
- error monitoring получает тестовую ошибку;
- uptime alert срабатывает;
- backup восстановлен на staging;
- p95 находится в бюджете;
- AI budget имеет hard limit;
- incident runbook написан;
- production secrets не встречаются в клиентском bundle или логах.

---

# 17. Фаза 10 — закрытая альфа

**Срок:** 2–3 недели  
**Цель:** проверить полезность и понятность до публичных платежей.

## 17.1. Набор тестеров

Цель: 20–30 человек, включая:

- 5–10 профессиональных поваров;
- 5 кулинарных студентов;
- 5 активных домашних энтузиастов;
- несколько авторов рецептов.

Важно не набирать только знакомых, которые будут вежливо хвалить.

## 17.2. Alpha onboarding

- личное приглашение;
- короткое видео 2–3 минуты;
- задача создать реальное блюдо;
- задача изменить один ингредиент;
- задача приготовить хотя бы часть предложенных изменений;
- форма обратной связи внутри продукта.

## 17.3. Что измерять

- время до первого добавленного ингредиента;
- время до первого полного анализа;
- понял ли пользователь compatibility vs utility;
- принял ли рекомендацию;
- сохранил ли блюдо;
- вернулся ли через 7 дней;
- было ли фактическое приготовление;
- была ли рекомендация полезна после приготовления;
- какой термин непонятен;
- где пользователь перестал доверять score.

## 17.4. Качественные интервью

После 3–5 дней использования спросить:

1. Какую задачу ты решал?
2. Что сделал бы без FlavorPilot?
3. Какое объяснение оказалось полезным?
4. Где результат показался неправильным?
5. Что ты боялся публиковать?
6. За что ты бы заплатил?
7. Что было бы достаточной причиной отменить подписку?
8. Кому ты бы отправил ссылку?

## 17.5. Alpha issue policy

- P0: утечка private данных, потеря данных, auth bypass — исправлять немедленно.
- P1: неверное сохранение, невозможность завершить core flow, грубая ошибка score — блокирует следующий этап.
- P2: UX friction — исправлять по частоте.
- P3: cosmetic — не задерживает beta.

## 17.6. Alpha exit gate

Рекомендуемые признаки готовности:

- не менее 15 активированных тестеров;
- не менее 50 реальных блюд;
- минимум 8–10 пользователей вернулись повторно;
- минимум 5 пользователей использовали систему для фактического приготовления;
- нет открытых P0/P1;
- большинство reviewers считает направление основных рекомендаций полезным;
- минимум несколько пользователей явно хотят private workspace/history;
- есть подтверждённый pricing interview signal.

Если этих сигналов нет, не переходить сразу к маркетингу — исправить core value.

---

# 18. Фаза 11 — платная бета

**Срок:** 4–6 недель  
**Цель:** доказать, что продукт не только нравится, но и удерживает платящих пользователей.

## 18.1. Beta scope

- Free и Pro реально работают.
- 150+ validated ingredients.
- Auth, persistence, privacy, versions.
- Advanced scenarios.
- Billing.
- Support.
- Moderation.
- Analytics.
- Feature flags.
- Beta label и честное описание ограничений.

## 18.2. Pricing experiment

Не тестировать много вариантов одновременно. Выбрать одну гипотезу, например:

- monthly Pro;
- annual Pro со скидкой;
- без сложного trial либо с коротким trial после решения.

Измерять:

- pricing page view;
- checkout start;
- checkout complete;
- first paid value action;
- cancellation reason;
- refund;
- active use after payment.

## 18.3. Beta support

- support email;
- in-app feedback;
- response target, например 1–2 рабочих дня;
- known issues page;
- status page либо простой status channel;
- manual entitlement override для исправления billing issue;
- refund procedure.

## 18.4. Feature flags

Под флагами:

- AI explanation;
- showcase mode;
- new engine version;
- new knowledge release;
- public ranking;
- experimental recommendations.

Флаг должен быть server-controlled для paid features.

## 18.5. Beta metrics

Главные:

- activated users;
- D7/D30 return;
- weekly active creators;
- dishes analyzed per active creator;
- recommendations applied;
- saved private dishes;
- public dishes/remixes;
- Pro conversion;
- monthly churn;
- AI cost per active paid user;
- support tickets per user;
- disputed recommendation rate.

## 18.6. Beta exit gate

Для перехода в GA не нужен огромный MRR. Нужны признаки работоспособности модели:

- минимум 5–10 реальных recurring subscribers;
- несколько пользователей пережили хотя бы одно продление;
- отсутствуют P0/P1;
- D30 retention показывает не только одноразовый интерес;
- paid users регулярно используют Pro-функции;
- AI cost и infrastructure cost контролируемы;
- charge/refund flow проверен;
- private data incidents отсутствуют;
- support load посилен одному человеку;
- knowledge correction process работает.

Если люди платят, но не возвращаются, GA откладывается: проблема в ценности, а не в маркетинге.

---

# 19. Фаза 12 — коммерческий GA-релиз

**Срок:** 1–2 недели на финальную подготовку после beta gate  
**Цель:** снять beta-only ограничения и публично запустить FlavorPilot как коммерческий SaaS.

## 19.1. Product release

- [ ] 300 approved ingredients или формально согласованный минимальный coverage.
- [ ] Core flow без beta blockers.
- [ ] Public pages polished.
- [ ] Pricing окончательно понятен.
- [ ] Billing production mode.
- [ ] Version history.
- [ ] Remix attribution.
- [ ] Privacy controls.
- [ ] Account export/delete.
- [ ] EN/UK parity.

## 19.2. Engineering release

- [ ] Release candidate branch/tag.
- [ ] Changelog.
- [ ] DB migration dry run.
- [ ] Backup перед release.
- [ ] Production smoke tests.
- [ ] Rollback plan.
- [ ] Feature flag kill switches.
- [ ] Error monitoring.
- [ ] Uptime alerts.
- [ ] Support schedule на первые 72 часа.

## 19.3. Public launch package

- landing page;
- 60–90 second demo;
- founder story;
- FAQ;
- public methodology page;
- pricing;
- examples;
- press/social kit;
- launch email;
- waitlist conversion campaign;
- feedback CTA.

## 19.4. Launch sequencing

Рекомендуемый порядок:

1. Soft launch существующим beta users.
2. Проверка production billing и нагрузок.
3. Приглашение waitlist небольшими волнами.
4. Публичные публикации.
5. Партнёрские кулинарные сообщества.
6. Только после стабильности — более широкие площадки.

## 19.5. GA exit definition

GA считается состоявшимся, когда:

- продукт открыт без invite;
- реальные платежи проходят;
- core SLO выполняются;
- legal/support доступны;
- пользователи могут безопасно удалить и экспортировать данные;
- incident/rollback процессы проверены;
- Flavor Engine methodology и limitations опубликованы;
- есть первые внешние пользователи, не связанные с основателем.

---

# 20. Целевая архитектура к релизу

```text
                         ┌──────────────────────────┐
                         │        Browser           │
                         │ Next.js / React / i18n   │
                         └────────────┬─────────────┘
                                      │ HTTPS
                                      ▼
                         ┌──────────────────────────┐
                         │    NestJS + Fastify      │
                         │   Modular Monolith API   │
                         ├──────────────────────────┤
                         │ Auth                     │
                         │ Profiles                 │
                         │ Dishes / Versions        │
                         │ Flavor                   │
                         │ Recommendations          │
                         │ Social / Favorites       │
                         │ Billing / Entitlements   │
                         │ Moderation               │
                         │ Uploads                  │
                         │ AI Explanation           │
                         │ Admin / Knowledge        │
                         └──────┬─────────┬─────────┘
                                │         │
                     ┌──────────▼───┐ ┌──▼──────────────┐
                     │ PostgreSQL   │ │ OpenAI / AI API │
                     │ Supabase     │ │ optional layer  │
                     └──────┬───────┘ └─────────────────┘
                            │
                     ┌──────▼───────┐
                     │ Object Store │
                     │ dish images  │
                     └──────────────┘

Shared build-time/runtime packages:
- @flavorpilot/contracts
- @flavorpilot/flavor-engine
- versioned knowledge artifact
```

## 20.1. Nest modules к GA

Текущие:

- AuthModule;
- DishesModule;
- FlavorModule;
- AiModule;
- DatabaseModule;
- HealthModule.

Добавить:

- ProfilesModule;
- VersionsModule или часть DishesModule;
- FavoritesModule;
- BillingModule;
- EntitlementsModule;
- UsageModule;
- UploadsModule;
- ReportsModule;
- ModerationModule;
- AdminModule;
- KnowledgeModule;
- AuditModule;
- MetricsModule.

## 20.2. Когда нужен Redis

Только после измерения. Потенциальные причины:

- distributed rate limiting при нескольких API replicas;
- short-lived cache;
- queue;
- session-independent locks;
- idempotency acceleration.

До этого можно использовать PostgreSQL и in-process controls с учётом одной replica.

## 20.3. Когда нужна очередь

- bulk knowledge import;
- image processing;
- email;
- long AI jobs;
- recalculation batches;
- export generation.

Не вводить очередь ради обычного CRUD.

---

# 21. Целевая структура API

## 21.1. Public

```text
GET  /v1/health
GET  /v1/meta/version
POST /v1/flavor/analyze
GET  /v1/catalog/ingredients
GET  /v1/catalog/preparations
GET  /v1/dishes/public
GET  /v1/dishes/public/:id
GET  /v1/dishes/share/:token
GET  /v1/profiles/:username
GET  /v1/profiles/:username/dishes
```

## 21.2. Authenticated user

```text
GET    /v1/me
PATCH  /v1/me
DELETE /v1/me
POST   /v1/me/export

GET    /v1/dishes/me
GET    /v1/dishes/me/:id
POST   /v1/dishes
PATCH  /v1/dishes/:id
DELETE /v1/dishes/:id
POST   /v1/dishes/:id/remix
POST   /v1/dishes/:id/share-token/rotate
POST   /v1/dishes/:id/share-token/revoke

GET    /v1/dishes/:id/versions
GET    /v1/dishes/:id/versions/:version
POST   /v1/dishes/:id/versions/:version/restore

POST   /v1/dishes/:id/favorite
DELETE /v1/dishes/:id/favorite
GET    /v1/favorites

POST   /v1/ai/explain
GET    /v1/usage

POST   /v1/uploads/sign
DELETE /v1/uploads/:id

POST   /v1/reports
```

## 21.3. Billing

```text
POST /v1/billing/checkout
POST /v1/billing/portal
GET  /v1/billing/subscription
POST /v1/billing/webhook
```

Webhook endpoint не использует обычную user auth; он использует signature verification.

## 21.4. Admin

```text
GET/POST/PATCH /v1/admin/ingredients
GET/POST/PATCH /v1/admin/preparations
GET/POST/PATCH /v1/admin/pairing-evidence
GET/POST       /v1/admin/knowledge-releases
POST           /v1/admin/knowledge-releases/:id/publish
GET/PATCH      /v1/admin/moderation/cases
GET            /v1/admin/audit
```

## 21.5. API conventions

- Zod validation;
- stable error codes;
- request ID;
- cursor pagination;
- ISO timestamps;
- idempotency key для sensitive POST;
- explicit API version;
- OpenAPI generated from actual contracts;
- no hidden business logic in frontend.

---

# 22. Изменения модели данных

## 22.1. Существующие таблицы сохранить

- profiles;
- ingredients;
- preparation_methods;
- ingredient_pairings;
- dishes;
- dish_items;
- dish_versions;
- favorites;
- subscriptions.

## 22.2. Добавить к dishes

- `analysis_snapshot` или relation к analyses;
- `engine_version`;
- `knowledge_version`;
- `showcase_mode`;
- `quantities_visible`;
- `moderation_status`;
- `deleted_at` для контролируемого soft-delete, если нужен;
- `revision` для optimistic concurrency.

## 22.3. Отдельная таблица analyses

Рекомендуется:

```text
dish_analyses
- id
- dish_id
- dish_version_id
- engine_version
- knowledge_version
- input_hash
- result_json
- confidence
- created_at
```

Это упрощает reproducibility и debug.

## 22.4. Billing

- billing_customers;
- billing_events;
- usage_counters;
- entitlement_overrides;
- plan history.

## 22.5. Moderation

- reports;
- moderation_cases;
- moderation_actions;
- user_suspensions;
- audit_events.

## 22.6. Uploads

- uploads;
- owner_id;
- storage_path;
- mime;
- size;
- width/height;
- status;
- checksum;
- created_at.

## 22.7. Product analytics

Не обязательно хранить все события в основной БД. Но critical audit events должны быть durable:

- visibility change;
- subscription change;
- share token rotate;
- account deletion;
- moderator action;
- admin knowledge publish.

---

# 23. План валидации Flavor Engine

## 23.1. Benchmark categories

Набор должен содержать:

- классические хорошие сочетания;
- очевидные конфликты;
- жирное без кислоты;
- слишком сладкое;
- слишком солёное;
- плоская текстура;
- доминирующая специя;
- небольшое количество мощного ингредиента;
- влияние обработки;
- замена ингредиента;
- сложные блюда из 8–12 компонентов;
- нейтральные блюда, где score не должен быть слишком уверенным.

## 23.2. Regression assertions

Примеры:

- увеличение кислоты до разумной точки улучшает жирное блюдо;
- чрезмерная кислота после оптимума ухудшает balance;
- 20 г розмарина штрафуются сильнее 2 г;
- сырой и карамелизированный лук дают разные profile;
- compatible candidate может иметь low utility;
- unknown evidence снижает confidence;
- изменение текста AI не меняет score;
- сортировка рекомендаций стабильна при одинаковом engine version.

## 23.3. Human evaluation protocol

Для уменьшения bias:

- reviewers не видят ожидаемый ответ заранее;
- варианты по возможности рандомизируются;
- сохраняются индивидуальные оценки;
- считается inter-reviewer disagreement;
- результат не сводится к одному «шеф сказал»;
- benchmark versioned.

## 23.4. Пользовательская обратная связь

После фактического приготовления:

- «рекомендация была полезна?»;
- «в каком направлении изменила блюдо?»;
- «граммовка была слишком мала/нормальна/слишком велика?»;
- «что бы вы изменили?».

Эти данные идут в review queue, но **не меняют коэффициенты автоматически**.

## 23.5. Методологическая страница

Публично объяснить:

- какие факторы учитываются;
- что означает compatibility;
- что означает utility;
- что означает confidence;
- почему score не является объективной истиной;
- как обновляются данные;
- как сообщить об ошибке.

---

# 24. Полная стратегия тестирования

## 24.1. Unit tests

### Contracts

- valid/invalid payloads;
- defaults;
- max limits;
- locale;
- visibility;
- AI response schema.

### Flavor Engine

- sensory normalization;
- preparation modifiers;
- pair score;
- quantity penalty;
- texture score;
- issues;
- recommendations;
- confidence;
- deterministic output;
- regression benchmark.

### API services

- entitlement;
- visibility;
- private limit;
- version numbering;
- parent immutability;
- share token;
- billing state mapping;
- moderation permissions.

## 24.2. Integration tests

Использовать отдельную test PostgreSQL:

- migrations up;
- create profile;
- CRUD dish;
- RLS/ownership;
- private/public/unlisted;
- versions;
- remixes;
- favorites;
- webhook idempotency;
- account deletion;
- transaction rollback.

## 24.3. API contract tests

- OpenAPI matches actual response;
- frontend client parses response;
- stable error codes;
- backward-compatible changes внутри v1;
- generated client опционально после стабилизации.

## 24.4. E2E Playwright

Минимальный обязательный набор:

1. Visitor opens EN landing.
2. Visitor switches UK.
3. Visitor builds dish without account.
4. Visitor signs up.
5. Local dish imports as private.
6. User edits and saves.
7. User opens library on reload.
8. User publishes dish.
9. Another user opens public dish.
10. Another user remixes.
11. Free user hits private limit.
12. User starts Pro checkout in sandbox.
13. Webhook grants Pro.
14. User creates additional private dish.
15. User cancels.
16. User exports data.
17. User deletes account.
18. Unlisted link revoke works.
19. Private dish direct URL is forbidden.
20. Report flow reaches moderation queue.

## 24.5. Visual and localization tests

- desktop/mobile snapshots на ключевых страницах;
- длинные украинские строки;
- отсутствие overflow;
- missing translation detection;
- fallback locale;
- date/number format.

## 24.6. Accessibility

- automated axe checks;
- keyboard flow;
- screen reader smoke;
- contrast;
- focus order;
- form errors associated with fields;
- reduced motion.

## 24.7. Performance tests

- Lighthouse/field metrics;
- bundle budget;
- API p95;
- DB query plans;
- load tests;
- image load;
- cold start.

## 24.8. Release test policy

Нельзя выпускать, если:

- unit/integration/E2E core flows красные;
- миграция не протестирована;
- backup не существует;
- auth/privacy tests падают;
- billing webhook tests падают;
- benchmark имеет critical regression.

---

# 25. Безопасность и модель угроз

## 25.1. Главные активы

- private recipes;
- email/account data;
- subscription status;
- payment identifiers;
- Flavor Engine IP;
- knowledge base;
- API keys;
- admin access;
- public reputation.

## 25.2. Основные угрозы

| Угроза | Последствие | Основная защита |
|---|---|---|
| IDOR на private dish | утечка рецепта | ownership checks + tests + RLS |
| Подмена тарифа клиентом | бесплатный Pro | server entitlements + webhook truth |
| Утечка OpenAI/DB key | расходы/данные | server-only secrets + rotation |
| Spam public recipes | деградация сообщества | rate limits + reports + moderation |
| Prompt injection | плохие объяснения | structured input/output, no tool access |
| Массовый analyze abuse | расходы/DoS | rate limit + cache + budget |
| Webhook replay | неверный entitlement | signature + idempotency |
| Upload abuse | malware/storage cost | MIME/size/re-encode/scanning |
| Dependency compromise | supply-chain | lockfile, audit, updates, review |
| Admin takeover | полный доступ | MFA, separate roles, audit log |
| SQL migration error | потеря данных | backup, dry run, rollback |

## 25.3. Security review перед GA

Минимум:

- manual threat review;
- dependency scan;
- secret scan;
- auth/IDOR penetration checklist;
- public endpoints abuse test;
- upload test;
- webhook test;
- admin role test;
- data deletion test;
- log privacy review.

При наличии бюджета — внешний targeted security review, особенно auth, billing и privacy.

---

# 26. Аналитика и продуктовые метрики

## 26.1. North Star

Предлагаемая North Star Metric:

> **Weekly Active Creators, которые создали или существенно изменили блюдо, получили анализ и сохранили результат.**

Она лучше, чем page views или количество score calculations.

## 26.2. Activation funnel

```text
Landing view
→ Builder opened
→ First ingredient added
→ 3+ ingredients added
→ Recommendation viewed
→ Recommendation applied
→ Dish named
→ Dish saved
→ Account created
→ Return within 7 days
```

## 26.3. Revenue funnel

```text
Activated user
→ Private limit reached / Pro feature viewed
→ Pricing page
→ Checkout started
→ Checkout completed
→ First Pro action
→ Renewal
```

## 26.4. Обязательные события

- landing_view;
- builder_opened;
- ingredient_added;
- ingredient_removed;
- quantity_changed;
- preparation_changed;
- goal_changed;
- analysis_completed;
- recommendation_viewed;
- recommendation_applied;
- dish_saved;
- visibility_selected;
- signup_started/completed;
- local_import_completed;
- public_dish_viewed;
- remix_created;
- private_limit_reached;
- pricing_viewed;
- checkout_started/completed;
- ai_explanation_requested/completed/failed;
- feedback_submitted;
- account_deleted.

## 26.5. Guardrail metrics

- API error rate;
- analysis latency;
- AI cost per user;
- disputed score rate;
- private access denial anomalies;
- report rate;
- refund rate;
- support ticket rate;
- database/storage growth.

## 26.6. Analytics privacy

- не отправлять полный private recipe в analytics;
- ingredient IDs можно агрегировать, но policy должна быть ясной;
- user ID псевдонимизировать;
- sensitive free text не логировать;
- consent и cookies зависят от выбранного инструмента и юрисдикции.

---

# 27. Монетизация версии 1.0

## 27.1. Основной paywall

Платить пользователь должен не за само число, а за рабочее пространство и более глубокие действия.

### Free value moment

Пользователь обязан бесплатно испытать:

- добавить ingredients;
- увидеть live score;
- понять основной дисбаланс;
- получить хотя бы несколько рекомендаций;
- сохранить public dish;
- увидеть social layer.

### Pro value

- unlimited private work;
- version history;
- advanced add/remove/replace;
- quantity optimization;
- deeper explanation;
- AI allowance;
- showcase/private control;
- collections позже.

## 27.2. Pricing research

Перед фиксацией цены:

- 10–15 интервью;
- fake-door pricing page до billing;
- willingness-to-pay question;
- monthly vs annual;
- профессионал vs enthusiast;
- причины отказа;
- стоимость альтернативы по времени.

## 27.3. Не делать

- не продавать «100 AI credits» как основную ценность;
- не делать sponsored ingredient rankings;
- не скрывать базовую полезность полностью;
- не публиковать private dish ради paywall;
- не запускать четыре тарифа без функций;
- не обещать экономию/качество без доказательств.

---

# 28. Go-to-market и подготовка спроса

## 28.1. До beta

- домен;
- branded email;
- waitlist;
- короткий landing с видео;
- форма «кто вы и что создаёте»;
- 20–30 design partners;
- регулярные demo updates;
- публичный build log опционально.

## 28.2. Каналы первых пользователей

- кулинарные школы;
- локальные сообщества поваров;
- chef creators;
- Reddit/Discord/форумы, где это уместно;
- Instagram/TikTok demo content;
- YouTube short workflow;
- личный outreach;
- публичные remix pages как shareable asset.

## 28.3. Content strategy

Контент должен показывать продукт, а не быть очередным блогом рецептов:

- «Почему compatible не всегда useful»;
- «Как 5 г кислоты меняют жирное блюдо»;
- «Сырой и карамелизированный лук — разные профили»;
- разбор одной композиции до/после;
- benchmark challenges с поварами;
- истории ремиксов.

## 28.4. SEO

К GA:

- canonical URLs;
- hreflang EN/UK;
- sitemap только public pages;
- robots exclusion private/unlisted;
- OpenGraph image;
- structured data аккуратно;
- noindex на thin/empty pages;
- уникальные public dish pages;
- производительность.

Не генерировать тысячи тонких AI-страниц только ради поискового трафика.

## 28.5. Email lifecycle

Минимум:

- welcome;
- email verification;
- first dish reminder;
- local dishes import;
- private limit reached;
- checkout/billing confirmations;
- subscription cancellation;
- feedback request после нескольких analyses;
- product update.

Email preferences и unsubscribe обязательны для маркетинговых сообщений.

---

# 29. Операционная модель для одного разработчика

## 29.1. Недельный ритм

### Понедельник

- метрики;
- production errors;
- выбрать 1 главный outcome недели;
- разбить на issues;
- заморозить лишний scope.

### Вторник–четверг

- реализация;
- tests вместе с кодом;
- small PRs;
- staging deploy;
- ручная проверка.

### Пятница

- user interviews;
- culinary review;
- changelog;
- debt review;
- backup/monitoring check;
- следующая гипотеза.

## 29.2. Как использовать GPT

GPT может:

- генерировать boilerplate;
- писать тесты;
- делать refactoring;
- проверять contracts;
- готовить migrations с review;
- анализировать логи;
- поддерживать документацию;
- создавать checklists.

GPT не должен самостоятельно решать:

- product scope;
- entitlement policy;
- legal wording без специалиста;
- окончательные culinary coefficients;
- migration в production без проверки;
- security exception;
- удаление данных;
- release decision.

## 29.3. Правила PR

Каждый PR содержит:

- проблему;
- решение;
- screenshots/API examples;
- tests;
- migration impact;
- security/privacy impact;
- analytics events;
- localization impact;
- rollback note.

## 29.4. Branch strategy

Для одного разработчика достаточно:

- protected `main`;
- короткие feature branches;
- squash merge;
- release tags;
- feature flags для незавершённого функционала.

Не нужен GitFlow с несколькими долгоживущими branches.

---

# 30. Реестр основных рисков

| Риск | Вероятность | Влияние | Митигирование |
|---|---:|---:|---|
| Результаты кажутся недостоверными | Высокая | Критическое | chef benchmark, confidence, methodology, limited claims |
| Слишком мало ингредиентов | Высокая | Высокое | coverage analytics, phased 150→300, aliases |
| Один разработчик перегружен | Высокая | Высокое | жёсткий v1 scope, no Studio/Kitchen, weekly outcome |
| AI расходы растут | Средняя | Высокое | deterministic default, quota, cache, hard cap |
| Private recipe leak | Низкая/средняя | Критическое | ownership tests, RLS, audit, threat review |
| Billing state рассинхронизирован | Средняя | Высокое | webhook truth, idempotency, reconciliation job |
| Public spam | Высокая после роста | Среднее | rate limit, report, moderation queue |
| Правовые проблемы с данными | Средняя | Критическое | provenance, license field, no scraping competitor IP |
| Пользователи не платят | Высокая | Критическое | paid beta рано, price interviews, retention before scale |
| Infrastructure vendor lock-in | Низкая | Среднее | containerized Nest, PostgreSQL, portable packages |
| Изменение engine ломает старые блюда | Средняя | Высокое | versioning, snapshots, regression, no silent recalculation |
| Утеря данных | Низкая | Критическое | backups, restore drill, migrations |
| Накрутка social ranking | Средняя | Среднее | не запускать сложный score рано, rate/abuse detection |
| Неподдерживаемый bilingual content | Средняя | Среднее | translation key checks, EN/UK parity gate |

---

# 31. Контроль расходов

## 31.1. Основные статьи

- Vercel web;
- container host API;
- Supabase database/auth/storage;
- AI API;
- error monitoring;
- analytics;
- email;
- domain;
- payment fees;
- legal/accounting;
- culinary reviewers.

## 31.2. Cost guardrails

- monthly infrastructure budget alert;
- AI hard cap;
- per-user AI quota;
- image size limit;
- storage lifecycle;
- log retention;
- no expensive full-table searches;
- query indexes;
- no background job without usage accounting;
- no paid tool, если его функцию закрывает текущий stack без значительного риска.

## 31.3. Unit economics dashboard

Отслеживать:

- revenue per paid user;
- payment fees;
- AI cost per paid user;
- infrastructure cost per active user;
- support time;
- refund/chargeback;
- gross margin estimate.

Не масштабировать paid acquisition, пока вклад одного платного пользователя не понятен.

---

# 32. Приоритетный master backlog

## P0 — блокирует любой релиз

- [ ] Исправить dependency tree.
- [ ] Создать lockfile.
- [ ] Зелёный CI/build.
- [ ] Staging web/API/DB.
- [ ] Versioned migrations.
- [ ] Auth UI and session.
- [ ] Server-backed builder.
- [ ] Ownership/privacy tests.
- [ ] Production-ready knowledge provenance.
- [ ] Engine/knowledge versioning.
- [ ] Billing webhook/entitlement.
- [ ] Account export/delete.
- [ ] Reporting/moderation.
- [ ] Legal pages.
- [ ] Error monitoring.
- [ ] Backup/restore.
- [ ] E2E core flows.
- [ ] Paid beta.

## P1 — должно быть к GA, но может не блокировать alpha

- [ ] Version comparison.
- [ ] Restore version.
- [ ] Favorites.
- [ ] Public profile.
- [ ] Search filters.
- [ ] Share token rotate/revoke.
- [ ] Image upload pipeline.
- [ ] Advanced add/remove/replace.
- [ ] AI quota and caching.
- [ ] Admin ingredient editor.
- [ ] Knowledge release UI.
- [ ] Accessibility pass.
- [ ] Performance budget.
- [ ] Feature flags.
- [ ] Support workflow.

## P2 — после GA или только если остаётся время

- [ ] Collections.
- [ ] Following.
- [ ] Chef Score.
- [ ] Comments.
- [ ] Notifications.
- [ ] Showcase advanced controls.
- [ ] Public remix tree visualization.
- [ ] Pantry.
- [ ] Custom ingredients.
- [ ] Annual plan experiments.
- [ ] Referral program.

## P3 — не делать до product-market evidence

- [ ] Chef Studio costing.
- [ ] Nutrition/allergens.
- [ ] Kitchen teams.
- [ ] Mobile apps.
- [ ] Public API.
- [ ] Marketplace.
- [ ] Python ML service.
- [ ] Microservices.
- [ ] POS integrations.

---

# 33. Чек-лист готовности к коммерческому релизу

## Product

- [ ] Пользователь получает value без регистрации.
- [ ] Signup не ломает текущую работу.
- [ ] Server save стабилен.
- [ ] Private/public/unlisted понятны.
- [ ] Advanced recommendations полезны.
- [ ] Version history работает.
- [ ] Public dish/remix/favorite работают.
- [ ] EN/UK complete.
- [ ] Нет критических UX dead ends.

## Flavor Engine

- [ ] 300 approved ingredients или согласованный coverage gate.
- [ ] 200+ benchmark scenarios.
- [ ] Engine versioning.
- [ ] Knowledge versioning.
- [ ] Confidence model.
- [ ] Methodology page.
- [ ] Provenance/license audit.
- [ ] Correction workflow.
- [ ] No competitor proprietary data.

## Auth and privacy

- [ ] Signup/signin/reset.
- [ ] Session refresh.
- [ ] Ownership tests.
- [ ] Account export.
- [ ] Account deletion.
- [ ] Share revoke.
- [ ] Private data excluded from feed/search/analytics payload.
- [ ] Admin MFA.

## Billing

- [ ] Production provider configured.
- [ ] Webhook signature.
- [ ] Idempotency.
- [ ] Checkout.
- [ ] Portal.
- [ ] Renewal.
- [ ] Cancellation.
- [ ] Failed payment/grace.
- [ ] Refund process.
- [ ] Entitlement reconciliation.
- [ ] Invoice/tax policy confirmed.

## Security

- [ ] Threat model.
- [ ] Rate limits.
- [ ] Security headers.
- [ ] CORS.
- [ ] Secret scan.
- [ ] Dependency scan.
- [ ] Upload validation.
- [ ] Log privacy review.
- [ ] IDOR tests.
- [ ] Webhook replay test.
- [ ] Admin role review.

## Reliability

- [ ] CI green.
- [ ] Staging mirrors production.
- [ ] Migrations tested.
- [ ] Backup active.
- [ ] Restore drill passed.
- [ ] Monitoring active.
- [ ] Alerts active.
- [ ] Rollback documented.
- [ ] Feature kill switches.
- [ ] Incident runbook.

## Legal and support

- [ ] Terms.
- [ ] Privacy.
- [ ] Cookies.
- [ ] Community rules.
- [ ] Subscription/refund terms.
- [ ] AI/accuracy disclaimer.
- [ ] Copyright/takedown.
- [ ] Support email.
- [ ] Abuse contact.
- [ ] Business/payment setup.

## Validation

- [ ] Closed alpha complete.
- [ ] Paid beta complete.
- [ ] Первые recurring subscribers.
- [ ] Есть renewal signal.
- [ ] Нет P0/P1.
- [ ] Retention не нулевой.
- [ ] Support load manageable.
- [ ] AI/infrastructure cost manageable.

## Launch

- [ ] Domain and SSL.
- [ ] SEO metadata.
- [ ] Sitemap/robots.
- [ ] Demo video.
- [ ] Pricing page.
- [ ] FAQ.
- [ ] Status/support path.
- [ ] Launch email.
- [ ] Production smoke test.
- [ ] Backup before launch.
- [ ] Owner available первые 72 часа.

---

# 34. Первые 90 дней после релиза

## Дни 1–30 — стабилизация

Главная цель: не добавлять большую новую категорию функций.

- исправлять production bugs;
- смотреть activation;
- отвечать каждому paying user;
- собирать disputed recommendations;
- улучшать onboarding;
- расширять самые часто отсутствующие ingredients;
- контролировать AI cost;
- проверить renewals;
- выполнить ещё один restore drill;
- публиковать release notes.

## Дни 31–60 — retention

- сегментировать users;
- улучшить return loops;
- добавить lightweight collections, если это подтверждено;
- улучшить version comparison;
- тестировать onboarding messages;
- улучшить public remix discovery;
- пересмотреть цену только при достаточных данных;
- не начинать массовую рекламу при слабом retention.

## Дни 61–90 — выбор следующего продукта

На основе данных выбрать один путь:

### Путь A: усиление Pro

Если individual creators активны:

- pantry;
- collections;
- showcase;
- advanced optimization;
- expanded knowledge.

### Путь B: Chef Studio discovery

Если профессионалы просят операции:

- costing prototype;
- yields;
- technical card;
- export;
- интервью с 10 ресторанами.

### Путь C: social growth

Если public/remix loop силён:

- follows;
- notifications;
- collections;
- curation;
- creator profiles.

Нельзя одновременно запускать все три пути.

---

# 35. Что не делать до доказательства спроса

1. Не переписывать backend на другой язык без измеренной причины.
2. Не вводить Kubernetes.
3. Не делить Nest на микросервисы.
4. Не строить собственную auth-систему.
5. Не делать мобильное приложение.
6. Не покупать большой proprietary dataset без понятного ROI и юридической проверки.
7. Не обещать «научно идеальное блюдо».
8. Не обучать рекомендации автоматически на лайках.
9. Не добавлять comments/follows/notifications раньше report/moderation.
10. Не запускать marketplace.
11. Не запускать Kitchen plan без командного workflow.
12. Не добавлять nutrition/allergen claims без проверенного источника и методики.
13. Не тратить месяцы на идеальный логотип до alpha.
14. Не начинать платную рекламу до retention.
15. Не скрывать плохие confidence cases красивым AI-текстом.

---

# 36. Итоговая точка принятия решения

Проект должен идти к коммерческому релизу не по принципу «мы реализовали все пункты», а через последовательные доказательства:

## Доказательство 1 — технология

> Репозиторий устанавливается, тестируется, собирается и деплоится воспроизводимо.

## Доказательство 2 — доверие к расчёту

> Реальные повара считают рекомендации достаточно полезными, чтобы применять их к настоящим блюдам.

## Доказательство 3 — повторное использование

> Пользователь возвращается не ради демонстрации, а ради следующего блюда.

## Доказательство 4 — приватная ценность

> Пользователь хочет хранить черновики, версии и профессиональные идеи.

## Доказательство 5 — платёж

> Пользователь платит за Pro и продолжает пользоваться после оплаты.

## Доказательство 6 — управляемость

> Поддержка, расходы, безопасность и качество остаются посильными одному основателю.

Только после этого FlavorPilot следует считать готовым к полноценному публичному коммерческому запуску.

---

# Рекомендуемый следующий конкретный шаг

Первый sprint не должен добавлять новую продуктовую функцию. Его результат:

1. исправленный dependency tree;
2. `package-lock.json`;
3. зелёный `npm ci`;
4. зелёные typecheck/tests/build;
5. staging web + API;
6. versioned migrations;
7. первый реальный end-to-end smoke test.

После этого следующий sprint — полноценный Auth + server-backed save. Параллельно с первой недели нужно начать набор 3–5 кулинарных reviewers и формирование benchmark dataset, потому что именно этот поток будет самым длинным и самым ценным.
