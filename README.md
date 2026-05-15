# @inso_web/els-react

[![npm version](https://img.shields.io/npm/v/@inso_web/els-react.svg)](https://www.npmjs.com/package/@inso_web/els-react)
[![npm downloads](https://img.shields.io/npm/dm/@inso_web/els-react.svg)](https://www.npmjs.com/package/@inso_web/els-react)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/npm/l/@inso_web/els-react.svg)](./LICENSE)

React bindings for the **Inso Error Logs Service (ELS)** — a managed SaaS for centralised event logging (debug → fatal) with AI-assisted error triage. Ships `<ELSProvider>` for DI, `useELS()` hook, a ready-made `<ELSErrorBoundary>` that auto-reports render-phase errors, and a `useGlobalErrorHandlers()` hook for `window` listeners. React 17+.

> 🇷🇺 [Русская версия → README_RU.md](README_RU.md)

---

## Table of contents

- [What you get](#what-you-get)
- [Install](#install)
- [Quick Start](#quick-start)
- [When to use what](#when-to-use-what)
- [Core concepts](#core-concepts)
- [Configuration](#configuration)
- [Migration](#migration)
  - [From @sentry/react](#from-sentryreact)
  - [From LogRocket React SDK](#from-logrocket-react-sdk)
- [Versioning](#versioning)
- [Quick reference](#quick-reference)
- [Why ELS](#why-els)
- [API](#api)
- [FAQ](#faq)
- [Other ELS SDKs](#other-els-sdks)
- [Pricing](#pricing)
- [License](#license)

---

## What you get

ELS ships with a built-in admin dashboard. Every event captured by this SDK lands there with full-text search, faceted filtering, AI-assisted diagnosis, and version-aware regression detection. React render-phase errors carry `componentStack` alongside the regular stack trace.

| | |
|---|---|
| ![Logs list](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/01-error-logs-list.png) | ![Event detail](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/02-event-detail-info.png) |
| Virtual table with facet sidebar (app, env, **version**, source, level, browser, IP, category). Live mode auto-refreshes every 5s. | Full event metadata: timestamps, geo, env, **app version**, fingerprint, session, repetition cards, in-session correlation. |
| ![AI diagnosis](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/03-error-detail-ai.png) | ![Analytics](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/04-analytics-dashboard.png) |
| Parsed stack trace + AI-assisted diagnosis: what broke, where, how to fix. | Timeline, donuts, top URLs/IPs, hourly heatmap, **version-regression widget**. |

---

## Install

```bash
npm install @inso_web/els-client @inso_web/els-react
```

**Requirements:** React 17+, Node.js 18+ at build time. Works with Vite, CRA, Webpack, Parcel.

---

## Quick Start

### 1. Wrap your app in `<ELSProvider>`

`main.tsx` (Vite) or `index.tsx` (CRA):

```tsx
import { ELSClient } from '@inso_web/els-client';
import { ELSProvider } from '@inso_web/els-react';
import { App } from './App';

const client = new ELSClient({
  endpoint: import.meta.env.VITE_ELS_URL,
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

Don't have an API key yet? **[Sign up at lk.insoweb.ru](https://lk.insoweb.ru)** — takes under a minute.

### 2. Log via `useELS()`

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

### 3. Wrap the root in `<ELSErrorBoundary>`

```tsx
import { ELSErrorBoundary } from '@inso_web/els-react';

<ELSErrorBoundary fallback={<div>Something went wrong</div>}>
  <App />
</ELSErrorBoundary>
```

Render-phase errors are captured automatically with stack trace + `componentStack`.

### 4. Global handlers (optional)

```tsx
import { useGlobalErrorHandlers } from '@inso_web/els-react';

export function ErrorReporter() {
  useGlobalErrorHandlers(); // window.error + unhandledrejection
  return null;
}
```

Mount `<ErrorReporter />` once inside the provider.

---

## When to use what

| Scenario | Use |
|---|---|
| Catch render-phase errors | Wrap a subtree in `<ELSErrorBoundary>` |
| Handle async errors in event handlers | `useELS()` + `try/catch` |
| Background `window.error` / `unhandledrejection` | Mount `<ErrorReporter />` with `useGlobalErrorHandlers()` |
| Multiple sub-apps with different configs | Multiple `<ELSProvider>` instances (innermost wins) |
| Outside React (utility module) | Import the `ELSClient` directly |
| SSR (Next.js) | Use [`@inso_web/els-next`](https://github.com/official-inso/els-next) instead |

---

## Core concepts

### `<ELSErrorBoundary>`

A regular React error boundary that calls `client.error(err, ..., { meta: { componentStack } })` in `componentDidCatch`. Render-phase exceptions are captured; event-handler errors are not (React itself doesn't surface them to boundaries — wrap with `try/catch`).

### `useELS()`

Returns the same `Logger` interface as the base client: `info`, `warn`, `error`, `debug`, `trace`, `fatal`, `child`, `flush`. The reference is stable across renders.

### Bindings & child loggers

```tsx
const log = useELS();
const userLog = log.child({ userId: 42, role: 'admin' });
userLog.info('viewed profile');
```

`child` is cheap — create one per user, per workflow, per route as needed.

---

## Configuration

`ELSConfig` matches the base client — see [@inso_web/els-client](https://github.com/official-inso/els-client). Key fields:

| Option | Description |
|---|---|
| `endpoint` | ELS URL (required) |
| `apiKey` | API key (required) |
| `appSlug` | App slug (required) |
| `serviceName` | Service / module name |
| `deploymentEnv` | `DEV` / `STAGING` / `PRODUCTION` |
| `appVersion` | Version (≤128 chars) |
| `minLevel` | Minimum level to send |

---

## Migration

### From @sentry/react

**Before:**

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

**After:**

```tsx
import { ELSClient } from '@inso_web/els-client';
import { ELSProvider, ELSErrorBoundary, useELS } from '@inso_web/els-react';

const client = new ELSClient({
  endpoint: import.meta.env.VITE_ELS_URL,
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

| Sentry | ELS | Notes |
|---|---|---|
| `Sentry.init({ dsn })` | `new ELSClient({ endpoint, apiKey, appSlug })` | Three explicit fields |
| `<Sentry.ErrorBoundary>` | `<ELSErrorBoundary>` | Same role, same API |
| `Sentry.captureException(err)` | `log.error(err)` | Via `useELS()` |
| `Sentry.captureMessage(msg, level)` | `log.<level>(msg)` | |
| `Sentry.setUser({ id })` | `log.child({ user: { id } })` | Or via `loggerDefaults` |
| `release` | `appVersion` | Any string ≤128 chars |
| `environment` | `deploymentEnv` | Fixed enum |
| `Sentry.withSentryReactRouterV6Routing` | Not provided | Routing telemetry stays in Sentry if needed |
| Source maps upload | Not provided | Pair with another tool if critical |
| Session replay | Not provided | LogRocket / Sentry Replay if needed |

**Gotchas:**

- React event-handler errors are not caught by error boundaries — wrap async logic in `try/catch` and call `log.error(...)` explicitly.
- Sentry's `breadcrumbs` have no direct equivalent — use `log.child({ ... })` to carry context.

---

### From LogRocket React SDK

**Before:**

```tsx
import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';

LogRocket.init('app/123');
setupLogRocketReact(LogRocket);

LogRocket.identify('user-42', { email: 'a@b.com' });
LogRocket.captureException(new Error('boom'));
```

**After:**

```tsx
import { ELSClient } from '@inso_web/els-client';
import { ELSProvider, ELSErrorBoundary, useELS } from '@inso_web/els-react';

const client = new ELSClient({
  endpoint: import.meta.env.VITE_ELS_URL,
  apiKey: import.meta.env.VITE_ELS_API_KEY,
  appSlug: 'my-react-app',
});

// usage
const log = useELS();
log.child({ user: { id: 'user-42', email: 'a@b.com' } }).info('identified');
log.error(new Error('boom'));
```

| LogRocket | ELS | Notes |
|---|---|---|
| `LogRocket.init('app/123')` | `new ELSClient({ endpoint, apiKey, appSlug })` | Three explicit fields |
| `LogRocket.identify(id, meta)` | `log.child({ user: { id, ...meta } })` | Bindings travel with the logger |
| `LogRocket.captureException(err)` | `log.error(err)` | |
| `LogRocket.log/info/warn/error` | `log.<level>(...)` | |
| Session replay | Not provided | Stay on LogRocket if replay is critical |
| Network request capture | Not provided | Log explicit `log.info({ url, status })` instead |
| Redux integration | Not provided | Call `log.info(action.type, ...)` in middleware |

**Gotchas:**

- LogRocket records full DOM sessions; ELS only stores discrete events. If session replay is the reason you chose LogRocket, keep it.
- LogRocket's request/response interception is opaque — replicate with explicit log calls in your fetch wrapper.

---

## Versioning

Pass via build-time env. For Vite — `VITE_BUILD_VERSION` (Vite inlines at `npm run build`):

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

ELS accepts any format ≤128 chars: semver, CalVer, date-compact, git SHA, opaque. The server auto-detects the format and sorts timelines.

---

## Quick reference

| Need | Use |
|---|---|
| Logger in components | `const log = useELS()` |
| Catch render crashes | `<ELSErrorBoundary>` |
| Catch event-handler errors | `try/catch` + `log.error(err)` |
| Global browser errors | Mount `<ErrorReporter />` with `useGlobalErrorHandlers()` |
| Identify user | `log.child({ user: { id, email } })` |
| Per-route context | `log.child({ route })` in a layout component |
| Suppress noisy levels | `minLevel: 'warn'` |

---

## Why ELS

ELS for Node.js is a focused logging SaaS, not a full observability suite. It optimises for capture speed, AI-driven triage, and a low integration cost.

- **Lower weight.** ~3 KB gzip in the browser, no transitive deps.
- **Zero external API calls.** Only `POST /errors[/batch]` and `GET /health`.
- **AI-assisted diagnosis** on every stack trace — `componentStack` included for React render errors.
- **5-minute integration.** Provider + boundary + hook, done.
- **Predictable price.** Tariffs in the dashboard.

### Detailed comparison

| Category | ELS | Sentry | Datadog / New Relic | Grafana Loki | LogRocket / Logtail / BetterStack |
|---|---|---|---|---|---|
| Hosting model | Managed SaaS | SaaS or self-hosted | SaaS only | Self-hosted / Grafana Cloud | SaaS |
| SDK runtime deps | Zero | Medium (sub-SDKs, integrations) | Heavy (agent + tracing) | Promtail / agent | Medium |
| Typical integration time | ~5 min | 10–20 min | 30–60 min | Hours to days | 10–20 min |
| AI-assisted triage | Built-in | Paid add-on | Paid add-on | None | None |
| Error grouping / fingerprint | Yes | Yes | Yes | Manual via LogQL | Partial |
| Source-map upload | No | Yes | Yes | n/a | Partial |
| Session replay (frontend) | No | Paid | Paid | n/a | Yes (core) |
| Distributed tracing / APM | No | Partial | Yes (core) | Yes with Tempo | No |
| Infrastructure metrics | No | No | Yes (core) | Yes with Mimir | No |
| Free tier log retention | 24 hours | 30 days (limited volume) | Trial only | Self-cost | 3–30 days |
| Russian-language support / docs | Native | Community | Limited | Community | None |

### When ELS is the wrong choice

- You need a single vendor for **APM + logs + metrics** under one bill — go Datadog or New Relic.
- Your frontend bug triage relies on **DOM session replay** — go LogRocket or Sentry Replay.
- You ship a **public mobile app** and need crash symbolication + ANR detection — Firebase Crashlytics or Sentry Mobile.

For everything else — backend errors, frontend JS errors, request logs, structured app events with version-aware analytics — ELS is built to be the cheapest path to a working dashboard.

→ **Sign up at [lk.insoweb.ru](https://lk.insoweb.ru)** to grab an API key.

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

Full `ELSConfig` reference — see [@inso_web/els-client](https://github.com/official-inso/els-client).

---

## FAQ

**React 18 / 19?** Yes. Supported on React 17+.

**Is the API key safe in the client bundle?** Yes. ELS keys are scoped — a write key cannot read events. Same model as Sentry public DSN. If you still want to hide it, run an internal `/api/log` proxy.

**What if `apiKey` is empty?** `new ELSClient({ ..., apiKey: '' })` throws. Guard in the entry file:

```ts
const client = apiKey
  ? new ELSClient({ ..., apiKey })
  : ({ info: () => {}, warn: () => {}, error: () => {}, /* ... */ } as any);
```

Or use [`@inso_web/els-next`](https://github.com/official-inso/els-next) which has the silent-no-op guard built-in.

**SSR with Next.js?** Use [`@inso_web/els-next`](https://github.com/official-inso/els-next) — single config for server + client + edge.

---

## Other ELS SDKs

Same wire format, same dashboard — pick by stack.

**Node.js family**
- [`@inso_web/els-client`](https://github.com/official-inso/els-client) — base TS / Node / browser client
- [`@inso_web/els-express`](https://github.com/official-inso/els-express) — Express middleware
- [`@inso_web/els-next`](https://github.com/official-inso/els-next) — Next.js helpers (App + Pages router)
- [`@inso_web/els-nest`](https://github.com/official-inso/els-nest) — NestJS module
- [`@inso_web/els-react`](https://github.com/official-inso/els-react) — React Provider, hooks, ErrorBoundary (this repo)
- [`@inso_web/els-vue`](https://github.com/official-inso/els-vue) — Vue 3 plugin

**Other stacks**
- [`Inso.Els`](https://github.com/official-inso/els-csharp) — .NET (Core + ASP.NET Core + ILogger)
- [`io.github.official-inso:els-core`](https://github.com/official-inso/els-java) — Java + Spring Boot starter + SLF4J
- [`github.com/official-inso/els-go`](https://github.com/official-inso/els-go) — Go

---

## Pricing

Free tier — **24-hour log retention**. See **[lk.insoweb.ru](https://lk.insoweb.ru)** for the full tariff matrix.

---

## License

[MIT](./LICENSE) © INSOWEB
