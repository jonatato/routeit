import type { TravelItinerary, ItineraryDay, ScheduleItem } from '../data/itinerary';
import { supabase } from '../lib/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

type AiItineraryAnswers = {
  destination: string;
  startDate: string;
  days: number;
  travelers: {
    count: number;
    groupType: string;
  };
  budget: 'economy' | 'mid' | 'premium';
  pace: 'relaxed' | 'balanced' | 'intense';
  interests: string[];
  mustDo?: string;
  constraints?: string;
  language?: string;
};

type AiItineraryDraft = {
  trip: {
    title: string;
    dateRange: string;
    intro: string;
    startDate: string;
    days: number;
    budgetLevel: 'economy' | 'mid' | 'premium';
    pace: 'relaxed' | 'balanced' | 'intense';
    travelers: { count: number; groupType: string };
    interests: string[];
  };
  cities: Array<{
    city: string;
    days: number;
    region: string;
    notes: string[];
    highlights: string[];
  }>;
  days?: Array<{
    date: string;
    city: string;
    kind: 'city' | 'travel' | 'flight';
    plan: string;
    notes: string[];
    tags?: string[];
    schedule: Array<{
      time: string;
      activity: string;
      tags?: string[];
    }>;
  }>;
  tagsCatalog?: Array<{ name: string; slug: string; color?: string }>;
  phrases?: Array<{ spanish: string; pinyin: string; chinese: string }>;
  extras: {
    foods: string[];
    tips: string[];
    avoid: string[];
    packing: string[];
    transport: string[];
    safety: string[];
    utilities?: string[];
    money?: string[];
    connectivity?: string[];
    etiquette?: string[];
    weather?: string[];
    scams?: string[];
    budgetTips?: string[];
    emergency?: string[];
  };
};

const defaultLegacyFlight = {
  date: '',
  fromTime: '',
  toTime: '',
  fromCity: '',
  toCity: '',
  duration: '',
  stops: '',
};

const addDays = (dateString: string, days: number) => {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const buildDayLabel = (index: number) => `Dia ${index + 1}`;

const buildMapsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const mapSchedule = (
  schedule: AiItineraryDraft['days'][number]['schedule'],
  city: string,
): ScheduleItem[] =>
  schedule.map(item => ({
    time: item.time,
    activity: item.activity,
    tags: item.tags ?? [],
    mapLink: buildMapsUrl(`${item.activity} ${city}`.trim()),
  }));

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const uniqueValues = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const buildBudgetTiers = (level: AiItineraryDraft['trip']['budgetLevel']) => {
  if (level === 'economy') {
    return [
      { label: 'Basico', daily: 35, tone: 'secondary' as const },
      { label: 'Comodo', daily: 65, tone: 'primary' as const },
      { label: 'Premium', daily: 120, tone: 'accent' as const },
    ];
  }
  if (level === 'premium') {
    return [
      { label: 'Comodo', daily: 80, tone: 'secondary' as const },
      { label: 'Premium', daily: 140, tone: 'primary' as const },
      { label: 'Lujo', daily: 220, tone: 'accent' as const },
    ];
  }
  return [
    { label: 'Basico', daily: 50, tone: 'secondary' as const },
    { label: 'Comodo', daily: 90, tone: 'primary' as const },
    { label: 'Premium', daily: 160, tone: 'accent' as const },
  ];
};

export async function generateAiItinerary(answers: AiItineraryAnswers): Promise<AiItineraryDraft> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error('Sesion expirada. Vuelve a iniciar sesion.');
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan las variables de entorno de Supabase.');
  }
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-itinerary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ answers }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error en la funcion de IA.');
  }
  const payload = await response.json();
  if (!payload?.data) throw new Error('Respuesta de IA vacia.');
  return payload.data as AiItineraryDraft;
}

export function mapAiDraftToTravelItinerary(draft: AiItineraryDraft): TravelItinerary {
  const trip = draft.trip;
  const baseDays = draft.days ?? [];
  const days: ItineraryDay[] = baseDays.map((day, index) => ({
    id: `day-${index + 1}`,
    dayLabel: buildDayLabel(index),
    date: day.date,
    city: day.city,
    plan: day.plan,
    notes: day.notes ?? [],
    kind: day.kind,
    schedule: mapSchedule(day.schedule ?? [], day.city),
    tags: day.tags ?? [],
  }));

  const route = draft.cities?.length
    ? draft.cities.map(item => item.city)
    : Array.from(new Set(baseDays.map(day => day.city)));

  const dateRange = trip.dateRange || `${trip.startDate} - ${addDays(trip.startDate, trip.days - 1)}`;

  const tagsCatalog = draft.tagsCatalog && draft.tagsCatalog.length > 0
    ? draft.tagsCatalog.map(tag => ({
        name: tag.name,
        slug: tag.slug || normalizeSlug(tag.name),
        color: tag.color,
      }))
    : uniqueValues(
        days.flatMap(day => [
          ...(day.tags ?? []),
          ...day.schedule.flatMap(item => item.tags ?? []),
        ]),
      ).map(tag => ({
        name: tag,
        slug: normalizeSlug(tag),
      }));

  return {
    title: trip.title,
    dateRange,
    intro: trip.intro,
    days,
    budgetTiers: buildBudgetTiers(trip.budgetLevel),
    foods: draft.extras?.foods ?? [],
    tips: draft.extras?.tips ?? [],
    avoid: draft.extras?.avoid ?? [],
    utilities: draft.extras?.utilities ?? [],
    packing: draft.extras?.packing ?? [],
    money: draft.extras?.money ?? [],
    connectivity: draft.extras?.connectivity ?? [],
    transport: draft.extras?.transport ?? [],
    safety: draft.extras?.safety ?? [],
    etiquette: draft.extras?.etiquette ?? [],
    weather: draft.extras?.weather ?? [],
    scams: draft.extras?.scams ?? [],
    budgetTips: draft.extras?.budgetTips ?? [],
    emergency: draft.extras?.emergency ?? [],
    phrases: draft.phrases ?? [],
    tagsCatalog,
    locations: [],
    route,
    flights: {
      outbound: { ...defaultLegacyFlight },
      inbound: { ...defaultLegacyFlight },
    },
  };
}

export async function enrichItineraryWithMaps(
  itinerary: TravelItinerary,
  draft: AiItineraryDraft,
): Promise<TravelItinerary> {
  const cityEntries = (draft.cities?.length ? draft.cities : [])
    .map(item => ({
      city: item.city,
      query: `${item.city}${item.region ? `, ${item.region}` : ''}`.trim(),
    }))
    .filter(item => item.city && item.query);

  const fallbackCities = uniqueValues(itinerary.route).map(city => ({ city, query: city }));
  const cities = cityEntries.length > 0 ? cityEntries : fallbackCities;

  const locations = await Promise.all(
    cities.map(async item => {
      const url = buildMapsUrl(item.query);
      const { data, error } = await supabase.functions.invoke('resolve-maps', {
        body: { url },
      });
      if (error || !data?.lat || !data?.lng) {
        return null;
      }
      return {
        city: item.city,
        label: item.query,
        lat: data.lat as number,
        lng: data.lng as number,
      };
    }),
  );

  const filteredLocations = locations.filter(Boolean) as TravelItinerary['locations'];
  if (filteredLocations.length === 0) return itinerary;

  return {
    ...itinerary,
    locations: filteredLocations,
    route: filteredLocations.map(loc => loc.city),
  };
}

export type { AiItineraryAnswers, AiItineraryDraft };
