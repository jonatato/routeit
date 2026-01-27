import type { TravelItinerary } from '../data/itinerary';
import { supabase } from '../lib/supabase';
import {
  buildSeedPayloads,
  mapDbToItinerary,
  type DbBudgetTier,
  type DbDay,
  type DbDayNote,
  type DbDayTag,
  type DbFlight,
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
    .eq('user_id', userId);
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
    const dateA = new Date(a.updated_at ?? a.created_at).getTime();
    const dateB = new Date(b.updated_at ?? b.created_at).getTime();
    return dateB - dateA; // Más reciente primero
  });

  // Retornar el más reciente
  return allItineraries[0];
}

async function fetchItineraryData(itinerary: DbItinerary): Promise<TravelItinerary> {
  const days = await supabase.from('days').select('*').eq('itinerary_id', itinerary.id);
  if (days.error) throw days.error;
  const dayIds = (days.data as DbDay[]).map(day => day.id);

  const lists = await supabase.from('itinerary_lists').select('*').eq('itinerary_id', itinerary.id);
  if (lists.error) throw lists.error;
  const listIds = (lists.data as DbItineraryList[]).map(list => list.id);

  const scheduleItems =
    dayIds.length > 0
      ? await supabase.from('schedule_items').select('*').in('day_id', dayIds)
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
      ? supabase.from('day_notes').select('*').in('day_id', dayIds)
      : supabase.from('day_notes').select('*').limit(0),
    supabase.from('tags').select('*').eq('itinerary_id', itinerary.id),
    dayIds.length > 0
      ? supabase.from('day_tags').select('*').in('day_id', dayIds)
      : supabase.from('day_tags').select('*').limit(0),
    scheduleItemIds.length > 0
      ? supabase.from('schedule_item_tags').select('*').in('schedule_item_id', scheduleItemIds)
      : supabase.from('schedule_item_tags').select('*').limit(0),
    supabase.from('locations').select('*').eq('itinerary_id', itinerary.id),
    supabase.from('routes').select('*').eq('itinerary_id', itinerary.id),
    supabase.from('flights').select('*').eq('itinerary_id', itinerary.id),
    listIds.length > 0
      ? supabase.from('itinerary_list_items').select('*').in('list_id', listIds)
      : supabase.from('itinerary_list_items').select('*').limit(0),
    supabase.from('phrases').select('*').eq('itinerary_id', itinerary.id),
    supabase.from('budget_tiers').select('*').eq('itinerary_id', itinerary.id),
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

async function getUserRole(userId: string, itineraryId: string) {
  const { data: owner } = await supabase
    .from('itineraries')
    .select('id')
    .eq('id', itineraryId)
    .eq('user_id', userId)
    .maybeSingle();
  if (owner) return 'owner';
  const { data: collaborator, error } = await supabase
    .from('itinerary_collaborators')
    .select('role')
    .eq('itinerary_id', itineraryId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return collaborator?.role ?? null;
}

export async function createEmptyItinerary(userId: string, title: string, dateRange: string): Promise<string> {
  const { data: created, error } = await supabase
    .from('itineraries')
    .insert({
      user_id: userId,
      title,
      date_range: dateRange,
      intro: 'Crea tu itinerario personalizado desde cero.',
    })
    .select('id')
    .single();

  if (error || !created) {
    throw error ?? new Error('No se pudo crear el itinerario.');
  }

  return created.id as string;
}

export async function seedUserItinerary(userId: string, base: TravelItinerary): Promise<TravelItinerary> {
  const existing = await fetchSingleItinerary(userId);
  if (existing) {
    const current = await fetchUserItinerary(userId);
    if (current) return current;
  }
  const { data: created, error } = await supabase
    .from('itineraries')
    .insert({
      user_id: userId,
      title: base.title,
      date_range: base.dateRange,
      intro: base.intro,
    })
    .select('*')
    .single();

  if (error || !created) {
    throw error ?? new Error('No se pudo crear el itinerario.');
  }

  const itineraryId = created.id as string;
  const seed = buildSeedPayloads(base, itineraryId);

  const { data: insertedDays, error: daysError } = await supabase
    .from('days')
    .insert(seed.days)
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
  }));
  const notePayload = seed.dayNotes.map(item => ({
    day_id: dayIdByOrder.get(item.dayOrder) ?? '',
    note: item.note,
    order_index: item.order_index,
  }));

  let insertedScheduleItems: DbScheduleItem[] = [];
  if (schedulePayload.length > 0) {
    const { data, error: scheduleError } = await supabase
      .from('schedule_items')
      .insert(schedulePayload)
      .select('*');
    if (scheduleError) throw scheduleError;
    insertedScheduleItems = (data ?? []) as DbScheduleItem[];
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
    const { error: flightsError } = await supabase
      .from('flights')
      .insert(seed.flights.map(flight => ({ ...flight, itinerary_id: itineraryId })));
    if (flightsError) throw flightsError;
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

  const seeded = await fetchUserItinerary(userId);
  if (!seeded) {
    throw new Error('No se pudo cargar el itinerario recién creado.');
  }
  return seeded;
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
  const { error: updateError } = await supabase
    .from('itineraries')
    .update({
      title: updated.title,
      date_range: updated.dateRange,
      intro: updated.intro,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itineraryIdResolved);
  if (updateError) throw updateError;

  const daysResult = await supabase.from('days').select('id').eq('itinerary_id', itineraryIdResolved);
  if (daysResult.error) throw daysResult.error;
  const dayIds = (daysResult.data ?? []).map(row => row.id as string);

  const listsResult = await supabase.from('itinerary_lists').select('id').eq('itinerary_id', itineraryIdResolved);
  if (listsResult.error) throw listsResult.error;
  const listIds = (listsResult.data ?? []).map(row => row.id as string);

  if (dayIds.length > 0) {
    const { error: dayTagsError } = await supabase.from('day_tags').delete().in('day_id', dayIds);
    if (dayTagsError) throw dayTagsError;
    const { error: scheduleError } = await supabase.from('schedule_items').delete().in('day_id', dayIds);
    if (scheduleError) throw scheduleError;
    const { error: notesError } = await supabase.from('day_notes').delete().in('day_id', dayIds);
    if (notesError) throw notesError;
  }

  if (listIds.length > 0) {
    const { error: listItemsError } = await supabase.from('itinerary_list_items').delete().in('list_id', listIds);
    if (listItemsError) throw listItemsError;
  }

  const deleteResults = await Promise.all([
    supabase.from('days').delete().eq('itinerary_id', itineraryIdResolved),
    supabase.from('tags').delete().eq('itinerary_id', itineraryIdResolved),
    supabase.from('locations').delete().eq('itinerary_id', itineraryIdResolved),
    supabase.from('routes').delete().eq('itinerary_id', itineraryIdResolved),
    supabase.from('flights').delete().eq('itinerary_id', itineraryIdResolved),
    supabase.from('itinerary_lists').delete().eq('itinerary_id', itineraryIdResolved),
    supabase.from('phrases').delete().eq('itinerary_id', itineraryIdResolved),
    supabase.from('budget_tiers').delete().eq('itinerary_id', itineraryIdResolved),
  ]);
  const deleteError = deleteResults.find(result => result.error)?.error;
  if (deleteError) throw deleteError;

  const seed = buildSeedPayloads(updated, itineraryIdResolved);

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
  }));
  const notePayload = seed.dayNotes.map(item => ({
    day_id: dayIdByOrder.get(item.dayOrder) ?? '',
    note: item.note,
    order_index: item.order_index,
  }));

  let insertedScheduleItems: DbScheduleItem[] = [];
  if (schedulePayload.length > 0) {
    const { data, error: scheduleError } = await supabase
      .from('schedule_items')
      .insert(schedulePayload)
      .select('*');
    if (scheduleError) throw scheduleError;
    insertedScheduleItems = (data ?? []) as DbScheduleItem[];
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
    const { error: flightsError } = await supabase
      .from('flights')
      .insert(seed.flights.map(flight => ({ ...flight, itinerary_id: itineraryId })));
    if (flightsError) throw flightsError;
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

  const reloaded = await fetchUserItinerary(userId);
  if (!reloaded) throw new Error('No se pudo recargar el itinerario guardado.');
  return reloaded;
}
