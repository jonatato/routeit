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

export type OtaBootStatus =
  | 'initializing'
  | 'checking'
  | 'downloading'
  | 'applying'
  | 'upToDate'
  | 'updated'
  | 'skipped'
  | 'error';

type OtaCheckOptions = {
  requestTimeoutMs?: number;
  notifyAppReady?: boolean;
  applyMode?: 'next' | 'immediate';
  onStatus?: (status: OtaBootStatus) => void;
};

const OTA_BOOT_MAX_WAIT_MS = 15_000;

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    operation
      .then(value => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch(error => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

const OTA_CHANNEL = (import.meta.env.VITE_OTA_CHANNEL as OtaChannel | undefined) ?? 'production';

export async function runSelfHostedOtaCheck(options: OtaCheckOptions = {}): Promise<void> {
  const emitStatus = (status: OtaBootStatus) => options.onStatus?.(status);
  emitStatus('initializing');

  const platform = Capacitor.getPlatform();
  if (platform !== 'android' && platform !== 'ios') {
    emitStatus('skipped');
    return;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!supabaseUrl) {
    emitStatus('skipped');
    return;
  }

  try {
    const requestTimeoutMs = options.requestTimeoutMs ?? 8000;
    const { CapacitorUpdater } = await withTimeout(
      import('@capgo/capacitor-updater'),
      requestTimeoutMs,
      'Timed out importing updater plugin',
    );

    if (options.notifyAppReady) {
      try {
        await withTimeout(
          CapacitorUpdater.notifyAppReady(),
          requestTimeoutMs,
          'Timed out calling notifyAppReady',
        );
      } catch {
        // Ignore notify failures
      }
    }

    emitStatus('checking');

    const [currentInfo, deviceInfo] = await withTimeout(
      Promise.all([CapacitorUpdater.current(), CapacitorUpdater.getDeviceId()]),
      requestTimeoutMs,
      'Timed out reading current/device info',
    );

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

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
      emitStatus('error');
      return;
    }

    const data = (await response.json()) as OtaCheckResponse;
    if (!data.updateAvailable || !data.release?.downloadUrl || !data.release.bundleVersion) {
      emitStatus('upToDate');
      return;
    }

    emitStatus('downloading');

    const downloadedBundle = await withTimeout(
      CapacitorUpdater.download({
        version: data.release.bundleVersion,
        url: data.release.downloadUrl,
        checksum: data.release.checksum ?? undefined,
      }),
      requestTimeoutMs,
      'Timed out downloading OTA bundle',
    );

    emitStatus('applying');

    if (options.applyMode === 'immediate') {
      await withTimeout(
        CapacitorUpdater.set({ id: downloadedBundle.id }),
        requestTimeoutMs,
        'Timed out applying OTA bundle',
      );
      emitStatus('updated');
      return;
    }

    await withTimeout(
      CapacitorUpdater.next({ id: downloadedBundle.id }),
      requestTimeoutMs,
      'Timed out scheduling OTA bundle',
    );
    emitStatus('updated');
  } catch {
    emitStatus('error');
    // Ignore OTA check errors to avoid affecting app startup
  }
}

export async function prepareOtaBeforeAppStart(onStatus?: (status: OtaBootStatus) => void): Promise<void> {
  const emitStatus = (status: OtaBootStatus) => onStatus?.(status);
  const otaPromise = runSelfHostedOtaCheck({
    applyMode: 'immediate',
    requestTimeoutMs: 10_000,
    notifyAppReady: true,
    onStatus,
  });

  let timeoutId: number | null = null;
  const timeoutPromise = new Promise<void>(resolve => {
    timeoutId = window.setTimeout(() => {
      emitStatus('error');
      resolve();
    }, OTA_BOOT_MAX_WAIT_MS);
  });

  try {
    await Promise.race([otaPromise, timeoutPromise]);
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
}
