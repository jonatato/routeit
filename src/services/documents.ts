import { supabase } from '../lib/supabase';

export type ItineraryDocumentType =
  | 'passport'
  | 'flight'
  | 'hotel'
  | 'insurance'
  | 'ground_transport'
  | 'car_rental'
  | 'other';

export type ItineraryDocumentVisibility = 'public' | 'private';

export type ItineraryDocumentSubmissionStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

const DOCUMENT_DETAIL_FIELDS = {
  passport: {
    holder_name: 'text',
    nationality: 'text',
    issuing_country: 'text',
    document_number: 'text',
    date_of_birth: 'date',
    issued_on: 'date',
    expires_on: 'date',
  },
  flight: {
    passenger_name: 'text',
    airline: 'text',
    flight_number: 'text',
    departure_airport: 'text',
    arrival_airport: 'text',
    departure_at: 'datetime',
    arrival_at: 'datetime',
    terminal: 'text',
    gate: 'text',
    seat: 'text',
    travel_class: 'text',
  },
  hotel: {
    property_name: 'text',
    guest_name: 'text',
    address: 'text',
    check_in_on: 'date',
    check_out_on: 'date',
    room_type: 'text',
    board_type: 'text',
  },
  insurance: {
    provider: 'text',
    policy_number: 'text',
    insured_person: 'text',
    coverage_start_on: 'date',
    coverage_end_on: 'date',
    assistance_phone: 'text',
    emergency_contact: 'text',
  },
  ground_transport: {
    transport_mode: 'text',
    operator_name: 'text',
    passenger_name: 'text',
    departure_location: 'text',
    arrival_location: 'text',
    departure_at: 'datetime',
    arrival_at: 'datetime',
    seat: 'text',
  },
  car_rental: {
    company_name: 'text',
    driver_name: 'text',
    pickup_location: 'text',
    dropoff_location: 'text',
    pickup_at: 'datetime',
    dropoff_at: 'datetime',
    vehicle_type: 'text',
    confirmation_number: 'text',
  },
  other: {
    owner_name: 'text',
    issuer: 'text',
    valid_from_on: 'date',
    valid_until_on: 'date',
    notes: 'text',
  },
} as const;

const DOCUMENT_DETAIL_TABLES: Record<ItineraryDocumentType, string> = {
  passport: 'itinerary_document_passport_details',
  flight: 'itinerary_document_flight_details',
  hotel: 'itinerary_document_hotel_details',
  insurance: 'itinerary_document_insurance_details',
  ground_transport: 'itinerary_document_ground_transport_details',
  car_rental: 'itinerary_document_car_rental_details',
  other: 'itinerary_document_other_details',
};

type DocumentDetailFieldKind = 'text' | 'date' | 'datetime';

type DocumentDetailStateMap = {
  [K in ItineraryDocumentType]: {
    [Field in keyof (typeof DOCUMENT_DETAIL_FIELDS)[K]]: string | null;
  };
};

export type ItineraryDocumentDetailsByType = DocumentDetailStateMap;
export type ItineraryDocumentDetails = DocumentDetailStateMap[ItineraryDocumentType];

type DetailTarget = 'document' | 'submission';

