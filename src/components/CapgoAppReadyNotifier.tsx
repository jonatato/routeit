import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { runSelfHostedOtaCheck } from '../services/ota';

export function CapgoAppReadyNotifier() {
  useEffect(() => {
    if (Capacitor.getPlatform() === 'web') return;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
          await CapacitorUpdater.notifyAppReady();
        } catch {
          // Never block app startup because of updater errors
        }

        void runSelfHostedOtaCheck();
      })();
    }, 4000);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
