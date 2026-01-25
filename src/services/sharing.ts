import { supabase } from '../lib/supabase';

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export type ItinerarySummary = {
  id: string;
  title: string;
  dateRange: string;
  ownerId: string;
  role: CollaboratorRole;
};

const mapItinerarySummary = (row: {
  id: string;
  title: string;
  date_range: string;
  user_id: string;
  role?: CollaboratorRole;
}): ItinerarySummary => ({
  id: row.id,
  title: row.title,
  dateRange: row.date_range,
  ownerId: row.user_id,
  role: row.role ?? 'owner',
});

export async function listUserItineraries(userId: string): Promise<ItinerarySummary[]> {
  const [owned, shared] = await Promise.all([
    supabase.from('itineraries').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase
      .from('itinerary_collaborators')
      .select('role, itineraries(*)')
      .eq('user_id', userId),
  ]);
  if (owned.error) throw owned.error;
  if (shared.error) throw shared.error;

  const ownedRows = (owned.data ?? []).map(row =>
    mapItinerarySummary({
      id: row.id,
      title: row.title,
      date_range: row.date_range,
      user_id: row.user_id,
      role: 'owner',
    }),
  );

  const sharedRows = (shared.data ?? [])
    .map(row => {
      const itinerary = row.itineraries as {
        id: string;
        title: string;
        date_range: string;
        user_id: string;
      } | null;
      if (!itinerary) return null;
      return mapItinerarySummary({
        id: itinerary.id,
        title: itinerary.title,
        date_range: itinerary.date_range,
        user_id: itinerary.user_id,
        role: row.role as CollaboratorRole,
      });
    })
    .filter(Boolean) as ItinerarySummary[];

  const merged = [...ownedRows, ...sharedRows];
  const byId = new Map<string, ItinerarySummary>();
  merged.forEach(item => {
    byId.set(item.id, item);
  });
  return Array.from(byId.values());
}

export async function listCollaborators(itineraryId: string) {
  const { data, error } = await supabase
    .from('itinerary_collaborators')
    .select('id, user_id, role, created_at')
    .eq('itinerary_id', itineraryId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function removeCollaborator(collaboratorId: string) {
  const { error } = await supabase.from('itinerary_collaborators').delete().eq('id', collaboratorId);
  if (error) throw error;
}

export async function createShareLink(itineraryId: string, role: CollaboratorRole, expiresAt?: string) {
  const token = crypto.randomUUID();
  const { data, error } = await supabase
    .from('itinerary_share_links')
    .insert({ itinerary_id: itineraryId, token, role, expires_at: expiresAt ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function acceptShareLink(token: string) {
  const { data, error } = await supabase.rpc('accept_share_link', { token_text: token });
  if (error) throw error;
  return data as Array<{ itinerary_id: string; role: CollaboratorRole }>;
}
