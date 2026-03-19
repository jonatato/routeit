import type { TravelItinerary } from '../data/itinerary';
import { supabase } from '../lib/supabase';
import { parseItineraryDate } from '../utils/itineraryDates';
import {
  buildSeedPayloads,
  mapDbToItinerary,
  type DbBudgetTier,
  type DbDay,
  type DbDayNote,
  type DbDayTag,
  type DbFlight,
  type DbFlightSegment,
  type DbItinerary,
  type DbItineraryList,
  type DbItineraryListItem,
  type DbLocation,
  type DbPhrase,
  type DbRoute,
  type DbScheduleItem,
  type DbScheduleItemTag,
  type DbTag,
} from './itineraryMapper';

const toIsoDate = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = parseItineraryDate(trimmed);
  if (!parsed) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).toISOString().slice(0, 10);
};

const formatRangeLabel = (startDate: string | null, endDate: string | null, fallback = '') => {
  if (!startDate && !endDate) return fallback;
  const format = (value: string) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  if (startDate && endDate) return `${format(startDate)} - ${format(endDate)}`;
  if (startDate) return format(startDate);
  return format(endDate!);
};

const isMissingScheduleDocumentRelationColumn = (error: { message?: string } | null | undefined) =>
  Boolean(error?.message?.includes('related_document_id'));

const resolveDateFields = (input: { startDate?: string; endDate?: string; dateRange?: string }) => {
  let startDate = toIsoDate(input.startDate);
  let endDate = toIsoDate(input.endDate);

  if ((!startDate || !endDate) && input.dateRange) {
    const parts = input.dateRange.split(/\s*(?:-|–|—|→|a)\s*/).filter(Boolean);
    const first = parts[0] ? toIsoDate(parts[0]) : null;
    const last = parts.length > 1 ? toIsoDate(parts[parts.length - 1]) : first;
    startDate = startDate ?? first;
    endDate = endDate ?? last;
  }

  return {
    startDate,
    endDate,
    dateRange: formatRangeLabel(startDate, endDate, input.dateRange ?? ''),
  };
};

async function hasActiveLinkedExpense(expenseId?: string | null): Promise<boolean> {
  if (!expenseId) return false;

  const { data, error } = await supabase
    .from('split_expenses')
    .select('id, deleted_at')
    .eq('id', expenseId)
    .maybeSingle();

  if (error) {
    console.error('Error verificando enlace de gasto en actividad:', error);
    return false;
  }

  return Boolean(data && !data.deleted_at);
}

async function fetchSingleItinerary(userId: string) {
  // Obtener todos los itinerarios propios
  const { data: owned, error: ownedError } = await supabase
    .from('itineraries')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null);
  if (ownedError) throw ownedError;

  // Obtener todos los itinerarios compartidos
  const { data: shared, error: sharedError } = await supabase
    .from('itinerary_collaborators')
    .select('itinerary_id, itineraries(*)')
    .eq('user_id', userId)
    .is('deleted_at', null);
  if (sharedError) throw sharedError;

  // Mapear todos los itinerarios con sus fechas de actualización
  const allItineraries: DbItinerary[] = [];

  // Agregar itinerarios propios
  if (owned && owned.length > 0) {
    allItineraries.push(...(owned as DbItinerary[]));
  }

  // Agregar itinerarios compartidos
  if (shared && shared.length > 0) {
    for (const item of shared) {
      if (item.itineraries && !Array.isArray(item.itineraries)) {
        const itinerary = item.itineraries as DbItinerary;
        if (!itinerary.deleted_at) {
          allItineraries.push(itinerary);
        }
      }
    }
  }

  // Si no hay itinerarios, retornar null
  if (allItineraries.length === 0) return null;

  // Ordenar por updated_at o created_at (el más reciente primero)
  allItineraries.sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
    const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
    return dateB - dateA; // Más reciente primero
  });

  // Retornar el más reciente
  return allItineraries[0];
}

