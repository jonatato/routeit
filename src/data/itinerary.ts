export type DayKind = 'flight' | 'travel' | 'city' | (string & {});

export interface ScheduleItem {
  time: string;
  activity: string;
  link?: string;
  mapLink?: string;
  lat?: number;
  lng?: number;
  tags?: string[];
  cost?: number;
  costCurrency?: string;
  costPayerId?: string;
  costSplitExpenseId?: string;
}

export interface ItineraryDay {
  id: string;
  dayLabel: string;
  date: string;
  city: string;
  plan: string;
  notes: string[];
  kind: DayKind;
  schedule: ScheduleItem[];
  tags?: string[];
}

export interface Phrase {
  spanish: string;
  pinyin: string;
  chinese: string;
}

export interface ItineraryLocation {
  city: string;
  label: string;
  lat: number;
  lng: number;
}

export interface TravelItinerary {
  id?: string;
  title: string;
  dateRange: string;
  intro: string;
  coverImage?: string;
  days: ItineraryDay[];
  budgetTiers: Array<{ label: string; daily: number; tone: 'secondary' | 'primary' | 'accent' }>;
  tagsCatalog?: Array<{ name: string; slug: string; color?: string }>;
  foods: string[];
  tips: string[];
  avoid: string[];
  utilities: string[];
  packing: string[];
  money: string[];
  connectivity: string[];
  transport: string[];
  safety: string[];
  etiquette: string[];
  weather: string[];
  scams: string[];
  budgetTips: string[];
  emergency: string[];
  phrases: Phrase[];
  locations: ItineraryLocation[];
  route: string[];
  flights: {
    outbound: {
      date: string;
      fromTime: string;
      toTime: string;
      fromCity: string;
      toCity: string;
      duration: string;
      stops: string;
    };
    inbound: {
      date: string;
      fromTime: string;
      toTime: string;
      fromCity: string;
      toCity: string;
      duration: string;
      stops: string;
    };
  };
}

export const chinaTrip: TravelItinerary = {
  title: 'Mi Viaje 2026',
  dateRange: 'Vie 9 Oct → Vie 31 Oct',
  intro: 'Itinerario completo con horarios sugeridos, organizado por día y por ciudad, pensado para minimizar traslados y maximizar experiencias.',
  coverImage: undefined,
  budgetTiers: [],
  tagsCatalog: [],
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
  locations: [],
  route: [],
  flights: {
    outbound: {
      date: '',
      fromTime: '',
      toTime: '',
      fromCity: '',
      toCity: '',
      duration: '',
      stops: '',
    },
    inbound: {
      date: '',
      fromTime: '',
      toTime: '',
      fromCity: '',
      toCity: '',
      duration: '',
      stops: '',
    },
  },
  days: [],
};
