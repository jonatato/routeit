import { supabase } from '../lib/supabase';

export interface WidgetPref {
  id?: string;
  widget_key: string;
  order_index: number;
  is_visible: boolean;
  is_pinned?: boolean;
  is_collapsed?: boolean;
  settings?: Record<string, any>;
}

const localKey = (userId: string | null, itineraryId: string | null) => `routeit:widgets:${userId ?? 'anon'}:${itineraryId ?? 'global'}`;

export async function fetchUserWidgetPreferences(itineraryId?: string | null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

    if (!userId) {
      // fallback to localStorage
      const raw = localStorage.getItem(localKey(userId, itineraryId ?? null));
      return raw ? JSON.parse(raw) as WidgetPref[] : null;
    }

    const query = supabase
      .from('user_widget_preferences')
      .select('*')
      .eq('user_id', userId);

    if (itineraryId) {
      query.eq('itinerary_id', itineraryId);
    } else {
      query.is('itinerary_id', null);
    }

    const { data, error } = await query.order('order_index', { ascending: true });
    if (error) throw error;

    return data as WidgetPref[];
  } catch (error) {
    console.warn('Could not load widget preferences from Supabase, falling back to localStorage', error);
    const raw = localStorage.getItem(localKey(null, itineraryId ?? null));
    return raw ? JSON.parse(raw) as WidgetPref[] : null;
  }
}

export async function saveUserWidgetPreferences(prefs: WidgetPref[], itineraryId?: string | null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

    // If no supabase user, save locally
    if (!userId) {
      localStorage.setItem(localKey(userId, itineraryId ?? null), JSON.stringify(prefs));
      return;
    }

    // Upsert each pref
    const toUpsert = prefs.map((p) => ({
      user_id: userId,
      itinerary_id: itineraryId ?? null,
      widget_key: p.widget_key,
      order_index: p.order_index,
      is_visible: p.is_visible,
      is_pinned: p.is_pinned ?? false,
      is_collapsed: p.is_collapsed ?? false,
      settings: p.settings ?? {}
    }));

    const { data, error } = await supabase
      .from('user_widget_preferences')
      .upsert(toUpsert, { onConflict: 'user_id,itinerary_id,widget_key' });

    if (error) throw error;

    return (data ?? []) as any[];
  } catch (error) {
    console.warn('Could not save widget preferences to Supabase, falling back to localStorage', error);
    localStorage.setItem(localKey(null, itineraryId ?? null), JSON.stringify(prefs));
  }
}
