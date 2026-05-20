import React from 'react';
import ReactDOM from 'react-dom/client';
import { ELSProvider } from '@inso_web/els-react';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ELSProvider
      config={{
        apiKey: import.meta.env.VITE_ELS_API_KEY || 'els_live_xxxxxxxx',
        appSlug: 'examples',
        deploymentEnv: 'DEV',
        serviceName: 'vite-react-example',
      }}
    >
      <App />
    </ELSProvider>
  </React.StrictMode>,
);