type BaseItineraryDocument = {
  id: string;
  itinerary_id: string;
  user_id: string;
  type: ItineraryDocumentType;
  title: string;
  subtitle: string | null;
  reference: string | null;
  url: string;
  expiry_date: string | null;
  visibility: ItineraryDocumentVisibility;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type BaseItineraryDocumentSubmission = {
  id: string;
  itinerary_id: string;
  submitted_by: string;
  reviewed_by: string | null;
  approved_document_id: string | null;
  type: ItineraryDocumentType;
  title: string;
  subtitle: string | null;
  reference: string | null;
  url: string;
  expiry_date: string | null;
  target_visibility: 'public';
  status: ItineraryDocumentSubmissionStatus;
  review_note: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  deleted_at: string | null;
};

export type ItineraryDocument = BaseItineraryDocument & {
  details: ItineraryDocumentDetails | null;
};

export type ItineraryDocumentSubmission = BaseItineraryDocumentSubmission & {
  details: ItineraryDocumentDetails | null;
};

export type CreateItineraryDocumentInput = {
  itineraryId: string;
  type: ItineraryDocumentType;
  title: string;
  subtitle?: string;
  reference?: string;
  url: string;
  expiryDate?: string;
  visibility: ItineraryDocumentVisibility;
  details?: ItineraryDocumentDetails | null;
};

export type UpdateItineraryDocumentInput = {
  type?: ItineraryDocumentType;
  title?: string;
  subtitle?: string;
  reference?: string;
  url?: string;
  expiryDate?: string;
  visibility?: ItineraryDocumentVisibility;
  details?: ItineraryDocumentDetails | null;
};

export type CreateItineraryDocumentSubmissionInput = {
  itineraryId: string;
  type: ItineraryDocumentType;
  title: string;
  subtitle?: string;
  reference?: string;
  url: string;
  expiryDate?: string;
  details?: ItineraryDocumentDetails | null;
};

export const DOCUMENT_TYPE_OPTIONS: Array<{ value: ItineraryDocumentType; label: string }> = [
  { value: 'passport', label: 'Pasaporte' },
  { value: 'flight', label: 'Billete de avión' },
  { value: 'hotel', label: 'Reserva de hotel' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'ground_transport', label: 'Tren / bus / ferry' },
  { value: 'car_rental', label: 'Coche de alquiler' },
  { value: 'other', label: 'Otro' },
];

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

const toIsoDate = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const toIsoDateTime = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return parsed.toISOString();
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const formatDisplayDateTime = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const createEmptyDetailForType = <T extends ItineraryDocumentType>(
  type: T,
): ItineraryDocumentDetailsByType[T] => {
  const fields = DOCUMENT_DETAIL_FIELDS[type];
  const detail = {} as ItineraryDocumentDetailsByType[T];

  for (const key of Object.keys(fields) as Array<keyof typeof fields>) {
    detail[key] = null;
  }

  return detail;
};

export function createEmptyDocumentDetailsByType(): ItineraryDocumentDetailsByType {
  return {
    passport: createEmptyDetailForType('passport'),
    flight: createEmptyDetailForType('flight'),
    hotel: createEmptyDetailForType('hotel'),
    insurance: createEmptyDetailForType('insurance'),
    ground_transport: createEmptyDetailForType('ground_transport'),
    car_rental: createEmptyDetailForType('car_rental'),
    other: createEmptyDetailForType('other'),
  };
}

export function cloneDocumentDetailsForType<T extends ItineraryDocumentType>(
  type: T,
  details?: Partial<ItineraryDocumentDetailsByType[T]> | null,
): ItineraryDocumentDetailsByType[T] {
  return {
    ...createEmptyDetailForType(type),
    ...(details ?? {}),
  } as ItineraryDocumentDetailsByType[T];
}

export function getDocumentTypeLabel(type: ItineraryDocumentType) {
  return DOCUMENT_TYPE_OPTIONS.find(option => option.value === type)?.label ?? 'Documento';
}

export function getDocumentDetailSummary(
  type: ItineraryDocumentType,
  details?: ItineraryDocumentDetails | null,
): string[] {
  if (!details) return [];

  switch (type) {
    case 'passport': {
      const passportDetails = details as ItineraryDocumentDetailsByType['passport'];
      return [
        passportDetails.holder_name,
        passportDetails.document_number ? `Nº ${passportDetails.document_number}` : null,
        passportDetails.issuing_country,
        passportDetails.expires_on ? `Vence ${formatDisplayDate(passportDetails.expires_on)}` : null,
      ].filter((value): value is string => Boolean(value));
    }
    case 'flight': {
      const flightDetails = details as ItineraryDocumentDetailsByType['flight'];
      return [
        [flightDetails.airline, flightDetails.flight_number].filter(Boolean).join(' '),
        flightDetails.departure_airport && flightDetails.arrival_airport
          ? `${flightDetails.departure_airport} → ${flightDetails.arrival_airport}`
          : null,
        formatDisplayDateTime(flightDetails.departure_at),
        flightDetails.seat ? `Asiento ${flightDetails.seat}` : null,
      ].filter((value): value is string => Boolean(value));
    }
    case 'hotel': {
      const hotelDetails = details as ItineraryDocumentDetailsByType['hotel'];
      const stayRange = hotelDetails.check_in_on || hotelDetails.check_out_on
        ? [formatDisplayDate(hotelDetails.check_in_on), formatDisplayDate(hotelDetails.check_out_on)]
            .filter(Boolean)
            .join(' - ')
        : null;
      return [
        hotelDetails.property_name,
        stayRange,
        hotelDetails.guest_name,
        hotelDetails.room_type,
      ].filter((value): value is string => Boolean(value));
    }
    case 'insurance': {
      const insuranceDetails = details as ItineraryDocumentDetailsByType['insurance'];
      const coverageRange = insuranceDetails.coverage_start_on || insuranceDetails.coverage_end_on
        ? [formatDisplayDate(insuranceDetails.coverage_start_on), formatDisplayDate(insuranceDetails.coverage_end_on)]
            .filter(Boolean)
            .join(' - ')
        : null;
      return [
        insuranceDetails.provider,
        insuranceDetails.policy_number ? `Póliza ${insuranceDetails.policy_number}` : null,
        coverageRange,
        insuranceDetails.assistance_phone,
      ].filter((value): value is string => Boolean(value));
    }
    case 'ground_transport': {
      const groundDetails = details as ItineraryDocumentDetailsByType['ground_transport'];
      return [
        [groundDetails.transport_mode, groundDetails.operator_name].filter(Boolean).join(' · '),
        groundDetails.departure_location && groundDetails.arrival_location
          ? `${groundDetails.departure_location} → ${groundDetails.arrival_location}`
          : null,
        formatDisplayDateTime(groundDetails.departure_at),
        groundDetails.seat ? `Asiento ${groundDetails.seat}` : null,
      ].filter((value): value is string => Boolean(value));
    }
    case 'car_rental': {
      const carDetails = details as ItineraryDocumentDetailsByType['car_rental'];
      return [
        carDetails.company_name,
        carDetails.pickup_location && carDetails.dropoff_location
          ? `${carDetails.pickup_location} → ${carDetails.dropoff_location}`
          : null,
        formatDisplayDateTime(carDetails.pickup_at),
        carDetails.vehicle_type,
      ].filter((value): value is string => Boolean(value));
    }
    case 'other': {
      const otherDetails = details as ItineraryDocumentDetailsByType['other'];
      return [
        otherDetails.issuer,
        otherDetails.owner_name,
        otherDetails.valid_until_on ? `Válido hasta ${formatDisplayDate(otherDetails.valid_until_on)}` : null,
      ].filter((value): value is string => Boolean(value));
    }
    default:
      return [];
  }
}

function normalizeDetailValue(kind: DocumentDetailFieldKind, value: string | null | undefined) {
  if (kind === 'date') return toIsoDate(value);
  if (kind === 'datetime') return toIsoDateTime(value);
  return normalizeOptional(value ?? undefined);
}

function normalizeDetailsPayload(type: ItineraryDocumentType, details?: ItineraryDocumentDetails | null) {
  const fields = DOCUMENT_DETAIL_FIELDS[type];
  const normalized = {} as Record<string, string | null>;
  const detailValues = (details ?? {}) as Record<string, string | null | undefined>;

  for (const [fieldName, kind] of Object.entries(fields) as Array<[string, DocumentDetailFieldKind]>) {
    normalized[fieldName] = normalizeDetailValue(kind, detailValues[fieldName]);
  }

  return normalized;
}

function hasMeaningfulDetailValues(payload: Record<string, string | null>) {
  return Object.values(payload).some(value => value !== null);
}

async function fetchDetailMaps(target: DetailTarget, ids: string[]) {
  const targetKey = target === 'document' ? 'document_id' : 'submission_id';
  const emptyMaps = {
    passport: new Map<string, ItineraryDocumentDetailsByType['passport']>(),
    flight: new Map<string, ItineraryDocumentDetailsByType['flight']>(),
    hotel: new Map<string, ItineraryDocumentDetailsByType['hotel']>(),
    insurance: new Map<string, ItineraryDocumentDetailsByType['insurance']>(),
    ground_transport: new Map<string, ItineraryDocumentDetailsByType['ground_transport']>(),
    car_rental: new Map<string, ItineraryDocumentDetailsByType['car_rental']>(),
    other: new Map<string, ItineraryDocumentDetailsByType['other']>(),
  };

  if (ids.length === 0) {
    return emptyMaps;
  }

  await Promise.all(
    (Object.entries(DOCUMENT_DETAIL_TABLES) as Array<[ItineraryDocumentType, string]>).map(async ([type, table]) => {
      const { data, error } = await supabase.from(table).select('*').in(targetKey, ids);
      if (error) throw error;

      for (const row of data ?? []) {
        const detail = cloneDocumentDetailsForType(type, row as ItineraryDocumentDetailsByType[typeof type]);
        const detailId = row[targetKey as keyof typeof row];
        if (typeof detailId === 'string') {
          emptyMaps[type].set(detailId, detail);
        }
      }
    }),
  );

  return emptyMaps;
}

async function hydrateDocumentRows(rows: BaseItineraryDocument[]): Promise<ItineraryDocument[]> {
  const detailMaps = await fetchDetailMaps(
    'document',
    rows.map(row => row.id),
  );

  return rows.map(row => ({
    ...row,
    details: detailMaps[row.type].get(row.id) ?? null,
  }));
}

async function hydrateSubmissionRows(
  rows: BaseItineraryDocumentSubmission[],
): Promise<ItineraryDocumentSubmission[]> {
  const detailMaps = await fetchDetailMaps(
    'submission',
    rows.map(row => row.id),
  );

  return rows.map(row => ({
    ...row,
    details: detailMaps[row.type].get(row.id) ?? null,
  }));
}

async function removeDetailsForOtherTypes(target: DetailTarget, id: string, keepType: ItineraryDocumentType) {
  const targetKey = target === 'document' ? 'document_id' : 'submission_id';

  await Promise.all(
    (Object.entries(DOCUMENT_DETAIL_TABLES) as Array<[ItineraryDocumentType, string]>)
      .filter(([type]) => type !== keepType)
      .map(async ([, table]) => {
        const { error } = await supabase.from(table).delete().eq(targetKey, id);
        if (error) throw error;
      }),
  );
}

async function upsertDetails(target: DetailTarget, id: string, type: ItineraryDocumentType, details?: ItineraryDocumentDetails | null) {
  const targetKey = target === 'document' ? 'document_id' : 'submission_id';
  const table = DOCUMENT_DETAIL_TABLES[type];
  const payload = normalizeDetailsPayload(type, details);

  if (!hasMeaningfulDetailValues(payload)) {
    const { error } = await supabase.from(table).delete().eq(targetKey, id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from(table)
    .upsert({ [targetKey]: id, ...payload }, { onConflict: targetKey });

  if (error) throw error;
}

async function getItineraryDocumentById(id: string): Promise<ItineraryDocument> {
  const { data, error } = await supabase
    .from('itinerary_documents')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  const [document] = await hydrateDocumentRows([data as BaseItineraryDocument]);
  return document;
}

export async function listItineraryDocuments(itineraryId: string): Promise<ItineraryDocument[]> {
  return listItineraryDocumentsByVisibility(itineraryId);
}

export async function listItineraryDocumentsByVisibility(
  itineraryId: string,
  visibility?: ItineraryDocumentVisibility,
): Promise<ItineraryDocument[]> {
  let query = supabase
    .from('itinerary_documents')
    .select('*')
    .eq('itinerary_id', itineraryId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (visibility) {
    query = query.eq('visibility', visibility);
  }

  const { data, error } = await query;

  if (error) throw error;
  return hydrateDocumentRows((data ?? []) as BaseItineraryDocument[]);
}

export async function listItineraryDocumentSubmissions(
  itineraryId: string,
  status?: ItineraryDocumentSubmissionStatus,
): Promise<ItineraryDocumentSubmission[]> {
  let query = supabase
    .from('itinerary_document_submissions')
    .select('*')
    .eq('itinerary_id', itineraryId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return hydrateSubmissionRows((data ?? []) as BaseItineraryDocumentSubmission[]);
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
    visibility: input.visibility,
  };

  const { data, error } = await supabase
    .from('itinerary_documents')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  const createdDocument = data as BaseItineraryDocument;

  try {
    await removeDetailsForOtherTypes('document', createdDocument.id, input.type);
    await upsertDetails('document', createdDocument.id, input.type, input.details);
  } catch (detailError) {
    await deleteItineraryDocument(createdDocument.id).catch(cleanupError => {
      console.error('Error cleaning up document after detail failure:', cleanupError);
    });
    throw detailError;
  }

  return getItineraryDocumentById(createdDocument.id);
}

export async function updateItineraryDocument(
  id: string,
  patch: UpdateItineraryDocumentInput,
): Promise<ItineraryDocument> {
  const { data: currentRow, error: currentError } = await supabase
    .from('itinerary_documents')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (currentError) throw currentError;

  const current = currentRow as BaseItineraryDocument;
  const payload: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  const nextType = patch.type ?? current.type;

  if (patch.type !== undefined) payload.type = patch.type;
  if (patch.title !== undefined) payload.title = patch.title.trim();
  if (patch.subtitle !== undefined) payload.subtitle = normalizeOptional(patch.subtitle) ?? null;
  if (patch.reference !== undefined) payload.reference = normalizeOptional(patch.reference) ?? null;
  if (patch.url !== undefined) payload.url = patch.url.trim();
  if (patch.expiryDate !== undefined) payload.expiry_date = normalizeOptional(patch.expiryDate) ?? null;
  if (patch.visibility !== undefined) payload.visibility = patch.visibility;

  const { data, error } = await supabase
    .from('itinerary_documents')
    .update(payload)
    .eq('id', id)
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) throw error;

  if (current.type !== nextType) {
    await removeDetailsForOtherTypes('document', id, nextType);
  }

  if (patch.details !== undefined || current.type !== nextType) {
    await upsertDetails('document', id, nextType, patch.details ?? null);
    await removeDetailsForOtherTypes('document', id, nextType);
  }

  return getItineraryDocumentById((data as BaseItineraryDocument).id);
}

export async function submitItineraryDocumentForReview(
  input: CreateItineraryDocumentSubmissionInput,
): Promise<ItineraryDocumentSubmission> {
  const userId = await requireUserId();

  const payload = {
    itinerary_id: input.itineraryId,
    submitted_by: userId,
    type: input.type,
    title: input.title.trim(),
    subtitle: normalizeOptional(input.subtitle),
    reference: normalizeOptional(input.reference),
    url: input.url.trim(),
    expiry_date: normalizeOptional(input.expiryDate),
    target_visibility: 'public' as const,
    status: 'pending' as const,
  };

  const { data, error } = await supabase
    .from('itinerary_document_submissions')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  const createdSubmission = data as BaseItineraryDocumentSubmission;

  try {
    await removeDetailsForOtherTypes('submission', createdSubmission.id, input.type);
    await upsertDetails('submission', createdSubmission.id, input.type, input.details);
  } catch (detailError) {
    await cancelItineraryDocumentSubmission(createdSubmission.id).catch(cleanupError => {
      console.error('Error cleaning up submission after detail failure:', cleanupError);
    });
    throw detailError;
  }

  const [submission] = await hydrateSubmissionRows([createdSubmission]);
  return submission;
}

export async function approveItineraryDocumentSubmission(
  submissionId: string,
  note?: string,
): Promise<ItineraryDocument> {
  const { data, error } = await supabase.rpc('approve_itinerary_document_submission', {
    submission_uuid: submissionId,
    note: normalizeOptional(note) ?? null,
  });

  if (error) throw error;
  return getItineraryDocumentById((data as BaseItineraryDocument).id);
}

export async function rejectItineraryDocumentSubmission(
  submissionId: string,
  note?: string,
): Promise<ItineraryDocumentSubmission> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('itinerary_document_submissions')
    .update({
      status: 'rejected',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_note: normalizeOptional(note) ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) throw error;
  const [submission] = await hydrateSubmissionRows([data as BaseItineraryDocumentSubmission]);
  return submission;
}

export async function cancelItineraryDocumentSubmission(
  submissionId: string,
): Promise<ItineraryDocumentSubmission> {
  const { data, error } = await supabase
    .from('itinerary_document_submissions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) throw error;
  const [submission] = await hydrateSubmissionRows([data as BaseItineraryDocumentSubmission]);
  return submission;
}

export async function deleteItineraryDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('itinerary_documents')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw error;
}
