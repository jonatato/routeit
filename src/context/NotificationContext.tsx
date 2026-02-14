/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { subscribeToUserItineraries, subscribeToSplitwiseChanges, type ItineraryChangeEvent } from '../services/realtime';
import { requestNotificationPermission, subscribeToPushNotifications, sendLocalNotification } from '../services/pushNotifications';
import { fetchUserItinerary } from '../services/itinerary';
import { fetchUserPreferences } from '../services/userPreferences';
import { getItineraryStartDate, isSameDay } from '../utils/itineraryDates';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type Notification = {
  id: string;
  type: 'itinerary' | 'splitwise';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: unknown;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  subscribeToSplitwise: (groupId: string) => RealtimeChannel;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const preferences = await fetchUserPreferences(user.id);
      if (preferences && preferences.notifications === false) {
        return;
      }

      // Request push notification permission
      await requestNotificationPermission();
      await subscribeToPushNotifications();

      const channels: RealtimeChannel[] = [];

      const itinerary = await fetchUserItinerary(user.id);
      if (itinerary) {
        const startDate = getItineraryStartDate(itinerary);
        if (startDate) {
          const today = new Date();
          const dateKey = startDate.toISOString().slice(0, 10);
          const storageKey = `routeit-itinerary-start-${itinerary.id}-${dateKey}`;
          const alreadyNotified = localStorage.getItem(storageKey) === '1';
          if (isSameDay(startDate, today) && !alreadyNotified) {
            const notification: Notification = {
              id: `itinerary-start-${itinerary.id}-${Date.now()}`,
              type: 'itinerary',
              title: 'Hoy empieza tu viaje',
              message: 'Revisa el dia actual y tu lista de actividades.',
              read: false,
              created_at: new Date().toISOString(),
              data: {
                route: `/app/today${itinerary.id ? `?itineraryId=${itinerary.id}` : ''}`,
              },
            };
            setNotifications(prev => [notification, ...prev]);
            localStorage.setItem(storageKey, '1');
          }
        }
      }

      // Subscribe to user itineraries
      const itineraryChannel = subscribeToUserItineraries(user.id, (event: ItineraryChangeEvent) => {
        const notification: Notification = {
          id: `itinerary-${event.itinerary_id}-${Date.now()}`,
          type: 'itinerary',
          title: 'Itinerario actualizado',
          message: `El itinerario ha sido modificado`,
          read: false,
          created_at: new Date().toISOString(),
          data: event,
        };
        setNotifications(prev => [notification, ...prev]);
        
        // Send push notification
        sendLocalNotification(notification.title, {
          body: notification.message,
          icon: '/panda-logo.svg',
          data: {
            type: 'itinerary',
            itineraryId: event.itinerary_id,
          },
        });
      });
      channels.push(itineraryChannel);

      return () => {
        channels.forEach(channel => supabase.removeChannel(channel));
      };
    };

    const cleanup = setupSubscriptions();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  // Function to subscribe to Splitwise changes (called from Split page)
  const subscribeToSplitwise = (groupId: string) => {
    const channel = subscribeToSplitwiseChanges(groupId, (event) => {
      const notification: Notification = {
        id: `splitwise-${event.group_id}-${Date.now()}`,
        type: 'splitwise',
        title: event.type === 'expense_added' ? 'Nuevo gasto' : event.type === 'payment_added' ? 'Pago registrado' : 'Cambio en Splitwise',
        message: event.type === 'expense_added' ? 'Se ha añadido un nuevo gasto' : event.type === 'payment_added' ? 'Se ha registrado un pago' : 'Ha habido un cambio en Splitwise',
        read: false,
        created_at: new Date().toISOString(),
        data: event,
      };
      setNotifications(prev => [notification, ...prev]);
      
      // Send push notification
      sendLocalNotification(notification.title, {
        body: notification.message,
        icon: '/panda-logo.svg',
        data: {
          type: 'splitwise',
          groupId: event.group_id,
        },
      });
    });
    return channel;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, subscribeToSplitwise }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
