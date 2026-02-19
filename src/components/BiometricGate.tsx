import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { NativeBiometric } from 'capacitor-native-biometric';
import { supabase } from '../lib/supabase';
import { getBiometricEnabled } from '../services/biometricPreference';
import FullscreenLoader from './FullscreenLoader';

async function getActiveSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

export function BiometricGate() {
  const isNative = Capacitor.isNativePlatform();
  const [isLocked, setIsLocked] = useState(isNative);
  const isVerifyingRef = useRef(false);
  const lastVerifiedAtRef = useRef(0);

  useEffect(() => {
    if (!isNative) return;

    const requestUnlock = async () => {
      const now = Date.now();
      if (isVerifyingRef.current) return;
      if (now - lastVerifiedAtRef.current < 5000) return;

      const session = await getActiveSession();
      if (!session) {
        setIsLocked(false);
        return;
      }

      const biometricEnabled = getBiometricEnabled(session.user.id);
      if (!biometricEnabled) {
        setIsLocked(false);
        return;
      }

      setIsLocked(true);
      isVerifyingRef.current = true;

      try {
        const availability = await NativeBiometric.isAvailable();
        if (!availability?.isAvailable) {
          setIsLocked(false);
          lastVerifiedAtRef.current = Date.now();
          return;
        }

        await NativeBiometric.verifyIdentity({
          reason: 'Desbloquea RouteIt para continuar',
          title: 'Autenticacion biometrica',
          subtitle: 'Verificacion requerida',
          description: 'Usa huella o reconocimiento facial',
        });

        setIsLocked(false);
        lastVerifiedAtRef.current = Date.now();
      } catch (error) {
        console.warn('Biometric verification failed:', error);
        await supabase.auth.signOut();
        setIsLocked(false);
      } finally {
        isVerifyingRef.current = false;
      }
    };

    void requestUnlock();

    const appStateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return;
      void requestUnlock();
    });

    return () => {
      void appStateListener.then((handle) => handle.remove());
    };
  }, [isNative]);

  if (!isNative || !isLocked) return null;

  return <FullscreenLoader message="Verificando identidad..." />;
}
