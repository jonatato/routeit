import { Capacitor } from '@capacitor/core';

const NATIVE_SCHEME = 'com.routeit.routeit';

export function buildAuthRedirect(path: `/${string}`): string {
  if (Capacitor.isNativePlatform()) {
    return `${NATIVE_SCHEME}://${path.replace(/^\//, '')}`;
  }
  return `${window.location.origin}${path}`;
}
