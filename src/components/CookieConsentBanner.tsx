import { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { COOKIE_PREFERENCES_EVENT, useCookieConsent } from '../hooks/useCookieConsent';
import { useTranslation } from '../hooks/useTranslation';

function CookieConsentBanner() {
  const { t } = useTranslation();
  const { consent, showBanner, acceptAll, rejectNonEssential, savePreferences } = useCookieConsent();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const openConfig = useCallback(() => {
    setAnalytics(consent?.analytics ?? false);
    setMarketing(consent?.marketing ?? false);
    setIsConfigOpen(true);
  }, [consent]);

  useEffect(() => {
    window.addEventListener(COOKIE_PREFERENCES_EVENT, openConfig);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, openConfig);
  }, [openConfig]);

  return (
    <>
      {showBanner && (
        <div className="fixed inset-x-0 bottom-4 z-[120] px-4">
          <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card/95 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.2)] backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{t('cookies.title')}</p>
                <p className="text-xs text-mutedForeground">{t('cookies.description')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={openConfig}>
                  {t('cookies.configure')}
                </Button>
                <Button variant="outline" size="sm" onClick={rejectNonEssential}>
                  {t('cookies.reject')}
                </Button>
                <Button size="sm" onClick={acceptAll}>
                  {t('cookies.accept')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isConfigOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Preferencias de cookies</h3>
              <p className="text-sm text-mutedForeground">
                Las cookies técnicas son obligatorias. Puedes activar o desactivar el resto.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">Técnicas</p>
                  <p className="text-xs text-mutedForeground">Necesarias para el funcionamiento del sitio.</p>
                </div>
                <span className="text-xs font-semibold text-success">Siempre activas</span>
              </div>

              <label className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">Analítica</p>
                  <p className="text-xs text-mutedForeground">Nos ayuda a entender uso y mejorar producto.</p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={event => setAnalytics(event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">Marketing</p>
                  <p className="text-xs text-mutedForeground">Personaliza contenido y comunicaciones promocionales.</p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={event => setMarketing(event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsConfigOpen(false)}>
                Cerrar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  savePreferences(analytics, marketing);
                  setIsConfigOpen(false);
                }}
              >
                Guardar preferencias
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CookieConsentBanner;
