const BIOMETRIC_PREF_PREFIX = 'routeit:biometric-enabled';

function keyFor(userId: string) {
  return `${BIOMETRIC_PREF_PREFIX}:${userId}`;
}

export function getBiometricEnabled(userId: string): boolean {
  try {
    return window.localStorage.getItem(keyFor(userId)) === '1';
  } catch {
    return false;
  }
}

export function setBiometricEnabled(userId: string, enabled: boolean): void {
  try {
    window.localStorage.setItem(keyFor(userId), enabled ? '1' : '0');
  } catch {
    // noop
  }
}
