import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export function useIsMobileShell() {
  const [isMobileShell, setIsMobileShell] = useState(false);

  useEffect(() => {
    const check = () => {
      const isNative = Capacitor.isNativePlatform();
      const isSmall = window.matchMedia('(max-width: 768px)').matches;
      setIsMobileShell(isNative || isSmall);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobileShell;
}
