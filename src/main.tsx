import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './index.css';
import './i18n/config';
import App from './App.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { I18nProvider } from './components/I18nProvider.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { Toaster } from 'react-hot-toast';
import * as Sentry from '@sentry/react';

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <I18nProvider>
          <BrowserRouter>
            <App />
            <OfflineIndicator />
            <Toaster position="top-right" />
          </BrowserRouter>
        </I18nProvider>
      </NotificationProvider>
    </ThemeProvider>
  </StrictMode>
);
