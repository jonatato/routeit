import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '../lib/supabase';
import { resolveRouteFromNotificationPayload } from './notificationIntents';

export type NativePushSubscription = {
  provider: 'fcm' | 'apns' | 'native';
  token: string;
};

export type PushSubscriptionResult = PushSubscription | NativePushSubscription | null;

let nativeListenersRegistered = false;
let pendingNotificationIntentRoute: string | null = null;

export const NOTIFICATION_INTENT_EVENT = 'routeit:notification-intent';

type RouteItNotificationOptions = NotificationOptions & {
  route?: string;
};

function mergeNotificationData(options?: RouteItNotificationOptions): Record<string, unknown> {
  const payload = options?.data;
  const baseData = payload && typeof payload === 'object' ? { ...payload as Record<string, unknown> } : {};

  if (options?.route) {
    baseData.route = options.route;
  }

  return baseData;
}

function emitNotificationIntent(route: string) {
  pendingNotificationIntentRoute = route;
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_INTENT_EVENT, {
      detail: { route },
    }),
  );
}

export function consumePendingNotificationIntent(): string | null {
  const route = pendingNotificationIntentRoute;
  pendingNotificationIntentRoute = null;
  return route;
}

async function persistPushSubscription(
  provider: 'web' | 'fcm' | 'apns' | 'native',
  token: string,
  subscription: Record<string, unknown>,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        provider,
        token,
        subscription,
        device_info: {
          platform: Capacitor.getPlatform(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'native',
        },
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' },
    );

  if (error) {
    console.error('Error persisting push subscription:', error);
  }
}

function mapNativePermission(status: 'prompt' | 'granted' | 'denied'): NotificationPermission {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'default';
}

async function requestNativePushPermission(): Promise<NotificationPermission> {
  const current = await PushNotifications.checkPermissions();
  if (current.receive === 'granted') return 'granted';

  const requested = await PushNotifications.requestPermissions();
  return mapNativePermission(requested.receive);
}

function registerNativeListeners() {
  if (nativeListenersRegistered) return;
  nativeListenersRegistered = true;

  PushNotifications.addListener('registration', async (token) => {
    console.log('Native push token:', token.value);
    await persistPushSubscription('native', token.value, { token: token.value });
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('Native push registration error:', error);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push action performed:', action);
    const route = resolveRouteFromNotificationPayload(action.notification.data);
    if (route) {
      emitNotificationIntent(route);
    }
  });
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (Capacitor.isNativePlatform()) {
    return requestNativePushPermission();
  }

  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
}

export async function subscribeToPushNotifications(): Promise<PushSubscriptionResult> {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  if (Capacitor.isNativePlatform()) {
    registerNativeListeners();
    await PushNotifications.register();
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    if (!vapidKey) {
      console.warn('VAPID public key not configured');
      return null;
    }
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    if (subscription) {
      await persistPushSubscription('web', subscription.endpoint, subscription.toJSON());
      console.log('Web push subscription:', subscription);
    }

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export async function sendLocalNotification(title: string, options?: RouteItNotificationOptions) {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return;
  const data = mergeNotificationData(options);

  if (Capacitor.isNativePlatform()) {
    const localPermission = await LocalNotifications.checkPermissions();
    if (localPermission.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title,
          body: options?.body ?? '',
          extra: data,
          schedule: { at: new Date(Date.now() + 250) },
        },
      ],
    });
    return;
  }

  const notification = new Notification(title, {
    ...options,
    data,
  });
  notification.onclick = () => {
    const route = resolveRouteFromNotificationPayload(notification.data);
    if (route) {
      window.location.assign(route);
    }
  };
}
