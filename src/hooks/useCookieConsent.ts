import { useMemo, useState } from 'react';

export const COOKIE_CONSENT_STORAGE_KEY = 'routeit_cookie_consent_v1';
export const COOKIE_CONSENT_VERSION = 'v1';
export const COOKIE_PREFERENCES_EVENT = 'routeit:open-cookie-preferences';

export type CookieConsent = {
  version: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

function parseConsent(raw: string | null): CookieConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsent;
    if (!parsed || parsed.version !== COOKIE_CONSENT_VERSION) return null;
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.marketing !== 'boolean') return null;
    return {
      version: parsed.version,
      necessary: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveCookieConsent(consent: CookieConsent) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
}

export function openCookiePreferences() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(COOKIE_PREFERENCES_EVENT));
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(() => {
    if (typeof window === 'undefined') return null;
    return parseConsent(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
  });
  const isLoaded = true;

  const updateConsent = (next: Pick<CookieConsent, 'analytics' | 'marketing'>) => {
    const value: CookieConsent = {
      version: COOKIE_CONSENT_VERSION,
      necessary: true,
      analytics: next.analytics,
      marketing: next.marketing,
      updatedAt: new Date().toISOString(),
    };
    setConsent(value);
    saveCookieConsent(value);
  };

  const showBanner = useMemo(() => isLoaded && !consent, [isLoaded, consent]);

  return {
    consent,
    isLoaded,
    showBanner,
    acceptAll: () => updateConsent({ analytics: true, marketing: true }),
    rejectNonEssential: () => updateConsent({ analytics: false, marketing: false }),
    savePreferences: (analytics: boolean, marketing: boolean) => updateConsent({ analytics, marketing }),
  };
}
