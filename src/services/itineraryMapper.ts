import type { TravelItinerary } from '../data/itinerary';

export type DbItinerary = {
  id: string;
  user_id: string;
  title: string;
  date_range: string;
  intro: string;
};

export type DbDay = {
  id: string;
  itinerary_id: string;
  order_index: number;
  day_label: string;
  date_text: string;
  city: string;
  plan: string;
  kind: 'flight' | 'travel' | 'city';
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
  direction: 'outbound' | 'inbound';
  date_text: string;
  from_time: string;
  to_time: string;
  from_city: string;
  to_city: string;
  duration: string;
  stops: string;
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
    budgetTiers: args.budgetTiers
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map(tier => ({
        label: tier.label,
        daily: tier.daily,
        tone: tier.tone,
      })),
    tagsCatalog: args.tags.map(tag => ({ name: tag.name, slug: tag.slug })),
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

  const flights: FlightSeed[] = [
    {
      direction: 'outbound',
      date_text: itinerary.flights.outbound.date,
      from_time: itinerary.flights.outbound.fromTime,
      to_time: itinerary.flights.outbound.toTime,
      from_city: itinerary.flights.outbound.fromCity,
      to_city: itinerary.flights.outbound.toCity,
      duration: itinerary.flights.outbound.duration,
      stops: itinerary.flights.outbound.stops,
    },
    {
      direction: 'inbound',
      date_text: itinerary.flights.inbound.date,
      from_time: itinerary.flights.inbound.fromTime,
      to_time: itinerary.flights.inbound.toTime,
      from_city: itinerary.flights.inbound.fromCity,
      to_city: itinerary.flights.inbound.toCity,
      duration: itinerary.flights.inbound.duration,
      stops: itinerary.flights.inbound.stops,
    },
  ];

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
    ? itinerary.tagsCatalog
    : tagSlugs.map(slug => {
        const definition = defaultTagDefinitions.find(tag => tag.slug === slug);
        const label = definition?.name ?? slug.replace(/-/g, ' ');
        const name = label.charAt(0).toUpperCase() + label.slice(1);
        return { name, slug };
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
    lists,
    listItems,
    phrases,
    tags,
    dayTags,
    budgetTiers,
    scheduleItemTags,
  };
}
