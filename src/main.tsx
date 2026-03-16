import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'driver.js/dist/driver.css';
import 'sileo/styles.css';
import './index.css';
import './i18n/config';
import App from './App.tsx';
import { CapgoAppReadyNotifier } from './components/CapgoAppReadyNotifier.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { I18nProvider } from './components/I18nProvider.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { Toaster } from 'sileo';
import * as Sentry from '@sentry/react';
import { prepareOtaBeforeAppStart, type OtaBootStatus } from './services/ota.ts';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.1,
  });
}

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('No se encontró el contenedor raíz de la aplicación.');
}

const root = createRoot(rootElement);

const otaStatusMessages: Record<OtaBootStatus, string> = {
  initializing: 'Iniciando verificación de actualización...',
  checking: 'Comprobando si existe una nueva versión...',
  downloading: 'Descargando actualización...',
  applying: 'Aplicando actualización...',
  upToDate: 'Tu app ya está actualizada. Abriendo Routeit...',
  updated: 'Actualización aplicada. Abriendo Routeit...',
  skipped: 'No se requiere actualización en este dispositivo.',
  error: 'No se pudo verificar OTA. Iniciando Routeit...',
};

const renderOtaBootScreen = (status: OtaBootStatus) => {
  const message = otaStatusMessages[status];

  root.render(
    <StrictMode>
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
          <img src="/routeit-icon.svg" alt="Routeit" className="mx-auto h-14 w-14" />
          <h1 className="mt-4 text-lg font-semibold">Preparando Routeit</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <div className="mx-auto mt-5 h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      </div>
    </StrictMode>,
  );
};

const renderApp = () => {
  root.render(
    <StrictMode>
      <ThemeProvider>
        <NotificationProvider>
          <I18nProvider>
            <BrowserRouter>
              <CapgoAppReadyNotifier />
              <App />
              <OfflineIndicator />
              <Toaster position="top-right" />
            </BrowserRouter>
          </I18nProvider>
        </NotificationProvider>
      </ThemeProvider>
    </StrictMode>,
  );
};

const bootstrap = async () => {
  renderOtaBootScreen('initializing');
  try {
    await prepareOtaBeforeAppStart((status) => {
      renderOtaBootScreen(status);
    });
  } finally {
    renderApp();
  }
};

void bootstrap();
