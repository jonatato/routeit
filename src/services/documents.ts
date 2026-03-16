import { supabase } from '../lib/supabase';

export type ItineraryDocumentType = 'passport' | 'flight' | 'hotel' | 'insurance' | 'other';

export type ItineraryDocument = {
  id: string;
  itinerary_id: string;
  user_id: string;
  type: ItineraryDocumentType;
  title: string;
  subtitle: string | null;
  reference: string | null;
  url: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateItineraryDocumentInput = {
  itineraryId: string;
  type: ItineraryDocumentType;
  title: string;
  subtitle?: string;
  reference?: string;
  url: string;
  expiryDate?: string;
};

export type UpdateItineraryDocumentInput = {
  type?: ItineraryDocumentType;
  title?: string;
  subtitle?: string;
  reference?: string;
  url?: string;
  expiryDate?: string;
};

async function requireUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user.id;
}

const normalizeOptional = (value?: string) => {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function listItineraryDocuments(itineraryId: string): Promise<ItineraryDocument[]> {
  const { data, error } = await supabase
    .from('itinerary_documents')
    .select('*')
    .eq('itinerary_id', itineraryId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ItineraryDocument[];
}

export async function createItineraryDocument(
  input: CreateItineraryDocumentInput,
): Promise<ItineraryDocument> {
  const userId = await requireUserId();

  const payload = {
    itinerary_id: input.itineraryId,
    user_id: userId,
    type: input.type,
    title: input.title.trim(),
    subtitle: normalizeOptional(input.subtitle),
    reference: normalizeOptional(input.reference),
    url: input.url.trim(),
    expiry_date: normalizeOptional(input.expiryDate),
  };

  const { data, error } = await supabase
    .from('itinerary_documents')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data as ItineraryDocument;
}

export async function updateItineraryDocument(
  id: string,
  patch: UpdateItineraryDocumentInput,
): Promise<ItineraryDocument> {
  const payload: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.type !== undefined) payload.type = patch.type;
  if (patch.title !== undefined) payload.title = patch.title.trim();
  if (patch.subtitle !== undefined) payload.subtitle = normalizeOptional(patch.subtitle) ?? null;
  if (patch.reference !== undefined) payload.reference = normalizeOptional(patch.reference) ?? null;
  if (patch.url !== undefined) payload.url = patch.url.trim();
  if (patch.expiryDate !== undefined) payload.expiry_date = normalizeOptional(patch.expiryDate) ?? null;

  const { data, error } = await supabase
    .from('itinerary_documents')
    .update(payload)
    .eq('id', id)
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) throw error;
  return data as ItineraryDocument;
}

export async function deleteItineraryDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('itinerary_documents')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw error;
}
