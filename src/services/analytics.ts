import { supabase } from '../lib/supabase';

export type AnalyticsEventType =
  | 'page_view'
  | 'itinerary_created'
  | 'itinerary_updated'
  | 'itinerary_deleted'
  | 'expense_added'
  | 'payment_added'
  | 'pdf_exported'
  | 'share_link_created'
  | 'collaborator_added';

export type AnalyticsEvent = {
  event_type: AnalyticsEventType;
  event_data?: Record<string, any>;
};

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('analytics_events').insert({
    user_id: user.id,
    event_type: event.event_type,
    event_data: event.event_data || {},
  });
}

export async function getEventCount(eventType: AnalyticsEventType, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', eventType);

  if (error) throw error;
  return count || 0;
}

export async function getEventsByType(
  eventType: AnalyticsEventType,
  userId: string,
  limit = 100,
): Promise<any[]> {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getEventsByDateRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<any[]> {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
