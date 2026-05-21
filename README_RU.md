# @inso_web/els-react

[![npm version](https://img.shields.io/npm/v/@inso_web/els-react.svg)](https://www.npmjs.com/package/@inso_web/els-react)
[![npm downloads](https://img.shields.io/npm/dm/@inso_web/els-react.svg)](https://www.npmjs.com/package/@inso_web/els-react)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/npm/l/@inso_web/els-react.svg)](./LICENSE)

React-биндинги для **Inso Error Logs Service (ELS)** — управляемого SaaS централизованного сбора событий (от debug до fatal) с AI-диагностикой ошибок. Предоставляет `<ELSProvider>` для DI, hook `useELS()`, готовый `<ELSErrorBoundary>` с авто-захватом render-ошибок и hook `useGlobalErrorHandlers()` для `window`-слушателей. React 17+.

> 🇬🇧 [English version → README.md](README.md)

---

## Содержание

- [Что вы получаете](#что-вы-получаете)
- [Установка](#установка)
- [Быстрый старт](#быстрый-старт)
- [Когда что использовать](#когда-что-использовать)
- [Ключевые концепции](#ключевые-концепции)
- [Конфигурация](#конфигурация)
- [Миграция](#миграция)
  - [С @sentry/react](#с-sentryreact)
  - [С LogRocket React SDK](#с-logrocket-react-sdk)
- [Версионирование](#версионирование)
- [Quick reference](#quick-reference)
- [Почему ELS](#почему-els)
- [API](#api)
- [FAQ](#faq)
- [Другие ELS SDK](#другие-els-sdk)
- [Тарифы](#тарифы)
- [Лицензия](#лицензия)

---

## Что вы получаете

ELS из коробки даёт встроенную админ-панель. Каждое событие, отправленное этим SDK, попадает туда — с полнотекстовым поиском, фасетной фильтрацией, AI-диагностикой и обнаружением регрессий по версиям. Для React render-ошибок дополнительно сохраняется `componentStack` рядом с обычным stack trace.

| | |
|---|---|
| ![Список логов](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/01-error-logs-list.png) | ![Карточка события](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/02-event-detail-info.png) |
| Виртуальная таблица с фасетным сайдбаром (приложение, окружение, **версия**, источник, уровень, браузер, IP, категория). Live-режим обновляет данные каждые 5с. | Полные метаданные события: время, гео, окружение, **версия приложения**, fingerprint, session, карточки повторений, корреляция в рамках сессии. |
| ![AI-диагностика](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/03-error-detail-ai.png) | ![Аналитика](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/04-analytics-dashboard.png) |
| Распарсенный stack trace + AI-анализ: что сломалось, где, как чинить. | Timeline, donut'ы, топ URL/IP, тепловая карта по часам, **виджет регрессий по версиям**. |

---

## Установка

```bash
npm install @inso_web/els-client @inso_web/els-react
```

**Требования:** React 17+, Node.js 18+ на этапе сборки. Работает с Vite, CRA, Webpack, Parcel.

---

## Быстрый старт

### 1. Оберните корень в `<ELSProvider>`

`main.tsx` (Vite) или `index.tsx` (CRA):

```tsx
import { ELSClient } from '@inso_web/els-client';
import { ELSProvider } from '@inso_web/els-react';
import { App } from './App';

const client = new ELSClient({
  apiKey: import.meta.env.VITE_ELS_API_KEY,
  appSlug: 'my-react-app',
  serviceName: 'web',
  deploymentEnv: import.meta.env.PROD ? 'PRODUCTION' : 'DEV',
  appVersion: import.meta.env.VITE_BUILD_VERSION,
  minLevel: 'info',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ELSProvider client={client}>
    <App />
  </ELSProvider>,
);
```

Ещё нет API-ключа? **[Зарегистрируйтесь на lk.insoweb.ru](https://lk.insoweb.ru)** — займёт минуту.

### 2. Логируйте через `useELS()`

```tsx
import { useELS } from '@inso_web/els-react';

export function CheckoutButton() {
  const log = useELS();
  const onClick = async () => {
    log.info('Checkout started');
    try {
      await fetch('/api/checkout', { method: 'POST' });
    } catch (err) {
      log.error(err as Error, 'Checkout failed');
    }
  };
  return <button onClick={onClick}>Pay</button>;
}
```

### 3. Оберните корень в `<ELSErrorBoundary>`

```tsx
import { ELSErrorBoundary } from '@inso_web/els-react';

<ELSErrorBoundary fallback={<div>Что-то пошло не так</div>}>
  <App />
</ELSErrorBoundary>
```

Render-ошибки захватываются автоматически со stack trace и `componentStack`.

### 4. Глобальные обработчики (опционально)

```tsx
import { useGlobalErrorHandlers } from '@inso_web/els-react';

export function ErrorReporter() {
  useGlobalErrorHandlers(); // window.error + unhandledrejection
  return null;
}
```

Подключите `<ErrorReporter />` один раз внутри провайдера.

---

## Когда что использовать

| Сценарий | Что брать |
|---|---|
| Ловить render-ошибки | Обернуть поддерево в `<ELSErrorBoundary>` |
| Async-ошибки в event handlers | `useELS()` + `try/catch` |
| Фоновые `window.error` / `unhandledrejection` | `<ErrorReporter />` с `useGlobalErrorHandlers()` |
| Несколько суб-приложений с разными конфигами | Несколько `<ELSProvider>` (внутренний приоритет) |
| Использование вне React (utility-модуль) | Импортировать `ELSClient` напрямую |
| SSR (Next.js) | Использовать [`@inso_web/els-next`](https://github.com/official-inso/els-next) |

---

## Ключевые концепции

### `<ELSErrorBoundary>`

Стандартный React error boundary, вызывающий `client.error(err, ..., { meta: { componentStack } })` в `componentDidCatch`. Исключения render-фазы захватываются; ошибки в event-handler'ах — нет (React сам их не передаёт в boundary — оборачивайте `try/catch`).

### `useELS()`

Возвращает тот же `Logger`-интерфейс, что и базовый клиент: `info`, `warn`, `error`, `debug`, `trace`, `fatal`, `child`, `flush`. Ссылка стабильна между ререндерами.

### Bindings и child-логгеры

```tsx
const log = useELS();
const userLog = log.child({ userId: 42, role: 'admin' });
userLog.info('viewed profile');
```

`child` дешёвый — создавайте один на пользователя, на workflow, на роут при необходимости.

---

## Конфигурация

`ELSConfig` совпадает с базовым клиентом — см. [@inso_web/els-client](https://github.com/official-inso/els-client). Ключевые поля:

| Опция | Описание |
|---|---|
| `apiKey` | API-ключ (обязательно) |
| `appSlug` | Slug приложения (обязательно) |
| `serviceName` | Имя сервиса / модуля |
| `deploymentEnv` | `DEV` / `STAGING` / `PRODUCTION` |
| `appVersion` | Версия (≤128 символов) |
| `minLevel` | Минимальный уровень для отправки |

---

## Миграция

### С @sentry/react

**Было:**

```tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://public@sentry.example.com/1',
  environment: process.env.NODE_ENV,
  release: import.meta.env.VITE_BUILD_VERSION,
});

const SentryRoute = Sentry.withSentryReactRouterV6Routing(Route);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary fallback={<p>Crashed</p>}>
    <App />
  </Sentry.ErrorBoundary>,
);

function MyButton() {
  return (
    <button onClick={() => {
      Sentry.captureMessage('clicked');
      doStuff().catch(Sentry.captureException);
    }}>Click</button>
  );
}
```

**Стало:**

```tsx
import { ELSClient } from '@inso_web/els-client';
import { ELSProvider, ELSErrorBoundary, useELS } from '@inso_web/els-react';

const client = new ELSClient({
  apiKey: import.meta.env.VITE_ELS_API_KEY,
  appSlug: 'my-react-app',
  deploymentEnv: import.meta.env.PROD ? 'PRODUCTION' : 'DEV',
  appVersion: import.meta.env.VITE_BUILD_VERSION,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ELSProvider client={client}>
    <ELSErrorBoundary fallback={<p>Crashed</p>}>
      <App />
    </ELSErrorBoundary>
  </ELSProvider>,
);

function MyButton() {
  const log = useELS();
  return (
    <button onClick={() => {
      log.info('clicked');
      doStuff().catch((err) => log.error(err, 'click failed'));
    }}>Click</button>
  );
}
```

| Sentry | ELS | Заметки |
|---|---|---|
| `Sentry.init({ dsn })` | `new ELSClient({ apiKey, appSlug })` | Три явных поля |
| `<Sentry.ErrorBoundary>` | `<ELSErrorBoundary>` | Та же роль, тот же API |
| `Sentry.captureException(err)` | `log.error(err)` | Через `useELS()` |
| `Sentry.captureMessage(msg, level)` | `log.<level>(msg)` | |
| `Sentry.setUser({ id })` | `log.child({ user: { id } })` | Или через `loggerDefaults` |
| `release` | `appVersion` | Любая строка ≤128 |
| `environment` | `deploymentEnv` | Фиксированный enum |
| `withSentryReactRouterV6Routing` | не предоставляется | Routing-телеметрию оставляйте в Sentry, если нужна |
| Source maps upload | не предоставляется | Парьте с другим инструментом |
| Session replay | не предоставляется | LogRocket / Sentry Replay |

**Подводные камни:**

- Ошибки event-handler'ов React не передаёт в boundary — оборачивайте async-логику `try/catch` и явно вызывайте `log.error(...)`.
- Breadcrumbs аналога не имеют — используйте `log.child({ ... })`.

---

### С LogRocket React SDK

**Было:**

```tsx
import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';

LogRocket.init('app/123');
setupLogRocketReact(LogRocket);

LogRocket.identify('user-42', { email: 'a@b.com' });
LogRocket.captureException(new Error('boom'));
```

**Стало:**

```tsx
import { ELSClient } from '@inso_web/els-client';
import { ELSProvider, ELSErrorBoundary, useELS } from '@inso_web/els-react';

const client = new ELSClient({
  apiKey: import.meta.env.VITE_ELS_API_KEY,
  appSlug: 'my-react-app',
});

const log = useELS();
log.child({ user: { id: 'user-42', email: 'a@b.com' } }).info('identified');
log.error(new Error('boom'));
```

| LogRocket | ELS | Заметки |
|---|---|---|
| `LogRocket.init('app/123')` | `new ELSClient({ apiKey, appSlug })` | Три явных поля |
| `LogRocket.identify(id, meta)` | `log.child({ user: { id, ...meta } })` | Bindings путешествуют с логгером |
| `LogRocket.captureException(err)` | `log.error(err)` | |
| `LogRocket.log/info/warn/error` | `log.<level>(...)` | |
| Session replay | не предоставляется | Оставайтесь на LogRocket, если критично |
| Перехват network-запросов | не предоставляется | Делайте явные `log.info({ url, status })` в обёртке fetch |
| Redux-интеграция | не предоставляется | Логируйте `log.info(action.type, ...)` в middleware |

**Подводные камни:**

- LogRocket записывает полные DOM-сессии; ELS хранит только дискретные события. Если replay — главный аргумент, оставьте LogRocket.
- Перехват request/response непрозрачный — повторите явными вызовами в вашей обёртке fetch.

---

## Версионирование

Передавайте через build-time env. Для Vite — `VITE_BUILD_VERSION` (Vite инлайнит на `npm run build`):

```Dockerfile
ARG VITE_BUILD_VERSION=dev
ENV VITE_BUILD_VERSION=$VITE_BUILD_VERSION
RUN npm run build
```

```yaml
# .gitlab-ci.yml
- export BUILD_VERSION=$(date -u +%Y%m%d%H%M%S)
- docker build --build-arg VITE_BUILD_VERSION="$BUILD_VERSION" ...
```

```tsx
new ELSClient({ ..., appVersion: import.meta.env.VITE_BUILD_VERSION });
```

ELS принимает любой формат ≤128 символов: semver, CalVer, date-compact, git SHA, opaque. Сервер автоматически распознаёт тип и сортирует timeline.

---

## Quick reference

| Нужно | Делайте |
|---|---|
| Логгер в компонентах | `const log = useELS()` |
| Ловить render-краши | `<ELSErrorBoundary>` |
| Ловить ошибки event handlers | `try/catch` + `log.error(err)` |
| Глобальные браузерные ошибки | `<ErrorReporter />` с `useGlobalErrorHandlers()` |
| Identify пользователя | `log.child({ user: { id, email } })` |
| Per-route контекст | `log.child({ route })` в layout-компоненте |
| Подавить шумные уровни | `minLevel: 'warn'` |

---

## Почему ELS

ELS для Node.js — сфокусированный SaaS для логирования, а не observability-комбайн. Оптимизирован под скорость захвата, AI-диагностику и дешевизну интеграции.

- **Меньше веса.** ~3 KB gzip в браузере, без транзитивных зависимостей.
- **Ноль внешних API.** Только `POST /errors[/batch]` и `GET /health`.
- **AI-диагностика** на каждом stack trace — для React-ошибок `componentStack` включён.
- **5 минут интеграции.** Provider + boundary + hook — готово.
- **Прозрачные тарифы.** Цены в личном кабинете.

### Подробное сравнение

| Категория | ELS | Sentry | Datadog / New Relic | Grafana Loki | LogRocket / Logtail / BetterStack |
|---|---|---|---|---|---|
| Модель хостинга | Managed SaaS | SaaS или self-hosted | Только SaaS | Self-hosted / Grafana Cloud | SaaS |
| Runtime-зависимости SDK | Ноль | Средне (саб-SDK, интеграции) | Тяжёлый агент + tracing | Promtail / агент | Средне |
| Время интеграции | ~5 мин | 10–20 мин | 30–60 мин | Часы — дни | 10–20 мин |
| AI-диагностика | Встроена | Платный аддон | Платный аддон | Нет | Нет |
| Группировка / fingerprint | Да | Да | Да | Вручную через LogQL | Частично |
| Source-map upload | Нет | Да | Да | н/п | Частично |
| Session replay (frontend) | Нет | Платно | Платно | н/п | Да (core) |
| Distributed tracing / APM | Нет | Частично | Да (core) | Да с Tempo | Нет |
| Метрики инфраструктуры | Нет | Нет | Да (core) | Да с Mimir | Нет |
| Хранение на free-тарифе | 24 часа | 30 дней (лимит объёма) | Только триал | Self-cost | 3–30 дней |
| Поддержка / документация на русском | Нативно | Сообщество | Ограничено | Сообщество | Нет |

### Когда ELS — неподходящий выбор

- Нужен один вендор на **APM + логи + метрики** одним счётом — берите Datadog или New Relic.
- Триаж фронтенда строится вокруг **DOM session replay** — LogRocket или Sentry Replay.
- Публичное мобильное приложение, нужны symbolication и ANR-детект — Firebase Crashlytics или Sentry Mobile.

Во всех остальных сценариях — backend-ошибки, JS-ошибки фронта, request-логи, структурированные события с version-aware-аналитикой — ELS даёт самый короткий путь до рабочей панели.

→ **Регистрация на [lk.insoweb.ru](https://lk.insoweb.ru)** для API-ключа.

---

## API

```tsx
const ELSProvider: React.FC<{ client: ELSClient; children: ReactNode }>;

function useELS(): Logger;

class ELSErrorBoundary extends React.Component<{
  fallback?: ReactNode | ((error: Error) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
  children: ReactNode;
}>;

function useGlobalErrorHandlers(opts?: { errors?: boolean; rejections?: boolean }): void;
```

Полный `ELSConfig` reference — см. [@inso_web/els-client](https://github.com/official-inso/els-client).

---

## FAQ

**React 18 / 19?** Да. Поддерживается React 17+.

**Безопасно ли держать API-ключ в клиентском бандле?** Да. ELS-ключи scoped — write-ключ не читает события. Та же модель что у Sentry public DSN. Если всё же хотите скрыть — поднимите внутренний `/api/log` proxy.

**Что если `apiKey` пустой?** `new ELSClient({ ..., apiKey: '' })` throw'нёт. Guard в entry-файле:

```ts
const client = apiKey
  ? new ELSClient({ ..., apiKey })
  : ({ info: () => {}, warn: () => {}, error: () => {}, /* ... */ } as any);
```

Или используйте [`@inso_web/els-next`](https://github.com/official-inso/els-next) — там silent no-op guard встроен.

**SSR с Next.js?** Берите [`@inso_web/els-next`](https://github.com/official-inso/els-next) — один конфиг на server + client + edge.

---

## Другие ELS SDK

Тот же wire-формат, та же панель — выбирайте по стеку.

**Node.js**
- [`@inso_web/els-client`](https://github.com/official-inso/els-client) — базовый TS / Node / browser клиент
- [`@inso_web/els-express`](https://github.com/official-inso/els-express) — Express middleware
- [`@inso_web/els-next`](https://github.com/official-inso/els-next) — хелперы для Next.js (App + Pages router)
- [`@inso_web/els-nest`](https://github.com/official-inso/els-nest) — NestJS module
- [`@inso_web/els-react`](https://github.com/official-inso/els-react) — React Provider, hooks, ErrorBoundary (этот репо)
- [`@inso_web/els-vue`](https://github.com/official-inso/els-vue) — Vue 3 plugin

**Другие стеки**
- [`Inso.Els`](https://github.com/official-inso/els-csharp) — .NET (Core + ASP.NET Core + ILogger)
- [`io.github.official-inso:els-core`](https://github.com/official-inso/els-java) — Java + Spring Boot starter + SLF4J
- [`github.com/official-inso/els-go`](https://github.com/official-inso/els-go) — Go

---

## Тарифы

Free-тариф — **хранение логов 24 часа**. Полный прайс на **[lk.insoweb.ru](https://lk.insoweb.ru)**.

---

## Лицензия

[MIT](./LICENSE) © INSOWEB
