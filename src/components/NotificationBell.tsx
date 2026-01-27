import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useNotifications } from '../context/NotificationContext';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primaryForeground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <Card className="absolute right-0 top-full z-[101] mt-2 w-80 max-h-96 overflow-y-auto shadow-lg border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
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
                    className="text-xs h-7"
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
                  className="text-xs h-7 w-7 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-mutedForeground/30 mb-2" />
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
                    className={`rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      notification.read 
                        ? 'bg-background border-border' 
                        : 'bg-primary/5 border-primary/20'
                    }`}
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      if (!notification.read) {
                        markAsRead(notification.id);
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
