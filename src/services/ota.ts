import { Capacitor } from '@capacitor/core';

type OtaChannel = 'production' | 'beta';
type OtaPlatform = 'android' | 'ios';

type OtaRelease = {
  bundleVersion: string;
  downloadUrl: string;
  checksum?: string | null;
};

type OtaCheckResponse = {
  updateAvailable: boolean;
  release?: OtaRelease;
};

const OTA_CHANNEL = (import.meta.env.VITE_OTA_CHANNEL as OtaChannel | undefined) ?? 'production';

export async function runSelfHostedOtaCheck(): Promise<void> {
  const platform = Capacitor.getPlatform();
  if (platform !== 'android' && platform !== 'ios') return;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!supabaseUrl) return;

  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');

    const [currentInfo, deviceInfo] = await Promise.all([
      CapacitorUpdater.current(),
      CapacitorUpdater.getDeviceId(),
    ]);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${supabaseUrl}/functions/v1/ota-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        action: 'check',
        channel: OTA_CHANNEL,
        platform: platform as OtaPlatform,
        currentBundle: currentInfo.bundle.version || '0.0.0',
        nativeVersion: currentInfo.native || null,
        deviceId: deviceInfo.deviceId,
      }),
    });

    window.clearTimeout(timeoutId);

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as OtaCheckResponse;
    if (!data.updateAvailable || !data.release?.downloadUrl || !data.release.bundleVersion) {
      return;
    }

    const downloadedBundle = await CapacitorUpdater.download({
      version: data.release.bundleVersion,
      url: data.release.downloadUrl,
      checksum: data.release.checksum ?? undefined,
    });

    await CapacitorUpdater.next({ id: downloadedBundle.id });
  } catch {
    // Ignore OTA check errors to avoid affecting app startup
  }
}
