import { useState } from 'react';
import { useErrorReporter } from '@inso_web/els-react';

export default function ErrorTrigger() {
  const [crash, setCrash] = useState(false);
  const report = useErrorReporter();

  if (crash) throw new Error('Manual crash for ELSErrorBoundary demo');

  return (
    <div className="card">
      <button
        onClick={() => {
          try {
            throw new Error('Manual error from useErrorReporter');
          } catch (e) {
            report(e as Error);
            alert('Sent to ELS!');
          }
        }}
      >
        Send error via useErrorReporter()
      </button>
      <button onClick={() => setCrash(true)}>
        Crash component (caught by ELSErrorBoundary)
      </button>
    </div>
  );
}
