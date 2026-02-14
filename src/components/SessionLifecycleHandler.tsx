import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from '../lib/supabase';

const REFRESH_WINDOW_MS = 5 * 60 * 1000;

async function refreshSessionIfNeeded() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return;

  const expiresAtMs = (data.session.expires_at ?? 0) * 1000;
  if (!expiresAtMs) return;

  if (expiresAtMs - Date.now() <= REFRESH_WINDOW_MS) {
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.error('Failed to refresh auth session on app resume:', refreshError);
    }
  }
}

export function SessionLifecycleHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void refreshSessionIfNeeded();

    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return;
      void refreshSessionIfNeeded();
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
