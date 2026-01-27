import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeCallback<T = any> = (payload: T) => void;

export type ItineraryChangeEvent = {
  type: 'itinerary_updated' | 'day_added' | 'day_updated' | 'day_deleted' | 'schedule_item_added' | 'schedule_item_updated' | 'schedule_item_deleted';
  itinerary_id: string;
  user_id: string;
  data: any;
};

export function subscribeToItineraryChanges(
  itineraryId: string,
  onChange: RealtimeCallback<ItineraryChangeEvent>,
): RealtimeChannel {
  const channel = supabase
    .channel(`itinerary:${itineraryId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'itineraries',
        filter: `id=eq.${itineraryId}`,
      },
      (payload) => {
        const newData = payload.new as any;
        const oldData = payload.old as any;
        onChange({
          type: 'itinerary_updated',
          itinerary_id: itineraryId,
          user_id: newData?.user_id || oldData?.user_id || '',
          data: newData || oldData,
        });
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'days',
        filter: `itinerary_id=eq.${itineraryId}`,
      },
      (payload) => {
        const newData = payload.new as any;
        const oldData = payload.old as any;
        const eventType =
          payload.eventType === 'INSERT'
            ? 'day_added'
            : payload.eventType === 'UPDATE'
            ? 'day_updated'
            : 'day_deleted';
        onChange({
          type: eventType,
          itinerary_id: itineraryId,
          user_id: newData?.itinerary_id ? '' : oldData?.itinerary_id || '',
          data: newData || oldData,
        });
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'schedule_items',
      },
      async (payload) => {
        const newData = payload.new as any;
        const oldData = payload.old as any;
        // Get day_id to check itinerary_id
        const { data: day } = await supabase.from('days').select('itinerary_id').eq('id', newData?.day_id || oldData?.day_id).single();
        if (day?.itinerary_id === itineraryId) {
          const eventType =
            payload.eventType === 'INSERT'
              ? 'schedule_item_added'
              : payload.eventType === 'UPDATE'
              ? 'schedule_item_updated'
              : 'schedule_item_deleted';
          onChange({
            type: eventType,
            itinerary_id: itineraryId,
            user_id: '',
            data: newData || oldData,
          });
        }
      },
    )
    .subscribe();

  return channel;
}

export function subscribeToUserItineraries(
  userId: string,
  onItineraryChange: RealtimeCallback<ItineraryChangeEvent>,
): RealtimeChannel {
  const channel = supabase
    .channel(`user_itineraries:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'itineraries',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newData = payload.new as any;
        const oldData = payload.old as any;
        onItineraryChange({
          type: 'itinerary_updated',
          itinerary_id: newData?.id || oldData?.id || '',
          user_id: userId,
          data: newData || oldData,
        });
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'itinerary_collaborators',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        const newData = payload.new as any;
        const oldData = payload.old as any;
        const itineraryId = newData?.itinerary_id || oldData?.itinerary_id;
        if (itineraryId) {
          onItineraryChange({
            type: 'itinerary_updated',
            itinerary_id: itineraryId,
            user_id: userId,
            data: { itinerary_id: itineraryId },
          });
        }
      },
    )
    .subscribe();

  return channel;
}

export function subscribeToSplitwiseChanges(
  groupId: string,
  onChange: RealtimeCallback<{ type: string; group_id: string; data: any }>,
): RealtimeChannel {
  const channel = supabase
    .channel(`splitwise:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'split_expenses',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        const newData = payload.new as any;
        const oldData = payload.old as any;
        onChange({
          type: payload.eventType === 'INSERT' ? 'expense_added' : payload.eventType === 'UPDATE' ? 'expense_updated' : 'expense_deleted',
          group_id: groupId,
          data: newData || oldData,
        });
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'split_payments',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        const newData = payload.new as any;
        const oldData = payload.old as any;
        onChange({
          type: payload.eventType === 'INSERT' ? 'payment_added' : payload.eventType === 'UPDATE' ? 'payment_updated' : 'payment_deleted',
          group_id: groupId,
          data: newData || oldData,
        });
      },
    )
    .subscribe();

  return channel;
}

export function unsubscribe(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}
