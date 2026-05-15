# vite-react

Vite + React 18 + TypeScript starter для `@inso_web/els-react`.

## Запуск

```bash
npm install
VITE_ELS_API_KEY=els_live_xxxxxxxx npm run dev
```

Затем открой `http://localhost:5173/`.

Environment:
- `VITE_ELS_API_KEY` — API ключ ELS
- `VITE_ELS_URL` — URL ELS API (default: `https://api.insoweb.ru/els`)

## Что демонстрирует

- `ELSProvider` в корне приложения с авто-перехватом `window.onerror` и `unhandledrejection`
- `useErrorReporter()` хук для ручной отправки ошибок
- `ELSErrorBoundary` — React error boundary, автоматически логирующий ошибки рендера в ELS
