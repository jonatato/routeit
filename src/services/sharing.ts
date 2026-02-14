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
  // Verificar que el userId coincide con el usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error('No autorizado');
  }

  const [owned, shared] = await Promise.all([
    supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
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
      const itineraries = row.itineraries as {
        id: string;
        title: string;
        date_range: string;
        user_id: string;
        deleted_at: string | null;
      } | {
        id: string;
        title: string;
        date_range: string;
        user_id: string;
        deleted_at: string | null;
      }[] | null;
      if (!itineraries) return null;
      const itinerary = Array.isArray(itineraries) ? itineraries[0] : itineraries;
      if (!itinerary || itinerary.deleted_at) return null; // Filtrar eliminados
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
  // Primero obtener los colaboradores que ya aceptaron
  const { data: acceptedCollabs, error: collabError } = await supabase
    .from('itinerary_collaborators')
    .select('id, user_id, user_email, role, created_at')
    .eq('itinerary_id', itineraryId)
    .order('created_at', { ascending: true });
  
  if (collabError) throw collabError;
  
  // Obtener los enlaces pendientes
  const { data: pendingLinks, error: linksError } = await supabase
    .from('itinerary_share_links')
    .select('id, token, role, created_at, expires_at')
    .eq('itinerary_id', itineraryId)
    .order('created_at', { ascending: true });
  
  if (linksError) throw linksError;
  
  // Para cada colaborador aceptado, usar el email guardado
  const collaboratorsWithInfo = (acceptedCollabs ?? []).map((collab) => {
    const email = collab.user_email || collab.user_id; // Fallback al user_id si no hay email
    
    return {
      ...collab,
      identifier: email,
      email: email,
      has_accepted: true,
      is_pending: false,
    };
  });
  
  // Agregar enlaces pendientes
  const pendingCollaborators = (pendingLinks ?? [])
    .filter(link => !link.expires_at || new Date(link.expires_at) > new Date())
    .map(link => ({
      id: link.id,
      user_id: link.token,
      user_email: '',
      role: link.role,
      created_at: link.created_at,
      identifier: 'Invitación pendiente',
      email: '',
      has_accepted: false,
      is_pending: true,
      token: link.token,
    }));
  
  return [...collaboratorsWithInfo, ...pendingCollaborators];
}

export async function removeCollaborator(collaboratorId: string) {
  const { error } = await supabase.from('itinerary_collaborators').delete().eq('id', collaboratorId);
  if (error) throw error;
}

export async function deleteItinerary(itineraryId: string, userId: string): Promise<void> {
  // Verificar que el userId coincide con el usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error('No autorizado');
  }

  // Verificar que el usuario es el owner del itinerario
  const { data: itinerary, error: fetchError } = await supabase
    .from('itineraries')
    .select('user_id')
    .eq('id', itineraryId)
    .single();

  if (fetchError) throw fetchError;
  if (!itinerary || itinerary.user_id !== userId) {
    throw new Error('No tienes permisos para eliminar este itinerario.');
  }

  // Borrado lógico: marcar como eliminado
  const { error } = await supabase
    .from('itineraries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', itineraryId);

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
  if (!data || data.length === 0) {
    throw new Error('Token invalido o expirado.');
  }
  return data as Array<{ itinerary_id: string; role: CollaboratorRole }>;
}
