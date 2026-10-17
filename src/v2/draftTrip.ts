import type { LegacyFlight, TravelItinerary } from '../data/itinerary';

const emptyFlight = (): LegacyFlight => ({
  date: '',
  fromTime: '',
  toTime: '',
  fromCity: '',
  toCity: '',
  duration: '',
  stops: '',
});

const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const dayCount = (startDate: string, endDate: string) => {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  const diff = Math.round((end - start) / 86_400_000);
  return Math.max(diff + 1, 1);
};

export type TripDraft = {
  title: string;
  startDate: string;
  endDate: string;
  cities: string[];
};

export function parseCityList(value: string) {
  return value
    .split(',')
    .map(city => city.trim())
    .filter(Boolean);
}

export function buildTripFromDraft(draft: TripDraft): TravelItinerary {
  const title = draft.title.trim() || 'Nuevo viaje';
  const cities = draft.cities.length > 0 ? draft.cities : ['Sin ciudad'];
  const count = dayCount(draft.startDate, draft.endDate);
  const days = Array.from({ length: count }, (_, index) => {
    const date = addDays(draft.startDate, index);
    const city = cities[Math.min(index, cities.length - 1)];
    return {
      id: `day-${index + 1}`,
      dayLabel: `Día ${index + 1}`,
      date,
      city,
      plan: `Día en ${city}`,
      notes: [],
      kind: 'city',
      schedule: [],
    };
  });

  return {
    title,
    startDate: draft.startDate,
    endDate: draft.endDate,
    dateRange: `${draft.startDate} – ${draft.endDate}`,
    intro: '',
    days,
    budgetTiers: [],
    foods: [],
    tips: [],
    avoid: [],
    utilities: [],
    packing: [],
    money: [],
    connectivity: [],
    transport: [],
    safety: [],
    etiquette: [],
    weather: [],
    scams: [],
    budgetTips: [],
    emergency: [],
    phrases: [],
    locations: cities.map((city, index) => ({
      city,
      label: city,
      lat: 0,
      lng: index,
    })),
    route: cities,
    flightsList: [],
    flights: { outbound: emptyFlight(), inbound: emptyFlight() },
  };
}
