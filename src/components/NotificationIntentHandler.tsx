import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { consumePendingNotificationIntent, NOTIFICATION_INTENT_EVENT } from '../services/pushNotifications';

type NotificationIntentEvent = CustomEvent<{ route?: string }>;

export function NotificationIntentHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const pendingRoute = consumePendingNotificationIntent();
    if (pendingRoute && `${location.pathname}${location.search}` !== pendingRoute) {
      navigate(pendingRoute);
    }

    const onNotificationIntent = (event: Event) => {
      const customEvent = event as NotificationIntentEvent;
      const route = customEvent.detail?.route;
      if (!route || `${location.pathname}${location.search}` === route) return;
      navigate(route);
    };

    window.addEventListener(NOTIFICATION_INTENT_EVENT, onNotificationIntent as EventListener);
    return () => {
      window.removeEventListener(NOTIFICATION_INTENT_EVENT, onNotificationIntent as EventListener);
    };
  }, [location.pathname, location.search, navigate]);

  return null;
}
