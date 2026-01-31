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

// Flight segment represents a single leg of a flight (e.g., MAD -> CDG)
export interface FlightSegment {
  id: string;
  airline?: string;
  airlineCode?: string;
  flightNumber?: string;
  departureAirport: string;
  departureCity: string;
  departureTime: string;
  departureTerminal?: string;
  arrivalAirport: string;
  arrivalCity: string;
  arrivalTime: string;
  arrivalTerminal?: string;
  duration: string;
  departureLat?: number;
  departureLng?: number;
  arrivalLat?: number;
  arrivalLng?: number;
}

// Flight represents a complete flight which may have multiple segments (layovers)
export interface Flight {
  id: string;
  direction: 'outbound' | 'inbound' | 'oneway' | 'multi';
  label?: string; // Custom label like "Vuelo a Tokio"
  date: string;
  bookingReference?: string;
  seat?: string;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  status?: 'confirmed' | 'pending' | 'cancelled' | 'delayed';
  segments: FlightSegment[];
  // Computed from segments
  totalDuration?: string;
  stops?: number;
}

// Legacy flight format for backwards compatibility
export interface LegacyFlight {
  date: string;
  fromTime: string;
  toTime: string;
  fromCity: string;
  toCity: string;
  duration: string;
  stops: string;
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
  // New flexible flights array
  flightsList?: Flight[];
  // Legacy flights structure (for backwards compatibility)
  flights: {
    outbound: LegacyFlight;
    inbound: LegacyFlight;
  };
}

