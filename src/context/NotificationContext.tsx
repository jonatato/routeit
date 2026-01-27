import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { subscribeToUserItineraries, subscribeToSplitwiseChanges, type ItineraryChangeEvent } from '../services/realtime';
import { requestNotificationPermission, subscribeToPushNotifications, sendLocalNotification } from '../services/pushNotifications';

export type Notification = {
  id: string;
  type: 'itinerary' | 'splitwise';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  subscribeToSplitwise: (groupId: string) => any;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Request push notification permission
      await requestNotificationPermission();
      await subscribeToPushNotifications();

      const channels: any[] = [];

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
