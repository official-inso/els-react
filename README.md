# @inso_web/els-react

[![npm version](https://img.shields.io/npm/v/@inso_web/els-react.svg)](https://www.npmjs.com/package/@inso_web/els-react)
[![npm downloads](https://img.shields.io/npm/dm/@inso_web/els-react.svg)](https://www.npmjs.com/package/@inso_web/els-react)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/npm/l/@inso_web/els-react.svg)](./LICENSE)

React-обёртка для **Error Logs Service (ELS)**: `<ELSProvider>` для DI клиента, hook `useELS()`, готовый `<ErrorBoundary>` с автоматической отправкой ошибок render-фазы. React 17+.

## Что внутри

- `<ELSProvider client={...}>` — кладёт клиент в контекст.
- `useELS()` — hook возвращает logger.
- `<ELSErrorBoundary>` — error boundary который ловит render-ошибки и шлёт в ELS со stack trace + componentStack.
- `useGlobalErrorHandlers()` — hook для подписки на `window.error` и `unhandledrejection`.

---

## UI: что вы получаете

ELS из коробки даёт админ-панель — все события из вашего React приложения попадают в неё.

### Список логов с фильтрами

![Список логов](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/01-error-logs-list.png)

Виртуальная таблица всех событий: trace ID, приложение, источник (client/server), уровень, сообщение, страница, IP. Левый сайдбар — фасеты по приложению, окружению, **версии**, источнику, уровню, браузеру, языку, IP, категории ошибки.

### Детальная карточка с метаданными

![Детальная карточка](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/02-event-detail-info.png)

Время сервера/клиента, IP с гео, окружение, **версия приложения**, fingerprint, session ID. Карточки повторений и корреляция событий справа.

### AI-диагностика ошибок

![AI диагностика](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/03-error-detail-ai.png)

Stack trace с распарсенными фреймами + AI-анализ что именно сломалось и как чинить. Для React-ошибок дополнительно сохраняется `componentStack`.

### Аналитика и регрессии по версиям

![Аналитика](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/04-analytics-dashboard.png)

Total / critical+errors / warnings / error rate. AI-обзор слева, timeline в центре, donut'ы по приложению/источнику/уровню. **Виджет «Регрессии»**: какие fingerprint'ы появились впервые в свежей версии и какие пропали.

### Управление API-ключами

![API ключи](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/05-api-keys.png)
![Действия с ключом](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/06-api-key-actions.png)

Scoped-ключи (write/read/read-any), live/test environments, ротация без даунтайма.

### Избранные события

![Избранные](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/07-favorites.png)

Закладки на конкретные trace ID — для расследований, не теряются между сессиями.

---

## Установка

```bash
npm install @inso_web/els-client @inso_web/els-react
```

---

## Quick Start

### 1. Подключите Provider

`main.tsx` (Vite) или `index.tsx` (CRA):

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

Render-ошибки автоматически пойдут в ELS с stack trace + componentStack.

### 4. Глобальные обработчики (опционально)

```tsx
import { useGlobalErrorHandlers } from '@inso_web/els-react';

export function ErrorReporter() {
  useGlobalErrorHandlers(); // window.error + unhandledrejection
  return null;
}
```

---

## Версионирование

Прокидывайте версию через переменные сборки. Для Vite — `VITE_BUILD_VERSION` (Vite инлайнит на этапе build):

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

ELS принимает любой формат до 128 символов: semver, CalVer, date-compact, git SHA, opaque. Парсер на стороне сервера автоматически распознаёт тип и сортирует timeline.

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

---

## FAQ

**Совместимо с React 18 / 19?** Да. Поддерживается React 17+.

**А `apiKey` для клиентского bundle — это безопасно?** Да. ELS-ключи scoped (только write для приложения), и они всё равно видны в bundle (как у Sentry public DSN).

**Что если `apiKey` пустой?** Если передать `apiKey: ''` в `new ELSClient({...})` — конструктор throw'нёт. Используйте guard в коде:

```ts
const client = apiKey
  ? new ELSClient({ ..., apiKey })
  : { info: () => {}, warn: () => {}, error: () => {}, /* ... */ };
```

Либо используйте обёртки next/nest которые уже имеют такой guard.

---

## License

[MIT](./LICENSE) © INSOWEB
