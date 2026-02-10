import type { TravelItinerary } from '../data/itinerary';

export type DbItinerary = {
  id: string;
  user_id: string;
  title: string;
  date_range: string;
  intro: string;
  cover_image?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type DbDay = {
  id: string;
  itinerary_id: string;
  order_index: number;
  day_label: string;
  date_text: string;
  city: string;
  plan: string;
  kind: string;
};

export type DbScheduleItem = {
  id: string;
  day_id: string;
  time: string;
  activity: string;
  link: string | null;
  map_link: string | null;
  lat: number | null;
  lng: number | null;
  order_index: number;
  cost: number | null;
  cost_currency: string | null;
  cost_payer_id: string | null;
  cost_split_expense_id: string | null;
};

export type DbDayNote = {
  id: string;
  day_id: string;
  note: string;
  order_index: number;
};

export type DbTag = {
  id: string;
  itinerary_id: string;
  name: string;
  slug: string;
  color?: string;
};

export type DbDayTag = {
  day_id: string;
  tag_id: string;
};

export type DbScheduleItemTag = {
  schedule_item_id: string;
  tag_id: string;
};

export type DbLocation = {
  id: string;
  itinerary_id: string;
  city: string;
  label: string;
  lat: number;
  lng: number;
  order_index: number;
};

export type DbRoute = {
  id: string;
  itinerary_id: string;
  city: string;
  order_index: number;
};

export type DbFlight = {
  id: string;
  itinerary_id: string;
  direction: 'outbound' | 'inbound' | 'oneway' | 'multi' | (string & {});
  date_text: string;
  from_time: string;
  to_time: string;
  from_city: string;
  to_city: string;
  duration: string;
  stops: string;
  label?: string | null;
  booking_reference?: string | null;
  seat?: string | null;
  cabin_class?: 'economy' | 'premium_economy' | 'business' | 'first' | null;
  status?: 'confirmed' | 'pending' | 'cancelled' | 'delayed' | null;
  total_duration?: string | null;
  stops_count?: number | null;
  order_index?: number | null;
};

export type DbFlightSegment = {
  id: string;
  flight_id: string;
  order_index: number;
  airline: string | null;
  airline_code: string | null;
  flight_number: string | null;
  departure_airport: string;
  departure_city: string;
  departure_time: string;
  departure_terminal: string | null;
  departure_lat: number | null;
  departure_lng: number | null;
  arrival_airport: string;
  arrival_city: string;
  arrival_time: string;
  arrival_terminal: string | null;
  arrival_lat: number | null;
  arrival_lng: number | null;
  duration: string;
};

export type DbItineraryList = {
  id: string;
  itinerary_id: string;
  section_key: string;
};

export type DbItineraryListItem = {
  id: string;
  list_id: string;
  text: string;
  order_index: number;
};

export type DbPhrase = {
  id: string;
  itinerary_id: string;
  spanish: string;
  pinyin: string;
  chinese: string;
  order_index: number;
};

export type DbBudgetTier = {
  id: string;
  itinerary_id: string;
  label: string;
  daily: number;
  tone: 'secondary' | 'primary' | 'accent';
  order_index: number;
};

export type DaySeed = Omit<DbDay, 'id'>;
export type ScheduleSeed = Omit<DbScheduleItem, 'id' | 'day_id'> & { dayOrder: number };
export type NoteSeed = Omit<DbDayNote, 'id' | 'day_id'> & { dayOrder: number };
export type TagSeed = Omit<DbTag, 'id' | 'itinerary_id'>;
export type DayTagSeed = { dayOrder: number; tagSlug: string };
export type ScheduleItemTagSeed = { dayOrder: number; orderIndex: number; tagSlug: string };
export type LocationSeed = Omit<DbLocation, 'id' | 'itinerary_id'>;
export type RouteSeed = Omit<DbRoute, 'id' | 'itinerary_id'>;
export type FlightSeed = Omit<DbFlight, 'id' | 'itinerary_id'>;
export type FlightSegmentSeed = Omit<DbFlightSegment, 'id' | 'flight_id'> & { flightOrder: number };
export type ListSeed = Omit<DbItineraryList, 'id' | 'itinerary_id'>;
export type ListItemSeed = Omit<DbItineraryListItem, 'id' | 'list_id'> & { listKey: string };
export type PhraseSeed = Omit<DbPhrase, 'id' | 'itinerary_id'>;
export type BudgetTierSeed = Omit<DbBudgetTier, 'id' | 'itinerary_id'>;

const listSections = [
  'foods',
  'tips',
  'avoid',
  'utilities',
  'packing',
  'money',
  'connectivity',
  'transport',
  'safety',
  'etiquette',
  'weather',
  'scams',
  'budgetTips',
  'emergency',
] as const;

const defaultTagDefinitions = [
  {
    slug: 'comida',
    name: 'Comida',
    keywords: ['comida', 'almuerzo', 'cena', 'desayuno', 'hotpot', 'snack', 'noodles', 'brunch'],
  },
  {
    slug: 'transporte',
    name: 'Transporte',
    keywords: ['tren', 'vuelo', 'traslado', 'taxi', 'metro', 'aeropuerto', 'estación', 'check-in'],
  },
  {
    slug: 'cultura',
    name: 'Cultura',
    keywords: ['templo', 'museo', 'histórico', 'hutong', 'ciudad prohibida', 'muralla', 'torre'],
  },
  {
    slug: 'naturaleza',
    name: 'Naturaleza',
    keywords: ['parque', 'montaña', 'mirador', 'cascada', 'río', 'jardín', 'sendero', 'paseo'],
  },
  {
    slug: 'compras',
    name: 'Compras',
    keywords: ['compras', 'mercado', 'road', 'street', 'shopping'],
  },
] as const;

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function mapDbToItinerary(args: {
  itinerary: DbItinerary;
  days: DbDay[];
  scheduleItems: DbScheduleItem[];
  dayNotes: DbDayNote[];
  tags: DbTag[];
  dayTags: DbDayTag[];
  scheduleItemTags: DbScheduleItemTag[];
  locations: DbLocation[];
  routes: DbRoute[];
  flights: DbFlight[];
  flightSegments: DbFlightSegment[];
  lists: DbItineraryList[];
  listItems: DbItineraryListItem[];
  phrases: DbPhrase[];
  budgetTiers: DbBudgetTier[];
}): TravelItinerary {
  const scheduleByDay = new Map<string, DbScheduleItem[]>();
  args.scheduleItems
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .forEach(item => {
      const list = scheduleByDay.get(item.day_id) ?? [];
      list.push(item);
      scheduleByDay.set(item.day_id, list);
    });

  const notesByDay = new Map<string, DbDayNote[]>();
  args.dayNotes
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .forEach(item => {
      const list = notesByDay.get(item.day_id) ?? [];
      list.push(item);
      notesByDay.set(item.day_id, list);
    });

  const listItemsByKey = new Map<string, string[]>();
  const listIdToKey = new Map(args.lists.map(list => [list.id, list.section_key]));
  args.listItems
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .forEach(item => {
      const key = listIdToKey.get(item.list_id);
      if (!key) return;
      const list = listItemsByKey.get(key) ?? [];
      list.push(item.text);
      listItemsByKey.set(key, list);
    });

  const segmentsByFlight = new Map<string, DbFlightSegment[]>();
  args.flightSegments
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .forEach(segment => {
      const list = segmentsByFlight.get(segment.flight_id) ?? [];
      list.push(segment);
      segmentsByFlight.set(segment.flight_id, list);
    });

  const flightsList = args.flights
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map(flight => {
      const mappedSegments = (segmentsByFlight.get(flight.id) ?? []).map(segment => ({
        id: segment.id,
        airline: segment.airline ?? undefined,
        airlineCode: segment.airline_code ?? undefined,
        flightNumber: segment.flight_number ?? undefined,
        departureAirport: segment.departure_airport,
        departureCity: segment.departure_city,
        departureTime: segment.departure_time,
        departureTerminal: segment.departure_terminal ?? undefined,
        departureLat: segment.departure_lat ?? undefined,
        departureLng: segment.departure_lng ?? undefined,
        arrivalAirport: segment.arrival_airport,
        arrivalCity: segment.arrival_city,
        arrivalTime: segment.arrival_time,
        arrivalTerminal: segment.arrival_terminal ?? undefined,
        arrivalLat: segment.arrival_lat ?? undefined,
        arrivalLng: segment.arrival_lng ?? undefined,
        duration: segment.duration,
      }));

      const fallbackSegments = mappedSegments.length > 0
        ? mappedSegments
        : [
            {
              id: `${flight.id}-segment`,
              departureAirport: flight.from_city ?? '',
              departureCity: flight.from_city ?? '',
              departureTime: flight.from_time ?? '',
              arrivalAirport: flight.to_city ?? '',
              arrivalCity: flight.to_city ?? '',
              arrivalTime: flight.to_time ?? '',
              duration: flight.duration ?? flight.total_duration ?? '',
            },
          ];

      return {
        id: flight.id,
        direction: flight.direction as 'outbound' | 'inbound' | 'oneway' | 'multi',
        label: flight.label ?? undefined,
        date: flight.date_text,
        bookingReference: flight.booking_reference ?? undefined,
        seat: flight.seat ?? undefined,
        cabinClass: flight.cabin_class ?? undefined,
        status: flight.status ?? undefined,
        totalDuration: flight.total_duration ?? undefined,
        stops: flight.stops_count ?? undefined,
        segments: fallbackSegments,
      };
    });

  const flightsByDirection = new Map(args.flights.map(flight => [flight.direction, flight]));
  const outbound = flightsByDirection.get('outbound');
  const inbound = flightsByDirection.get('inbound');
  const tagSlugById = new Map(args.tags.map(tag => [tag.id, tag.slug]));
  const tagsByScheduleItem = new Map<string, string[]>();
  args.scheduleItemTags.forEach(link => {
    const slug = tagSlugById.get(link.tag_id);
    if (!slug) return;
    const list = tagsByScheduleItem.get(link.schedule_item_id) ?? [];
    list.push(slug);
    tagsByScheduleItem.set(link.schedule_item_id, list);
  });
  const tagsByDayId = new Map<string, string[]>();
  args.dayTags.forEach(link => {
    const slug = tagSlugById.get(link.tag_id);
    if (!slug) return;
    const list = tagsByDayId.get(link.day_id) ?? [];
    list.push(slug);
    tagsByDayId.set(link.day_id, list);
  });

  return {
    id: args.itinerary.id,
    title: args.itinerary.title,
    dateRange: args.itinerary.date_range,
    intro: args.itinerary.intro,
    coverImage: args.itinerary.cover_image ?? undefined,
    budgetTiers: args.budgetTiers
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map(tier => ({
        label: tier.label,
        daily: tier.daily,
        tone: tier.tone,
      })),
    tagsCatalog: args.tags.map(tag => ({ name: tag.name, slug: tag.slug, color: tag.color ?? '#6366f1' })),
    days: args.days
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map(day => ({
        id: day.id,
        dayLabel: day.day_label,
        date: day.date_text,
        city: day.city,
        plan: day.plan,
        notes: (notesByDay.get(day.id) ?? []).map(note => note.note),
        kind: day.kind,
        schedule: (scheduleByDay.get(day.id) ?? []).map(item => ({
          time: item.time,
          activity: item.activity,
          link: item.link ?? undefined,
          mapLink: item.map_link ?? undefined,
          lat: item.lat ?? undefined,
          lng: item.lng ?? undefined,
          tags: tagsByScheduleItem.get(item.id) ?? [],
          cost: item.cost ?? undefined,
          costCurrency: item.cost_currency ?? undefined,
          costPayerId: item.cost_payer_id ?? undefined,
          costSplitExpenseId: item.cost_split_expense_id ?? undefined,
        })),
        tags: tagsByDayId.get(day.id) ?? [],
      })),
    foods: listItemsByKey.get('foods') ?? [],
    tips: listItemsByKey.get('tips') ?? [],
    avoid: listItemsByKey.get('avoid') ?? [],
    utilities: listItemsByKey.get('utilities') ?? [],
    packing: listItemsByKey.get('packing') ?? [],
    money: listItemsByKey.get('money') ?? [],
    connectivity: listItemsByKey.get('connectivity') ?? [],
    transport: listItemsByKey.get('transport') ?? [],
    safety: listItemsByKey.get('safety') ?? [],
    etiquette: listItemsByKey.get('etiquette') ?? [],
    weather: listItemsByKey.get('weather') ?? [],
    scams: listItemsByKey.get('scams') ?? [],
    budgetTips: listItemsByKey.get('budgetTips') ?? [],
    emergency: listItemsByKey.get('emergency') ?? [],
    phrases: args.phrases
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map(phrase => ({
        spanish: phrase.spanish,
        pinyin: phrase.pinyin,
        chinese: phrase.chinese,
      })),
    locations: args.locations
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map(location => ({
        city: location.city,
        label: location.label,
        lat: location.lat,
        lng: location.lng,
      })),
    route: args.routes
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map(route => route.city),
    flightsList,
    flights: {
      outbound: {
        date: outbound?.date_text ?? '',
        fromTime: outbound?.from_time ?? '',
        toTime: outbound?.to_time ?? '',
        fromCity: outbound?.from_city ?? '',
        toCity: outbound?.to_city ?? '',
        duration: outbound?.duration ?? '',
        stops: outbound?.stops ?? '',
      },
      inbound: {
        date: inbound?.date_text ?? '',
        fromTime: inbound?.from_time ?? '',
        toTime: inbound?.to_time ?? '',
        fromCity: inbound?.from_city ?? '',
        toCity: inbound?.to_city ?? '',
        duration: inbound?.duration ?? '',
        stops: inbound?.stops ?? '',
      },
    },
  };
}

export function buildSeedPayloads(itinerary: TravelItinerary, itineraryId: string) {
  const days: DaySeed[] = itinerary.days.map((day, index) => ({
    itinerary_id: itineraryId,
    order_index: index,
    day_label: day.dayLabel,
    date_text: day.date,
    city: day.city,
    plan: day.plan,
    kind: day.kind,
  }));

  const scheduleItems: ScheduleSeed[] = [];
  const dayNotes: NoteSeed[] = [];

  itinerary.days.forEach((day, dayIndex) => {
    day.schedule.forEach((item, index) => {
      scheduleItems.push({
        dayOrder: dayIndex,
        time: item.time,
        activity: item.activity,
        link: item.link ?? null,
        map_link: item.mapLink ?? null,
        lat: item.lat ?? null,
        lng: item.lng ?? null,
        order_index: index,
        cost: item.cost ?? null,
        cost_currency: item.costCurrency ?? null,
        cost_payer_id: item.costPayerId ?? null,
        cost_split_expense_id: item.costSplitExpenseId ?? null,
      });
    });
    day.notes.forEach((note, index) => {
      dayNotes.push({
        dayOrder: dayIndex,
        note,
        order_index: index,
      });
    });
  });

  const locations: LocationSeed[] = itinerary.locations.map((location, index) => ({
    city: location.city,
    label: location.label,
    lat: location.lat,
    lng: location.lng,
    order_index: index,
  }));

  const routes: RouteSeed[] = itinerary.route.map((city, index) => ({
    city,
    order_index: index,
  }));

  const hasLegacyFlightData = [itinerary.flights.outbound, itinerary.flights.inbound].some(flight =>
    [
      flight.date,
      flight.fromTime,
      flight.toTime,
      flight.fromCity,
      flight.toCity,
      flight.duration,
    ].some(value => Boolean(value && value.trim())),
  );

  const flightsSource = itinerary.flightsList && itinerary.flightsList.length > 0
    ? itinerary.flightsList
    : hasLegacyFlightData
      ? [
          {
            id: 'legacy-outbound',
            direction: 'outbound' as const,
            date: itinerary.flights.outbound.date,
            segments: [
              {
                id: 'legacy-outbound-seg-1',
                departureAirport: itinerary.flights.outbound.fromCity,
                departureCity: itinerary.flights.outbound.fromCity,
                departureTime: itinerary.flights.outbound.fromTime,
                arrivalAirport: itinerary.flights.outbound.toCity,
                arrivalCity: itinerary.flights.outbound.toCity,
                arrivalTime: itinerary.flights.outbound.toTime,
                duration: itinerary.flights.outbound.duration,
              },
            ],
            totalDuration: itinerary.flights.outbound.duration,
            stops: itinerary.flights.outbound.stops === 'Directo' ? 0 : 1,
          },
          {
            id: 'legacy-inbound',
            direction: 'inbound' as const,
            date: itinerary.flights.inbound.date,
            segments: [
              {
                id: 'legacy-inbound-seg-1',
                departureAirport: itinerary.flights.inbound.fromCity,
                departureCity: itinerary.flights.inbound.fromCity,
                departureTime: itinerary.flights.inbound.fromTime,
                arrivalAirport: itinerary.flights.inbound.toCity,
                arrivalCity: itinerary.flights.inbound.toCity,
                arrivalTime: itinerary.flights.inbound.toTime,
                duration: itinerary.flights.inbound.duration,
              },
            ],
            totalDuration: itinerary.flights.inbound.duration,
            stops: itinerary.flights.inbound.stops === 'Directo' ? 0 : 1,
          },
        ]
      : [];

  const flights: FlightSeed[] = flightsSource.map((flight, index) => {
    const firstSegment = flight.segments[0];
    const lastSegment = flight.segments[flight.segments.length - 1];
    const stopsCount = flight.stops ?? Math.max(flight.segments.length - 1, 0);

    return {
      direction: flight.direction,
      date_text: flight.date,
      from_time: firstSegment?.departureTime ?? '',
      to_time: lastSegment?.arrivalTime ?? '',
      from_city: firstSegment?.departureCity ?? '',
      to_city: lastSegment?.arrivalCity ?? '',
      duration: flight.totalDuration ?? firstSegment?.duration ?? '',
      stops: stopsCount === 0 ? 'Directo' : `${stopsCount} escala${stopsCount > 1 ? 's' : ''}`,
      label: flight.label ?? null,
      booking_reference: flight.bookingReference ?? null,
      seat: flight.seat ?? null,
      cabin_class: flight.cabinClass ?? null,
      status: flight.status ?? 'confirmed',
      total_duration: flight.totalDuration ?? null,
      stops_count: stopsCount,
      order_index: index,
    };
  });

  const flightSegments: FlightSegmentSeed[] = flightsSource.flatMap((flight, flightOrder) =>
    flight.segments.map((segment, orderIndex) => ({
      flightOrder,
      order_index: orderIndex,
      airline: segment.airline ?? null,
      airline_code: segment.airlineCode ?? null,
      flight_number: segment.flightNumber ?? null,
      departure_airport: segment.departureAirport,
      departure_city: segment.departureCity,
      departure_time: segment.departureTime,
      departure_terminal: segment.departureTerminal ?? null,
      departure_lat: segment.departureLat ?? null,
      departure_lng: segment.departureLng ?? null,
      arrival_airport: segment.arrivalAirport,
      arrival_city: segment.arrivalCity,
      arrival_time: segment.arrivalTime,
      arrival_terminal: segment.arrivalTerminal ?? null,
      arrival_lat: segment.arrivalLat ?? null,
      arrival_lng: segment.arrivalLng ?? null,
      duration: segment.duration,
    })),
  );

  const lists: ListSeed[] = listSections.map(key => ({
    section_key: key,
  }));

  const listItems: ListItemSeed[] = listSections.flatMap(key => {
    const items = (itinerary as unknown as Record<string, string[]>)[key] ?? [];
    return items.map((text, index) => ({
      listKey: key,
      text,
      order_index: index,
    }));
  });

  const phrases: PhraseSeed[] = itinerary.phrases.map((phrase, index) => ({
    spanish: phrase.spanish,
    pinyin: phrase.pinyin,
    chinese: phrase.chinese,
    order_index: index,
  }));

  const budgetTiers: BudgetTierSeed[] = itinerary.budgetTiers.map((tier, index) => ({
    label: tier.label,
    daily: tier.daily,
    tone: tier.tone,
    order_index: index,
  }));

  const explicitTags =
    itinerary.days.some(day => (day.tags?.length ?? 0) > 0) ||
    itinerary.days.some(day => day.schedule.some(item => (item.tags?.length ?? 0) > 0));
  const tagSlugs = explicitTags
    ? Array.from(
        new Set(
          itinerary.days.flatMap(day => [
            ...(day.tags ?? []),
            ...day.schedule.flatMap(item => item.tags ?? []),
          ]),
        ),
      )
    : defaultTagDefinitions.map(tag => tag.slug);

  const tags: TagSeed[] = (itinerary.tagsCatalog && itinerary.tagsCatalog.length > 0
    ? itinerary.tagsCatalog.map(tag => ({ name: tag.name, slug: tag.slug, color: tag.color ?? '#6366f1' }))
    : tagSlugs.map(slug => {
        const definition = defaultTagDefinitions.find(tag => tag.slug === slug);
        const label = definition?.name ?? slug.replace(/-/g, ' ');
        const name = label.charAt(0).toUpperCase() + label.slice(1);
        return { name, slug, color: '#6366f1' };
      })) as TagSeed[];

  const dayTags: DayTagSeed[] = itinerary.days.flatMap((day, dayIndex) => {
    if (explicitTags) {
      return (day.tags ?? []).map(tag => ({ dayOrder: dayIndex, tagSlug: tag }));
    }
    const haystack = normalizeText(
      [day.city, day.plan, day.notes.join(' '), day.schedule.map(item => item.activity).join(' ')].join(
        ' ',
      ),
    );
    return defaultTagDefinitions
      .filter(tag => tag.keywords.some(keyword => haystack.includes(normalizeText(keyword))))
      .map(tag => ({
        dayOrder: dayIndex,
        tagSlug: tag.slug,
      }));
  });

  const scheduleItemTags: ScheduleItemTagSeed[] = itinerary.days.flatMap((day, dayIndex) =>
    day.schedule.flatMap((item, orderIndex) =>
      (item.tags ?? []).map(tagSlug => ({
        dayOrder: dayIndex,
        orderIndex,
        tagSlug,
      })),
    ),
  );

  return {
    days,
    scheduleItems,
    dayNotes,
    locations,
    routes,
    flights,
    flightSegments,
    lists,
    listItems,
    phrases,
    tags,
    dayTags,
    budgetTiers,
    scheduleItemTags,
  };
}
