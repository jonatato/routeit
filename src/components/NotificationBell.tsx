import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useNotifications } from '../context/NotificationContext';
import { useLocation, useNavigate } from 'react-router-dom';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isNotificationsActive = isOpen;

  return (
    <div className="relative">
      <button
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`relative h-9 w-9 rounded-md flex items-center justify-center transition-colors ${
          isNotificationsActive ? 'bg-primary/10' : 'hover:bg-muted'
        }`}
      >
        <Bell className={`h-5 w-5 ${isNotificationsActive ? 'text-primary' : 'text-mutedForeground'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[1px]" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <Card className="absolute right-0 top-full z-[101] mt-3 w-[min(22rem,90vw)] max-h-[70vh] overflow-y-auto rounded-2xl border border-border/80 bg-popover shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/70 pb-3">
              <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }} 
                    className="h-7 text-xs"
                  >
                    Marcar todas como leídas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: MouseEvent) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="h-7 w-7 p-0 text-xs"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {notifications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/50 py-8 text-center">
                  <Bell className="mx-auto mb-2 h-12 w-12 text-mutedForeground/40" />
                  <p className="text-sm text-mutedForeground">
                    No hay notificaciones
                  </p>
                  <p className="text-xs text-mutedForeground mt-1">
                    Te notificaremos cuando haya actualizaciones
                  </p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`rounded-xl border p-3 cursor-pointer transition-colors hover:bg-primary/10 hover:border-primary/30 ${
                      notification.read 
                        ? 'bg-background border-border' 
                        : 'bg-primary/10 border-primary/25'
                    }`}
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      const targetRoute = notification.data?.route;
                      if (typeof targetRoute === 'string' && targetRoute.length > 0) {
                        setIsOpen(false);
                        if (location.pathname + location.search !== targetRoute) {
                          navigate(targetRoute);
                        }
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-mutedForeground mt-1 break-words">
                          {notification.message}
                        </p>
                        <p className="text-xs text-mutedForeground mt-1">
                          {new Date(notification.created_at).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
