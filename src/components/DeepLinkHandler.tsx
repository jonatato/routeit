import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

function extractRouteFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname;

    // Custom schemes like com.routeit.app://reset expose "reset" as host.
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      const hostSegment = parsed.hostname ? `/${parsed.hostname}` : '';
      const pathSegment = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
      path = `${hostSegment}${pathSegment}` || '/';
    }

    const route = `${path}${parsed.search}${parsed.hash}`;
    if (!route.startsWith('/')) return null;
    return route;
  } catch {
    return null;
  }
}

export function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapacitorApp.addListener('appUrlOpen', (event) => {
      const route = extractRouteFromUrl(event.url);
      if (route) {
        navigate(route);
      }
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [navigate]);

  return null;
}
