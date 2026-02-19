import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { supabase } from '../../lib/supabase';
import type { SplitPaymentReminder } from '../../services/split';
import { sendLocalNotification } from '../../services/pushNotifications';

type PaymentReminderNotificationProps = {
  groupId: string;
  userId: string;
};

export function PaymentReminderNotification({ groupId, userId }: PaymentReminderNotificationProps) {
  const [reminders, setReminders] = useState<SplitPaymentReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const { data, error } = await supabase
          .from('split_payment_reminders')
          .select('*')
          .eq('group_id', groupId)
          .eq('sent', false)
          .lte('reminder_date', new Date().toISOString().split('T')[0]);

        if (error) throw error;

        const activeReminders = (data || []).filter(
          reminder => reminder.payer_id === userId || reminder.payee_id === userId,
        ) as SplitPaymentReminder[];
        
        setReminders(activeReminders);

        // Send notifications for active reminders
        activeReminders.forEach(reminder => {
          sendLocalNotification('Recordatorio de pago', {
            body: `Recordatorio: ${reminder.note || 'Pago pendiente'}`,
            icon: '/panda-logo.png',
          });
        });
      } catch (error) {
        console.error('Error loading reminders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReminders();
    const interval = setInterval(loadReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [groupId, userId]);

  if (isLoading || reminders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {reminders.map(reminder => (
        <Card key={reminder.id} className="border-yellow-500/20 bg-yellow-50 dark:bg-yellow-900/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <CardTitle className="text-sm">Recordatorio de pago</CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs">
              {new Date(reminder.reminder_date).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{reminder.note || 'Pago pendiente'}</p>
            <p className="text-xs text-mutedForeground mt-1">
              Cantidad: €{Number(reminder.amount).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
