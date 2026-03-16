import { supabase } from '../lib/supabase';

export type SectionPreference = {
  id: string;
  user_id: string;
  section_key: string;
  section_label: string;
  order_index: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_SECTIONS = [
  { key: 'overview', label: 'Resumen rápido' },
  { key: 'map', label: 'Mapa interactivo' },
  { key: 'itinerary', label: 'Itinerario' },
  { key: 'documents', label: 'Documentos importantes' },
  { key: 'foods', label: 'Comidas típicas' },
  { key: 'budget', label: 'Presupuesto' },
] as const;

async function ensureMissingDefaultSections(userId: string, existing: SectionPreference[]) {
  const existingKeys = new Set(existing.map(pref => pref.section_key));
  const missing = DEFAULT_SECTIONS.filter(section => !existingKeys.has(section.key));
  if (missing.length === 0) {
    return existing;
  }

  const maxOrder = existing.reduce((max, pref) => Math.max(max, pref.order_index), -1);
  const inserts = missing.map((section, index) => ({
    user_id: userId,
    section_key: section.key,
    section_label: section.label,
    order_index: maxOrder + index + 1,
    is_visible: true,
  }));

  const { data: created, error } = await supabase
    .from('itinerary_section_preferences')
    .insert(inserts)
    .select('*');

  if (error) throw error;

  return [...existing, ...((created ?? []) as SectionPreference[])].sort(
    (left, right) => left.order_index - right.order_index,
  );
}

export async function fetchSectionPreferences() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('itinerary_section_preferences')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('order_index', { ascending: true });

  if (error) throw error;

  // Si no hay preferencias, crear las por defecto
  if (!data || data.length === 0) {
    return await initializeDefaultPreferences(user.id);
  }

  return await ensureMissingDefaultSections(user.id, data as SectionPreference[]);
}

export async function initializeDefaultPreferences(userId: string) {
  const preferences = DEFAULT_SECTIONS.map((section, index) => ({
    user_id: userId,
    section_key: section.key,
    section_label: section.label,
    order_index: index,
    is_visible: true,
  }));

  const { data, error } = await supabase
    .from('itinerary_section_preferences')
    .insert(preferences)
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data as SectionPreference[];
}

export async function updateSectionPreferences(preferences: Array<{ id: string; order_index: number; is_visible: boolean }>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Actualizar todas las preferencias en una transacción
  const updates = preferences.map(pref =>
    supabase
      .from('itinerary_section_preferences')
      .update({
        order_index: pref.order_index,
        is_visible: pref.is_visible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pref.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
  );

  const results = await Promise.all(updates);
  const errors = results.filter(r => r.error);
  
  if (errors.length > 0) {
    throw new Error('Error updating preferences');
  }
}

export async function toggleSectionVisibility(sectionId: string, isVisible: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('itinerary_section_preferences')
    .update({
      is_visible: isVisible,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sectionId)
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (error) throw error;
}
