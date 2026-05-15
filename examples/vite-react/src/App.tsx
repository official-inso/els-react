import { ELSErrorBoundary } from '@inso_web/els-react';
import ErrorTrigger from './ErrorTrigger';

export default function App() {
  return (
    <main>
      <h1>@inso_web/els-react — Vite example</h1>
      <p>
        Этот пример демонстрирует <code>ELSProvider</code>,{' '}
        <code>useErrorReporter</code> и <code>ELSErrorBoundary</code>.
      </p>
      <ELSErrorBoundary
        fallback={<div className="err">Что-то сломалось (поймал ELSErrorBoundary)</div>}
      >
        <ErrorTrigger />
      </ELSErrorBoundary>
    </main>
  );
}