async function fetchItineraryData(itinerary: DbItinerary): Promise<TravelItinerary> {
  const days = await supabase.from('days').select('*').eq('itinerary_id', itinerary.id).is('deleted_at', null);
  if (days.error) throw days.error;
  const dayIds = (days.data as DbDay[]).map(day => day.id);

  const lists = await supabase.from('itinerary_lists').select('*').eq('itinerary_id', itinerary.id).is('deleted_at', null);
  if (lists.error) throw lists.error;
  const listIds = (lists.data as DbItineraryList[]).map(list => list.id);

  const scheduleItems =
    dayIds.length > 0
      ? await supabase.from('schedule_items').select('*').in('day_id', dayIds).is('deleted_at', null)
      : await supabase.from('schedule_items').select('*').limit(0);
  if (scheduleItems.error) throw scheduleItems.error;
  const scheduleItemIds = (scheduleItems.data as DbScheduleItem[]).map(item => item.id);

  const [
    dayNotes,
    tags,
    dayTags,
    scheduleItemTags,
    locations,
    routes,
    flights,
    listItems,
    phrases,
    budgetTiers,
  ] = await Promise.all([
    dayIds.length > 0
      ? supabase.from('day_notes').select('*').in('day_id', dayIds).is('deleted_at', null)
      : supabase.from('day_notes').select('*').limit(0),
    supabase.from('tags').select('*').eq('itinerary_id', itinerary.id).is('deleted_at', null),
    dayIds.length > 0
      ? supabase.from('day_tags').select('*').in('day_id', dayIds).is('deleted_at', null)
      : supabase.from('day_tags').select('*').limit(0),
    scheduleItemIds.length > 0
      ? supabase.from('schedule_item_tags').select('*').in('schedule_item_id', scheduleItemIds).is('deleted_at', null)
      : supabase.from('schedule_item_tags').select('*').limit(0),
    supabase.from('locations').select('*').eq('itinerary_id', itinerary.id).is('deleted_at', null),
    supabase.from('routes').select('*').eq('itinerary_id', itinerary.id).is('deleted_at', null),
    supabase.from('flights').select('*').eq('itinerary_id', itinerary.id).is('deleted_at', null),
    listIds.length > 0
      ? supabase.from('itinerary_list_items').select('*').in('list_id', listIds).is('deleted_at', null)
      : supabase.from('itinerary_list_items').select('*').limit(0),
    supabase.from('phrases').select('*').eq('itinerary_id', itinerary.id).is('deleted_at', null),
    supabase.from('budget_tiers').select('*').eq('itinerary_id', itinerary.id).is('deleted_at', null),
  ]);

  if (
    days.error ||
    dayNotes.error ||
    tags.error ||
    dayTags.error ||
    scheduleItemTags.error ||
    locations.error ||
    routes.error ||
    flights.error ||
    lists.error ||
    listItems.error ||
    phrases.error ||
    budgetTiers.error
  ) {
    throw (
      days.error ||
      dayNotes.error ||
      tags.error ||
      dayTags.error ||
      scheduleItemTags.error ||
      locations.error ||
      routes.error ||
      flights.error ||
      lists.error ||
      listItems.error ||
      phrases.error ||
      budgetTiers.error
    );
  }

  const flightIds = (flights.data as DbFlight[]).map(flight => flight.id);
  const flightSegments = flightIds.length > 0
    ? await supabase.from('flight_segments').select('*').in('flight_id', flightIds).is('deleted_at', null)
    : await supabase.from('flight_segments').select('*').limit(0);
  if (flightSegments.error) throw flightSegments.error;

  return mapDbToItinerary({
    itinerary,
    days: days.data as DbDay[],
    scheduleItems: scheduleItems.data as DbScheduleItem[],
    dayNotes: dayNotes.data as DbDayNote[],
    tags: tags.data as DbTag[],
    dayTags: dayTags.data as DbDayTag[],
    scheduleItemTags: scheduleItemTags.data as DbScheduleItemTag[],
    locations: locations.data as DbLocation[],
    routes: routes.data as DbRoute[],
    flights: flights.data as DbFlight[],
    flightSegments: flightSegments.data as DbFlightSegment[],
    lists: lists.data as DbItineraryList[],
    listItems: listItems.data as DbItineraryListItem[],
    phrases: phrases.data as DbPhrase[],
    budgetTiers: budgetTiers.data as DbBudgetTier[],
  });
}

export async function fetchUserItinerary(userId: string): Promise<TravelItinerary | null> {
  const itinerary = await fetchSingleItinerary(userId);
  if (!itinerary) return null;

  return fetchItineraryData(itinerary);
}

export async function fetchItineraryById(itineraryId: string): Promise<TravelItinerary | null> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', itineraryId)
    .is('deleted_at', null)
    .single();
  if (error) throw error;
  if (!data) return null;
  return fetchItineraryData(data as DbItinerary);
}

async function getUserRole(userId: string, itineraryId: string): Promise<string | null> {
  const { data: owner } = await supabase
    .from('itineraries')
    .select('id')
    .eq('id', itineraryId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();
  if (owner) return 'owner';
  const { data: collaborator, error } = await supabase
    .from('itinerary_collaborators')
    .select('role')
    .eq('itinerary_id', itineraryId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return collaborator?.role ?? null;
}

export type ItineraryUserRole = 'owner' | 'editor' | 'viewer';

export function canEditItineraryRole(role: string | null | undefined): role is 'owner' | 'editor' {
  return role === 'owner' || role === 'editor';
}

export async function checkUserRole(userId: string, itineraryId: string): Promise<string | null> {
  return getUserRole(userId, itineraryId);
}

export async function createEmptyItinerary(userId: string, title: string, startDateInput: string, endDateInput: string): Promise<string> {
  const resolved = resolveDateFields({ startDate: startDateInput, endDate: endDateInput });
  const { data: created, error } = await supabase
    .from('itineraries')
    .insert({
      user_id: userId,
      title,
      date_range: resolved.dateRange,
      start_date: resolved.startDate,
      end_date: resolved.endDate,
      intro: 'Crea tu itinerario personalizado desde cero.',
    })
    .select('id')
    .single();

  if (error || !created) {
    throw error ?? new Error('No se pudo crear el itinerario.');
  }

  return created.id as string;
}

async function createItineraryAndSeed(userId: string, base: TravelItinerary): Promise<TravelItinerary> {
  const resolvedDates = resolveDateFields({
    startDate: base.startDate,
    endDate: base.endDate,
    dateRange: base.dateRange,
  });

  const { data: created, error } = await supabase
    .from('itineraries')
    .insert({
      user_id: userId,
      title: base.title,
      date_range: resolvedDates.dateRange,
      start_date: resolvedDates.startDate,
      end_date: resolvedDates.endDate,
      intro: base.intro,
      cover_image: base.coverImage,
    })
    .select('*')
    .single();

  if (error || !created) {
    throw error ?? new Error('No se pudo crear el itinerario.');
  }

  const itineraryId = created.id as string;
  const seed = buildSeedPayloads(base, itineraryId);

  const dayIdByOrder = new Map<number, string>();
  if (seed.days.length > 0) {
    const { data: insertedDays, error: daysError } = await supabase
      .from('days')
      .insert(seed.days)
      .select('*');
    if (daysError) throw daysError;
    (insertedDays as DbDay[]).forEach(day => {
      dayIdByOrder.set(day.order_index, day.id);
    });
  }

  const schedulePayload = seed.scheduleItems
    .map(item => ({
      day_id: dayIdByOrder.get(item.dayOrder) ?? '',
      time: item.time,
      activity: item.activity,
      link: item.link ?? null,
      map_link: item.map_link ?? null,
      lat: item.lat,
      lng: item.lng,
      order_index: item.order_index,
      cost: item.cost,
      cost_currency: item.cost_currency,
      cost_payer_id: item.cost_payer_id,
      cost_split_expense_id: item.cost_split_expense_id,
      related_document_id: item.related_document_id,
    }))
    .filter(item => item.day_id);
  const notePayload = seed.dayNotes
    .map(item => ({
      day_id: dayIdByOrder.get(item.dayOrder) ?? '',
      note: item.note,
      order_index: item.order_index,
    }))
    .filter(item => item.day_id);

  let insertedScheduleItems: DbScheduleItem[] = [];
  if (schedulePayload.length > 0) {
    const scheduleInsert = await supabase
      .from('schedule_items')
      .insert(schedulePayload)
      .select('*');

    if (scheduleInsert.error && isMissingScheduleDocumentRelationColumn(scheduleInsert.error)) {
      const fallbackPayload = schedulePayload.map(item => {
        const fallbackItem = { ...item };
        delete fallbackItem.related_document_id;
        return fallbackItem;
      });
      const fallbackInsert = await supabase
        .from('schedule_items')
        .insert(fallbackPayload)
        .select('*');
      if (fallbackInsert.error) throw fallbackInsert.error;
      insertedScheduleItems = (fallbackInsert.data ?? []) as DbScheduleItem[];
    } else {
      if (scheduleInsert.error) throw scheduleInsert.error;
      insertedScheduleItems = (scheduleInsert.data ?? []) as DbScheduleItem[];
    }
    
    // Procesar gastos automáticos para actividades con costo
    for (const item of insertedScheduleItems) {
      const hasActiveExpense = await hasActiveLinkedExpense(item.cost_split_expense_id);
      if (item.cost && item.cost_payer_id && !hasActiveExpense) {
        try {
          const { createExpenseFromActivity } = await import('./activityExpense');
          const expenseId = await createExpenseFromActivity(
            item.id,
            itineraryId,
            item.activity,
            item.cost,
            item.cost_currency ?? 'EUR',
            item.cost_payer_id,
            'equal',
          );

          // Actualizar el schedule_item con el expense_id
          await supabase
            .from('schedule_items')
            .update({ cost_split_expense_id: expenseId })
            .eq('id', item.id)
            .is('deleted_at', null);
        } catch (err) {
          console.error(`Error creando gasto para actividad "${item.activity}":`, err);

          // Evita dejar enlace roto si no se pudo recrear el gasto.
          await supabase
            .from('schedule_items')
            .update({ cost_split_expense_id: null })
            .eq('id', item.id)
            .is('deleted_at', null);

          // No lanzamos el error para no bloquear el guardado del itinerario
        }
      }
    }
  }
  if (notePayload.length > 0) {
    const { error: notesError } = await supabase.from('day_notes').insert(notePayload);
    if (notesError) throw notesError;
  }

  if (seed.locations.length > 0) {
    const { error: locationsError } = await supabase
      .from('locations')
      .insert(seed.locations.map(location => ({ ...location, itinerary_id: itineraryId })));
    if (locationsError) throw locationsError;
  }
  if (seed.routes.length > 0) {
    const { error: routesError } = await supabase
      .from('routes')
      .insert(seed.routes.map(route => ({ ...route, itinerary_id: itineraryId })));
    if (routesError) throw routesError;
  }
  if (seed.flights.length > 0) {
    const { data: insertedFlights, error: flightsError } = await supabase
      .from('flights')
      .insert(seed.flights.map(flight => ({ ...flight, itinerary_id: itineraryId })))
      .select('*');
    if (flightsError) throw flightsError;

    const flightIdByOrder = new Map<number, string>();
    (insertedFlights as DbFlight[]).forEach(flight => {
      flightIdByOrder.set(flight.order_index ?? 0, flight.id);
    });

    const flightSegmentPayload = seed.flightSegments.map(segment => ({
      flight_id: flightIdByOrder.get(segment.flightOrder) ?? '',
      order_index: segment.order_index,
      airline: segment.airline ?? null,
      airline_code: segment.airline_code ?? null,
      flight_number: segment.flight_number ?? null,
      departure_airport: segment.departure_airport,
      departure_city: segment.departure_city,
      departure_time: segment.departure_time,
      departure_terminal: segment.departure_terminal ?? null,
      departure_lat: segment.departure_lat ?? null,
      departure_lng: segment.departure_lng ?? null,
      arrival_airport: segment.arrival_airport,
      arrival_city: segment.arrival_city,
      arrival_time: segment.arrival_time,
      arrival_terminal: segment.arrival_terminal ?? null,
      arrival_lat: segment.arrival_lat ?? null,
      arrival_lng: segment.arrival_lng ?? null,
      duration: segment.duration,
    }));

    if (flightSegmentPayload.length > 0) {
      const { error: segmentsError } = await supabase
        .from('flight_segments')
        .insert(flightSegmentPayload);
      if (segmentsError) throw segmentsError;
    }
  }

  const { data: insertedLists, error: listsError } = await supabase
    .from('itinerary_lists')
    .insert(seed.lists.map(list => ({ ...list, itinerary_id: itineraryId })))
    .select('*');
  if (listsError) throw listsError;

  const listIdByKey = new Map<string, string>();
  (insertedLists as DbItineraryList[]).forEach(list => {
    listIdByKey.set(list.section_key, list.id);
  });

  const listItemPayload = seed.listItems.map(item => ({
    list_id: listIdByKey.get(item.listKey) ?? '',
    text: item.text,
    order_index: item.order_index,
  }));
  if (listItemPayload.length > 0) {
    const { error: listItemsError } = await supabase.from('itinerary_list_items').insert(listItemPayload);
    if (listItemsError) throw listItemsError;
  }

  if (seed.phrases.length > 0) {
    const { error: phraseError } = await supabase
      .from('phrases')
      .insert(seed.phrases.map(phrase => ({ ...phrase, itinerary_id: itineraryId })));
    if (phraseError) throw phraseError;
  }

  if (seed.budgetTiers.length > 0) {
    const { error: budgetError } = await supabase
      .from('budget_tiers')
    .insert(seed.budgetTiers.map(tier => ({ ...tier, itinerary_id: itineraryId })));
    if (budgetError) throw budgetError;
  }

  const { data: insertedTags, error: tagsError } = await supabase
    .from('tags')
    .insert(seed.tags.map(tag => ({ ...tag, itinerary_id: itineraryId })))
    .select('*');
  if (tagsError) throw tagsError;

  const tagIdBySlug = new Map<string, string>();
  (insertedTags as DbTag[]).forEach(tag => {
    tagIdBySlug.set(tag.slug, tag.id);
  });

  const dayTagPayload = seed.dayTags.map(item => ({
    day_id: dayIdByOrder.get(item.dayOrder) ?? '',
    tag_id: tagIdBySlug.get(item.tagSlug) ?? '',
  }));
  if (dayTagPayload.length > 0) {
    const { error: dayTagsError } = await supabase.from('day_tags').insert(dayTagPayload);
    if (dayTagsError) throw dayTagsError;
  }

  if (insertedScheduleItems.length > 0 && seed.scheduleItemTags.length > 0) {
    const dayOrderById = new Map<string, number>();
    dayIdByOrder.forEach((dayId, order) => {
      dayOrderById.set(dayId, order);
    });
    const scheduleIdByOrder = new Map<string, string>();
    insertedScheduleItems.forEach(item => {
      const dayOrder = dayOrderById.get(item.day_id);
      if (dayOrder === undefined) return;
      scheduleIdByOrder.set(`${dayOrder}:${item.order_index}`, item.id);
    });
    const scheduleTagPayload = seed.scheduleItemTags
      .map(tag => ({
        schedule_item_id: scheduleIdByOrder.get(`${tag.dayOrder}:${tag.orderIndex}`) ?? '',
        tag_id: tagIdBySlug.get(tag.tagSlug) ?? '',
      }))
      .filter(row => row.schedule_item_id && row.tag_id);
    if (scheduleTagPayload.length > 0) {
      const { error: scheduleTagError } = await supabase
        .from('schedule_item_tags')
        .insert(scheduleTagPayload);
      if (scheduleTagError) throw scheduleTagError;
    }
  }

  const seeded = await fetchItineraryById(itineraryId);
  if (!seeded) {
    throw new Error('No se pudo cargar el itinerario recién creado.');
  }
  return seeded;
}

export async function seedUserItinerary(userId: string, base: TravelItinerary): Promise<TravelItinerary> {
  const existing = await fetchSingleItinerary(userId);
  if (existing) {
    const current = await fetchUserItinerary(userId);
    if (current) return current;
  }
  return createItineraryAndSeed(userId, base);
}

export async function createItineraryFromTemplate(
  userId: string,
  base: TravelItinerary,
): Promise<TravelItinerary> {
  return createItineraryAndSeed(userId, base);
}

export async function saveUserItinerary(
  userId: string,
  updated: TravelItinerary,
  itineraryId?: string,
): Promise<TravelItinerary> {
  const targetId = itineraryId ?? updated.id ?? null;
  const existing = targetId
    ? await supabase.from('itineraries').select('*').eq('id', targetId).is('deleted_at', null).single()
    : { data: await fetchSingleItinerary(userId), error: null };
  if (existing.error) throw existing.error;
  if (!existing.data) {
    return seedUserItinerary(userId, updated);
  }
  const role = await getUserRole(userId, existing.data.id as string);
  if (!role || role === 'viewer') {
    throw new Error('No tienes permisos para editar este itinerario.');
  }

  const itineraryIdResolved = existing.data.id as string;

  const updatePayload = {
    title: updated.title,
    ...(() => {
      const resolvedDates = resolveDateFields({
        startDate: updated.startDate,
        endDate: updated.endDate,
        dateRange: updated.dateRange,
      });
      return {
        date_range: resolvedDates.dateRange,
        start_date: resolvedDates.startDate,
        end_date: resolvedDates.endDate,
      };
    })(),
    intro: updated.intro,
    cover_image: updated.coverImage ?? null,
    updated_at: new Date().toISOString(),
  };

  const updateResult = await supabase
    .from('itineraries')
    .update(updatePayload)
    .eq('id', itineraryIdResolved);

  if (updateResult.error) throw updateResult.error;

  const seed = buildSeedPayloads(updated, itineraryIdResolved);

  const daysResult = await supabase
    .from('days')
    .select('id')
    .eq('itinerary_id', itineraryIdResolved)
    .is('deleted_at', null);
  if (daysResult.error) throw daysResult.error;
  const dayIds = (daysResult.data ?? []).map(row => row.id as string);

  if (dayIds.length > 0) {
    const existingScheduleCountResult = await supabase
      .from('schedule_items')
      .select('id', { head: true, count: 'exact' })
      .in('day_id', dayIds)
      .is('deleted_at', null);
    if (existingScheduleCountResult.error) throw existingScheduleCountResult.error;

    const existingScheduleCount = existingScheduleCountResult.count ?? 0;
    if (existingScheduleCount > 0 && seed.scheduleItems.length === 0) {
      throw new Error(
        'Guardado bloqueado para evitar perder actividades: el itinerario actual tiene horarios guardados, pero el payload entrante no incluye ninguno. Recarga la pagina e intentalo de nuevo.',
      );
    }
  }

  const listsResult = await supabase
    .from('itinerary_lists')
    .select('id')
    .eq('itinerary_id', itineraryIdResolved)
    .is('deleted_at', null);
  if (listsResult.error) throw listsResult.error;
  const listIds = (listsResult.data ?? []).map(row => row.id as string);

  if (dayIds.length > 0) {
    // Primero, obtener los expense_ids vinculados a schedule_items que se van a borrar
    const { data: scheduleItems, error: fetchScheduleError } = await supabase
      .from('schedule_items')
      .select('cost_split_expense_id')
      .in('day_id', dayIds)
      .is('deleted_at', null)
      .not('cost_split_expense_id', 'is', null);
    
    if (!fetchScheduleError && scheduleItems && scheduleItems.length > 0) {
      const expenseIds = scheduleItems
        .map(item => item.cost_split_expense_id)
        .filter(id => id !== null) as string[];
      
      if (expenseIds.length > 0) {
        // Borrar los gastos vinculados
        const { error: expenseDeleteError } = await supabase
          .from('split_expenses')
          .delete()
          .in('id', expenseIds);
        
        if (expenseDeleteError) console.error('Error borrando gastos vinculados:', expenseDeleteError);
      }
    }
    
    const { error: dayTagsError } = await supabase
      .from('day_tags')
      .delete()
      .in('day_id', dayIds)
      .is('deleted_at', null);
    if (dayTagsError) throw dayTagsError;
    const { error: scheduleError } = await supabase
      .from('schedule_items')
      .delete()
      .in('day_id', dayIds)
      .is('deleted_at', null);
    if (scheduleError) throw scheduleError;
    const { error: notesError } = await supabase
      .from('day_notes')
      .delete()
      .in('day_id', dayIds)
      .is('deleted_at', null);
    if (notesError) throw notesError;
  }

  if (listIds.length > 0) {
    const { error: listItemsError } = await supabase
      .from('itinerary_list_items')
      .delete()
      .in('list_id', listIds)
      .is('deleted_at', null);
    if (listItemsError) throw listItemsError;
  }

  const deleteResults = await Promise.all([
    supabase.from('days').delete().eq('itinerary_id', itineraryIdResolved).is('deleted_at', null),
    supabase.from('tags').delete().eq('itinerary_id', itineraryIdResolved).is('deleted_at', null),
    supabase.from('locations').delete().eq('itinerary_id', itineraryIdResolved).is('deleted_at', null),
    supabase.from('routes').delete().eq('itinerary_id', itineraryIdResolved).is('deleted_at', null),
    supabase.from('flights').delete().eq('itinerary_id', itineraryIdResolved).is('deleted_at', null),
    supabase.from('itinerary_lists').delete().eq('itinerary_id', itineraryIdResolved).is('deleted_at', null),
    supabase.from('phrases').delete().eq('itinerary_id', itineraryIdResolved).is('deleted_at', null),
    supabase.from('budget_tiers').delete().eq('itinerary_id', itineraryIdResolved).is('deleted_at', null),
  ]);
  const deleteError = deleteResults.find(result => result.error)?.error;
  if (deleteError) throw deleteError;

  const { data: insertedDays, error: daysError } = await supabase
    .from('days')
    .insert(seed.days.map(day => ({ ...day, itinerary_id: itineraryIdResolved })))
    .select('*');
  if (daysError) throw daysError;

  const dayIdByOrder = new Map<number, string>();
  (insertedDays as DbDay[]).forEach(day => {
    dayIdByOrder.set(day.order_index, day.id);
  });

  const schedulePayload = seed.scheduleItems.map(item => ({
    day_id: dayIdByOrder.get(item.dayOrder) ?? '',
    time: item.time,
    activity: item.activity,
    link: item.link ?? null,
    map_link: item.map_link ?? null,
    lat: item.lat,
    lng: item.lng,
    order_index: item.order_index,
    cost: item.cost,
    cost_currency: item.cost_currency,
    cost_payer_id: item.cost_payer_id,
    cost_split_expense_id: item.cost_split_expense_id,
    related_document_id: item.related_document_id,
  })).filter(item => item.day_id);
  const notePayload = seed.dayNotes.map(item => ({
    day_id: dayIdByOrder.get(item.dayOrder) ?? '',
    note: item.note,
    order_index: item.order_index,
  })).filter(item => item.day_id);

  let insertedScheduleItems: DbScheduleItem[] = [];
  if (schedulePayload.length > 0) {
    const scheduleInsert = await supabase
      .from('schedule_items')
      .insert(schedulePayload)
      .select('*');

    if (scheduleInsert.error && isMissingScheduleDocumentRelationColumn(scheduleInsert.error)) {
      const fallbackPayload = schedulePayload.map(item => {
        const fallbackItem = { ...item };
        delete fallbackItem.related_document_id;
        return fallbackItem;
      });
      const fallbackInsert = await supabase
        .from('schedule_items')
        .insert(fallbackPayload)
        .select('*');
      if (fallbackInsert.error) throw fallbackInsert.error;
      insertedScheduleItems = (fallbackInsert.data ?? []) as DbScheduleItem[];
    } else {
      if (scheduleInsert.error) throw scheduleInsert.error;
      insertedScheduleItems = (scheduleInsert.data ?? []) as DbScheduleItem[];
    }
    
    // Procesar gastos automáticos para actividades con costo
    for (const item of insertedScheduleItems) {
      const hasActiveExpense = await hasActiveLinkedExpense(item.cost_split_expense_id);
      if (item.cost && item.cost_payer_id && !hasActiveExpense) {
        try {
          const { createExpenseFromActivity } = await import('./activityExpense');
          const expenseId = await createExpenseFromActivity(
            item.id,
            itineraryIdResolved,
            item.activity,
            item.cost,
            item.cost_currency ?? 'EUR',
            item.cost_payer_id,
            'equal',
          );

          // Actualizar el schedule_item con el expense_id
          await supabase
            .from('schedule_items')
            .update({ cost_split_expense_id: expenseId })
            .eq('id', item.id)
            .is('deleted_at', null);
        } catch (err) {
          console.error(`Error creando gasto para actividad "${item.activity}":`, err);

          // Evita dejar enlace roto si no se pudo recrear el gasto.
          await supabase
            .from('schedule_items')
            .update({ cost_split_expense_id: null })
            .eq('id', item.id)
            .is('deleted_at', null);

          // No lanzamos el error para no bloquear el guardado del itinerario
        }
      }
    }
  }
  if (notePayload.length > 0) {
    const { error: notesError } = await supabase.from('day_notes').insert(notePayload);
    if (notesError) throw notesError;
  }

  if (seed.locations.length > 0) {
    const { error: locationsError } = await supabase
      .from('locations')
      .insert(seed.locations.map(location => ({ ...location, itinerary_id: itineraryIdResolved })));
    if (locationsError) throw locationsError;
  }
  if (seed.routes.length > 0) {
    const { error: routesError } = await supabase
      .from('routes')
      .insert(seed.routes.map(route => ({ ...route, itinerary_id: itineraryIdResolved })));
    if (routesError) throw routesError;
  }
  if (seed.flights.length > 0) {
    const { data: insertedFlights, error: flightsError } = await supabase
      .from('flights')
      .insert(seed.flights.map(flight => ({ ...flight, itinerary_id: itineraryIdResolved })))
      .select('*');
    if (flightsError) throw flightsError;

    const flightIdByOrder = new Map<number, string>();
    (insertedFlights as DbFlight[]).forEach(flight => {
      flightIdByOrder.set(flight.order_index ?? 0, flight.id);
    });

    const flightSegmentPayload = seed.flightSegments.map(segment => ({
      flight_id: flightIdByOrder.get(segment.flightOrder) ?? '',
      order_index: segment.order_index,
      airline: segment.airline ?? null,
      airline_code: segment.airline_code ?? null,
      flight_number: segment.flight_number ?? null,
      departure_airport: segment.departure_airport,
      departure_city: segment.departure_city,
      departure_time: segment.departure_time,
      departure_terminal: segment.departure_terminal ?? null,
      departure_lat: segment.departure_lat ?? null,
      departure_lng: segment.departure_lng ?? null,
      arrival_airport: segment.arrival_airport,
      arrival_city: segment.arrival_city,
      arrival_time: segment.arrival_time,
      arrival_terminal: segment.arrival_terminal ?? null,
      arrival_lat: segment.arrival_lat ?? null,
      arrival_lng: segment.arrival_lng ?? null,
      duration: segment.duration,
    }));

    if (flightSegmentPayload.length > 0) {
      const { error: segmentsError } = await supabase
        .from('flight_segments')
        .insert(flightSegmentPayload);
      if (segmentsError) throw segmentsError;
    }
  }

  const { data: insertedLists, error: listsError } = await supabase
    .from('itinerary_lists')
    .insert(seed.lists.map(list => ({ ...list, itinerary_id: itineraryIdResolved })))
    .select('*');
  if (listsError) throw listsError;

  const listIdByKey = new Map<string, string>();
  (insertedLists as DbItineraryList[]).forEach(list => {
    listIdByKey.set(list.section_key, list.id);
  });

  const listItemPayload = seed.listItems.map(item => ({
    list_id: listIdByKey.get(item.listKey) ?? '',
    text: item.text,
    order_index: item.order_index,
  })).filter(item => item.list_id);
  if (listItemPayload.length > 0) {
    const { error: listItemsError } = await supabase.from('itinerary_list_items').insert(listItemPayload);
    if (listItemsError) throw listItemsError;
  }

  if (seed.phrases.length > 0) {
    const { error: phraseError } = await supabase
      .from('phrases')
      .insert(seed.phrases.map(phrase => ({ ...phrase, itinerary_id: itineraryIdResolved })));
    if (phraseError) throw phraseError;
  }

  if (seed.budgetTiers.length > 0) {
    const { error: budgetError } = await supabase
      .from('budget_tiers')
      .insert(seed.budgetTiers.map(tier => ({ ...tier, itinerary_id: itineraryIdResolved })));
    if (budgetError) throw budgetError;
  }

  const { data: insertedTags, error: tagsError } = await supabase
    .from('tags')
    .insert(seed.tags.map(tag => ({ ...tag, itinerary_id: itineraryIdResolved })))
    .select('*');
  if (tagsError) throw tagsError;

  const tagIdBySlug = new Map<string, string>();
  (insertedTags as DbTag[]).forEach(tag => {
    tagIdBySlug.set(tag.slug, tag.id);
  });

  const dayTagPayload = seed.dayTags.map(item => ({
    day_id: dayIdByOrder.get(item.dayOrder) ?? '',
    tag_id: tagIdBySlug.get(item.tagSlug) ?? '',
  })).filter(row => row.day_id && row.tag_id);
  if (dayTagPayload.length > 0) {
    const { error: dayTagsError } = await supabase.from('day_tags').insert(dayTagPayload);
    if (dayTagsError) throw dayTagsError;
  }

  if (insertedScheduleItems.length > 0 && seed.scheduleItemTags.length > 0) {
    const dayOrderById = new Map<string, number>();
    dayIdByOrder.forEach((dayId, order) => {
      dayOrderById.set(dayId, order);
    });
    const scheduleIdByOrder = new Map<string, string>();
    insertedScheduleItems.forEach(item => {
      const dayOrder = dayOrderById.get(item.day_id);
      if (dayOrder === undefined) return;
      scheduleIdByOrder.set(`${dayOrder}:${item.order_index}`, item.id);
    });
    const scheduleTagPayload = seed.scheduleItemTags
      .map(tag => ({
        schedule_item_id: scheduleIdByOrder.get(`${tag.dayOrder}:${tag.orderIndex}`) ?? '',
        tag_id: tagIdBySlug.get(tag.tagSlug) ?? '',
      }))
      .filter(row => row.schedule_item_id && row.tag_id);
    if (scheduleTagPayload.length > 0) {
      const { error: scheduleTagError } = await supabase
        .from('schedule_item_tags')
        .insert(scheduleTagPayload);
      if (scheduleTagError) throw scheduleTagError;
    }
  }

  const reloaded = await fetchUserItinerary(userId);
  if (!reloaded) throw new Error('No se pudo recargar el itinerario guardado.');
  return reloaded;
}

